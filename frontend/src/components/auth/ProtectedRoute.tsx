import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, getDashboardPath } from '@/stores/useAuthStore';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
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

  // Check if user's role is allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
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
