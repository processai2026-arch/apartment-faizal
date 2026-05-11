import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, LoginCredentials, SignUpData } from '@/types/auth';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithOTP: (phone: string, otp: string) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

// Mock users for demonstration
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@apartmentos.com': {
    password: 'admin123',
    user: {
      id: 'U001',
      email: 'admin@apartmentos.com',
      phone: '+91 98765 00000',
      name: 'Admin User',
      role: 'admin',
      createdAt: '2024-01-01',
    },
  },
  'security@apartmentos.com': {
    password: 'security123',
    user: {
      id: 'U002',
      email: 'security@apartmentos.com',
      phone: '+91 98765 11111',
      name: 'Ramu Kumar',
      role: 'security',
      createdAt: '2024-01-15',
    },
  },
  'rajesh@example.com': {
    password: 'owner123',
    user: {
      id: 'U003',
      email: 'rajesh@example.com',
      phone: '+91 98765 43210',
      name: 'Rajesh Kumar',
      role: 'owner-resident',
      apartmentId: '1',
      apartmentNo: 'A-101',
      block: 'A',
      createdAt: '2024-02-01',
    },
  },
  'priya@example.com': {
    password: 'tenant123',
    user: {
      id: 'U004',
      email: 'priya@example.com',
      phone: '+91 87654 32109',
      name: 'Priya Sharma',
      role: 'tenant',
      apartmentId: '2',
      apartmentNo: 'A-102',
      block: 'A',
      createdAt: '2024-02-15',
    },
  },
  'anil@example.com': {
    password: 'owner123',
    user: {
      id: 'U005',
      email: 'anil@example.com',
      phone: '+91 76543 21098',
      name: 'Anil Sharma',
      role: 'owner',
      apartmentId: '2',
      apartmentNo: 'A-102',
      block: 'A',
      createdAt: '2024-01-20',
    },
  },
  'meera@example.com': {
    password: 'resident123',
    user: {
      id: 'U006',
      email: 'meera@example.com',
      phone: '+91 65432 10987',
      name: 'Meera Nair',
      role: 'owner-resident',
      apartmentId: '5',
      apartmentNo: 'B-101',
      block: 'B',
      createdAt: '2024-03-01',
    },
  },
};

// Mock OTP verification (in real app, this would be server-side)
const mockOTPs: Record<string, string> = {
  '+91 98765 00000': '123456',
  '+91 98765 11111': '123456',
  '+91 98765 43210': '123456',
  '+91 87654 32109': '123456',
  '+91 76543 21098': '123456',
  '+91 65432 10987': '123456',
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

      signUp: async (data: SignUpData) => {
        set({ isLoading: true });
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, this would create a new user in the database
        const newUser: User = {
          id: `U${Date.now()}`,
          email: data.email,
          phone: data.phone,
          name: data.name,
          role: data.role,
          apartmentId: data.apartmentId,
          createdAt: new Date().toISOString(),
        };
        
        // Add to mock users (in memory only)
        mockUsers[data.email.toLowerCase()] = {
          password: data.password,
          user: newUser,
        };
        
        set({ 
          user: newUser, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        return true;
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
    case 'owner':
      return '/owner';
    case 'tenant':
      return '/tenant';
    case 'owner-resident':
      return '/resident';
    default:
      return '/';
  }
}