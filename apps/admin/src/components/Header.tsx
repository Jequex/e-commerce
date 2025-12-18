'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuthStore } from '@/stores/use-auth-store';
import { useLogout } from '@/hooks/use-logout';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuToggle }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { admin } = useAuthStore();
  const logout = useLogout();

  const notifications = [
    {
      id: 1,
      title: 'New order received',
      description: 'Order #1234 from John Doe',
      time: '2 min ago',
      type: 'order',
      unread: true,
    },
    {
      id: 2,
      title: 'Product stock low',
      description: 'iPhone 13 Pro has only 5 items left',
      time: '1 hour ago',
      type: 'warning',
      unread: true,
    },
    {
      id: 3,
      title: 'Payment processed',
      description: 'Payment of $299.99 was successful',
      time: '3 hours ago',
      type: 'success',
      unread: false,
    },
  ];

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Icons.HamburgerMenuIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {title}
            </motion.h1>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <AnimatePresence>
                {isSearchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-64 pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                      autoFocus
                      onBlur={() => setIsSearchOpen(false)}
                    />
                    <button 
                      onClick={() => setIsSearchOpen(false)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <Icons.Cross2Icon className="w-4 h-4 text-gray-400" />
                    </button>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
                    title="Search"
                  >
                    <Icons.MagnifyingGlassIcon className="w-5 h-5" />
                  </button>
                )}
              </AnimatePresence>
            </div>
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
                title="Notifications"
              >
                <Icons.BellIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800"></span>
              </button>
              
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            notification.unread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              notification.type === 'order' ? 'bg-blue-100 dark:bg-blue-900/30' :
                              notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                              'bg-green-100 dark:bg-green-900/30'
                            }`}>
                              {notification.type === 'order' && <Icons.FileIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                              {notification.type === 'warning' && <Icons.ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                              {notification.type === 'success' && <Icons.CheckCircledIcon className="w-4 h-4 text-green-600 dark:text-green-400" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {notification.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Theme Toggle */}
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors">
              <Icons.SunIcon className="w-5 h-5" />
            </button>
            
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{admin?.firstName} {admin?.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{admin?.email}</p>
                </div>
                <Icons.ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>
              
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="py-2">
                      <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Icons.PersonIcon className="w-4 h-4 mr-3" />
                        Profile
                      </a>
                      <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Icons.GearIcon className="w-4 h-4 mr-3" />
                        Settings
                      </a>
                      <hr className="my-2 border-gray-200 dark:border-gray-700" />
                      <a onClick={logout} href="#" className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Icons.ExitIcon className="w-4 h-4 mr-3" />
                        Sign out
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;