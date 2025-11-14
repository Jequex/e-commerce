'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';

interface SidebarItem {
  id: string;
  label: string;
  icon: keyof typeof Icons;
  href: string;
  badge?: number;
}

const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('sidebar');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: 'DashboardIcon',
      href: '/dashboard',
    },
    {
      id: 'products',
      label: t('products'),
      icon: 'CubeIcon',
      href: '/dashboard/products',
      badge: 12,
    },
    {
      id: 'orders',
      label: t('orders'),
      icon: 'FileIcon',
      href: '/dashboard/orders',
      badge: 5,
    },
    {
      id: 'customers',
      label: t('customers'),
      icon: 'PersonIcon',
      href: '/dashboard/customers',
    },
    {
      id: 'analytics',
      label: t('analytics'),
      icon: 'BarChartIcon',
      href: '/dashboard/analytics',
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: 'GearIcon',
      href: '/dashboard/settings',
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const sidebarVariants = {
    expanded: { width: 256 },
    collapsed: { width: 80 },
  };

  return (
    <motion.aside
      className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 z-40"
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Icons.RocketIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    Admin
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dashboard
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Icons.HamburgerMenuIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = Icons[item.icon as keyof typeof Icons];
          const isActive = pathname === item.href;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                {Icon ? <Icon className="w-5 h-5 flex-shrink-0" /> : <div className="w-5 h-5 bg-gray-400 rounded flex-shrink-0" />}
                {item.badge && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between flex-1"
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">A</span>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Admin User
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  admin@example.com
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;