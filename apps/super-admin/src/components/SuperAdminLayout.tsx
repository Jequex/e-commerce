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
  { name: 'Categories', href: '/categories', icon: Icons.ComponentInstanceIcon, badge: 'Super Admin' },
  { name: 'Products', href: '/products', icon: Icons.CubeIcon },
  { name: 'Manage Admins', href: '/admins', icon: Icons.PersonIcon, badge: 'Super Admin' },
  { name: 'Contact & Settings', href: '/settings', icon: Icons.GearIcon, badge: 'Super Admin' },
  { name: 'Legal Policies CMS', href: '/legal', icon: Icons.FileTextIcon, badge: 'Audit Trail' },
  { name: 'Consent Log', href: '/consents', icon: Icons.CheckCircledIcon },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col fixed inset-y-0 z-30">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            SA
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">SUPER ADMIN</h1>
            <p className="text-[10px] text-slate-400 font-medium">Platform Governance</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
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
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="text-sm text-slate-400">
            Platform Mode: <span className="text-amber-400 font-semibold">Super Administrator</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Server: <strong className="text-emerald-400">Online</strong></span>
            <span>Gateway: <strong className="text-indigo-400">:8080</strong></span>
          </div>
        </header>

        <main className="p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

