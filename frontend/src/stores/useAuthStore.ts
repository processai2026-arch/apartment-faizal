import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, tokenStorage, type ApiSession } from '@/lib/api';
import type { User, UserRole, LoginCredentials } from '@/types/auth';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithOTP: (phone: string, otp: string) => Promise<boolean>;
  hydrateSession: () => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          if (!credentials.email || !credentials.password) return false;
          const session = await api.login(credentials.email, credentials.password);
          applySession(session);
          set({ user: normalizeUser(session.user), isAuthenticated: true, isLoading: false });
          return true;
        } catch {
          tokenStorage.clear();
          set({ isLoading: false, isAuthenticated: false, user: null });
          return false;
        }
      },

      loginWithOTP: async (phone: string, otp: string) => {
        set({ isLoading: true });
        try {
          const result = await api.verifyOtp(phone, 'login', otp);
          if ('accessToken' in result) {
            applySession(result);
            set({ user: normalizeUser(result.user), isAuthenticated: true, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      hydrateSession: async () => {
        if (!tokenStorage.getAccessToken()) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        set({ isLoading: true });
        try {
          const user = await api.me();
          set({ user: normalizeUser(user), isAuthenticated: true, isLoading: false });
        } catch {
          tokenStorage.clear();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      logout: () => {
        api.logout().finally(() => tokenStorage.clear());
        set({ user: null, isAuthenticated: false });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

function applySession(session: ApiSession) {
  tokenStorage.set(session.accessToken, session.refreshToken);
}

function normalizeUser(user: User): User {
  return {
    ...user,
    id: String(user.id),
  };
}

// Helper hook to get role-specific dashboard path
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/';
    case 'security':
      return '/security';
    case 'tenant':
      return '/tenant';
    default:
      return '/';
  }
}
