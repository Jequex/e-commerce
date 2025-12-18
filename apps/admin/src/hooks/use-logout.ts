'use client';

import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/use-auth-store';

export function useLogout() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const logout = () => {
    // Clear Zustand store
    clearAuth();
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('admin');
    
    // Redirect to login
    router.push('/login');
  };

  return logout;
}
