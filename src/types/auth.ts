// User roles - simplified to Admin and Security only
export type UserRole = 'admin' | 'security';

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password?: string;
  otp?: string;
}

// Role-based permissions
export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'dashboard.view',
    'apartments.manage',
    'visitors.manage',
    'visitors.entry',
    'visitors.checkout',
    'vehicles.manage',
    'vehicles.entry',
    'vehicles.checkout',
    'vendors.manage',
    'staff.manage',
    'inventory.manage',
    'utilities.manage',
    'financials.manage',
    'reports.view',
    'qr.manage',
    'settings.manage',
  ],
  security: [
    'visitors.entry',
    'visitors.checkout',
    'visitors.view',
    'vehicles.entry',
    'vehicles.checkout',
    'vehicles.view',
    'workers.view',
    'qr.scan',
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}