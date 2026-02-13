import { useAuthStore } from '@/stores/auth.store';

export function useIsAdmin(): boolean {
  const admin = useAuthStore((state) => state.admin);
  return admin?.role === 'admin';
}
