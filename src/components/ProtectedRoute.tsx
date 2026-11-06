import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/features/auth/types';
import { getDefaultPathForRole, isBanActive } from '@/features/auth/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isBanActive(user)) {
    // A banned user keeps exactly one door open: the support chat, where
    // they can talk to support and file an appeal.
    if (location.pathname === '/support/chat') {
      return <Outlet />;
    }
    return <Navigate to="/support/chat" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

  return <Outlet />;
}
