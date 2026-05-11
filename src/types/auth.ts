export type UserRole = 'admin' | 'security' | 'owner' | 'tenant' | 'owner-resident';

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  avatar?: string;
  apartmentId?: string; // For owner/tenant/owner-resident
  apartmentNo?: string;
  block?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password?: string;
  otp?: string;
}

export interface SignUpData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'owner' | 'tenant' | 'owner-resident';
  apartmentId: string;
}

// Role-based permissions
export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'dashboard.admin',
    'apartments.manage',
    'visitors.manage',
    'vehicles.manage',
    'vendors.manage',
    'staff.manage',
    'inventory.manage',
    'utilities.manage',
    'financials.manage',
    'reports.view',
    'complaints.manage',
    'workers.manage',
    'emergency.manage',
    'qr.manage',
  ],
  security: [
    'dashboard.security',
    'visitors.entry',
    'visitors.checkout',
    'vehicles.entry',
    'vehicles.checkout',
    'workers.verify',
    'emergency.view',
    'qr.scan',
  ],
  owner: [
    'dashboard.owner',
    'property.view',
    'tenant.manage',
    'payments.view',
    'payments.pay',
    'complaints.raise',
    'visitors.view',
    'vehicles.view',
    'emergency.view',
  ],
  tenant: [
    'dashboard.tenant',
    'visitors.invite',
    'visitors.view',
    'workers.register',
    'complaints.raise',
    'vehicles.register',
    'emergency.view',
  ],
  'owner-resident': [
    'dashboard.resident',
    'property.view',
    'tenant.manage',
    'payments.view',
    'payments.pay',
    'visitors.invite',
    'visitors.view',
    'workers.register',
    'complaints.raise',
    'vehicles.register',
    'vehicles.view',
    'emergency.view',
  ],
};

// Helper function to check if user has permission
export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

// Helper function to check if user has any of the permissions
export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}