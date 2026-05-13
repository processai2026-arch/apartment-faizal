import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, LoginCredentials } from '@/types/auth';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithOTP: (phone: string, otp: string) => Promise<boolean>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

// Mock users - Admin, Security, and Tenant
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@officegate.com': {
    password: 'admin123',
    user: {
      id: 'U001',
      email: 'admin@officegate.com',
      phone: '+91 98765 00000',
      name: 'Admin User',
      role: 'admin',
      createdAt: '2024-01-01',
    },
  },
  'security@officegate.com': {
    password: 'security123',
    user: {
      id: 'U002',
      email: 'security@officegate.com',
      phone: '+91 98765 11111',
      name: 'Security Guard',
      role: 'security',
      createdAt: '2024-01-15',
    },
  },
  'tenant@officegate.com': {
    password: 'tenant123',
    user: {
      id: 'U003',
      email: 'tenant@officegate.com',
      phone: '+91 98765 22222',
      name: 'John Tenant',
      role: 'tenant',
      createdAt: '2024-02-01',
    },
  },
};

// Mock OTP verification (in real app, this would be server-side)
const mockOTPs: Record<string, string> = {
  '+91 98765 00000': '123456',
  '+91 98765 11111': '123456',
  '+91 98765 22222': '123456',
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const email = credentials.email?.toLowerCase();
        if (email && credentials.password) {
          const mockUser = mockUsers[email];
          if (mockUser && mockUser.password === credentials.password) {
            set({ 
              user: mockUser.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          }
        }
        
        set({ isLoading: false });
        return false;
      },

      loginWithOTP: async (phone: string, otp: string) => {
        set({ isLoading: true });
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Check if OTP matches
        if (mockOTPs[phone] === otp) {
          // Find user by phone
          const userEntry = Object.values(mockUsers).find(
            entry => entry.user.phone === phone
          );
          
          if (userEntry) {
            set({ 
              user: userEntry.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          }
        }
        
        set({ isLoading: false });
        return false;
      },

      logout: () => {
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
