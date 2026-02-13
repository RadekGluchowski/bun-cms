import { useAuthStore } from '@/stores/auth.store';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface RequireAdminRouteProps {
  children: ReactNode;
}

export function RequireAdminRoute({ children }: RequireAdminRouteProps) {
  const admin = useAuthStore((state) => state.admin);

  if (admin?.role !== 'admin') {
    return <Navigate to="/products" replace />;
  }

  return <>{children}</>;
}
