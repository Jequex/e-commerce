'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/useAuthStore';
import * as Icons from '@radix-ui/react-icons';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Icons.DashboardIcon },
  { name: 'Customers & Purchases', href: '/customers', icon: Icons.AvatarIcon, badge: 'Purchases' },
  { name: 'Profit Markups', href: '/markups', icon: Icons.BarChartIcon, badge: 'Super Admin' },
  { name: 'Platform Profits & Reports', href: '/reports', icon: Icons.PieChartIcon, badge: 'Financials' },
  { name: 'Weekly Payouts', href: '/payouts', icon: Icons.LayersIcon, badge: 'Paystack' },
  { name: 'Coupons & Promo', href: '/coupons', icon: Icons.TokensIcon },
  { name: 'Categories', href: '/categories', icon: Icons.ComponentInstanceIcon, badge: 'Super Admin' },
  { name: 'Products', href: '/products', icon: Icons.CubeIcon },
  { name: 'Manage Admins', href: '/admins', icon: Icons.PersonIcon, badge: 'Super Admin' },
  { name: 'App Branding & Settings', href: '/settings', icon: Icons.GearIcon, badge: 'Super Admin' },
  { name: 'Legal Policies CMS', href: '/legal', icon: Icons.FileTextIcon, badge: 'Audit Trail' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [branding, setBranding] = useState<{ appName: string; appLogoUrl: string }>({
    appName: 'Jequex E-Commerce',
    appLogoUrl: '',
  });

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    fetch('/api/store/settings/contact')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setBranding({
            appName: data.app_name || data.appName || 'Jequex E-Commerce',
            appLogoUrl: data.app_logo_url || data.appLogoUrl || '',
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, pathname, router]);

  if (!mounted || (!isAuthenticated && pathname !== '/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 relative">
      {/* Mobile Drawer Overlay / Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - responsive drawer on mobile, fixed on lg+ */}
      <aside
        className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {branding.appLogoUrl ? (
              <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 p-1 flex items-center justify-center overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={branding.appLogoUrl} alt="" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 shrink-0">
                SA
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-xs tracking-wide text-white truncate" title={branding.appName}>
                {branding.appName || 'SUPER ADMIN'}
              </h1>
              <p className="text-[10px] text-amber-400 font-medium">Super Admin Console</p>
            </div>
          </div>
          {/* Close button inside mobile drawer */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close sidebar"
          >
            <Icons.Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-indigo-400/30 text-white' : 'bg-slate-800 text-amber-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.email || 'superadmin@ecommerce.com'}</p>
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                {user?.role || 'super_admin'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition"
          >
            <Icons.ExitIcon className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-64 min-w-0 flex flex-col min-h-screen">
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none"
              aria-label="Open mobile menu"
            >
              <Icons.HamburgerMenuIcon className="w-5 h-5" />
            </button>
            <div className="text-xs sm:text-sm text-slate-400">
              <span className="hidden sm:inline">Platform Mode: </span>
              <span className="text-amber-400 font-semibold">Super Administrator</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">Server: </span>
              <strong className="text-emerald-400">Online</strong>
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="hidden sm:inline">Gateway: <strong className="text-indigo-400">:8080</strong></span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

