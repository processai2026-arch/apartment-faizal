import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, getDashboardPath } from '@/stores/useAuthStore';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Role matching with the super-admin superset rule: 'super_admin' satisfies
 * any guard that allows 'admin', so existing allowedRoles={['admin']} route
 * declarations keep working unchanged. Guards that list 'super_admin'
 * explicitly stay exclusive (a plain admin does not pass them).
 */
export function roleSatisfies(role: UserRole, allowedRoles?: UserRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (allowedRoles.includes(role)) return true;
  return role === 'super_admin' && allowedRoles.includes('admin');
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is allowed (super_admin passes admin-gated routes)
  if (!roleSatisfies(user.role, allowedRoles)) {
    // Redirect to user's appropriate dashboard
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}

// Component to redirect authenticated users away from auth pages
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (isAuthenticated && user) {
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
