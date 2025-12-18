'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/use-auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
}

const publicRoutes = ['/login', '/forgot-password', '/reset-password'];

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    // Only check auth after hydration is complete
    if (!isHydrated) return;

    // Check if current route is public
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Redirect to login if not authenticated and not on public route
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, pathname, router]);

  // Show loading while hydrating
  if (!isHydrated) {
    return null;
  }

  // Show loading while redirecting unauthenticated users
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
