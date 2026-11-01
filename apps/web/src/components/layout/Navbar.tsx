'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSelector } from '@/components/common';
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers';
import { useCartStore } from '@/stores/use-cart-store';

interface NavbarProps {
  activeRoute?: string;
}

export default function Navbar({ activeRoute }: NavbarProps) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openAuthModal, user, isAuthenticated, logout } = useAuth();
  const isActive = (route: string) => activeRoute === route;
  const totalItems = useCartStore((state) => state.getTotalItems());
  const [mounted, setMounted] = useState(false);
  const [branding, setBranding] = useState<{ appName: string; appLogoUrl: string }>({
    appName: '',
    appLogoUrl: '',
  });
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetch('/api/store/settings/contact')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setBranding({
            appName: data.app_name || data.appName || '',
            appLogoUrl: data.app_logo_url || data.appLogoUrl || '',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsMobileMenuOpen(false);
      // Navigate to search results page with query
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="relative bg-white/90 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center min-w-0 pr-3">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                {branding.appLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding.appLogoUrl} alt={branding.appName || 'Logo'} className="h-8 max-w-[100px] sm:max-w-[140px] object-contain shrink-0" />
                ) : null}
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer truncate">
                  {branding.appName || tCommon('title')}
                </span>
              </Link>
            </div>
          </div>
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, categories..."
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-full bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/90 focus:bg-white/95"
                />
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1.5 rounded-full hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </button>
              </div>
            </form>
          </div>

          {/* Mobile Right Controls: Cart + Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Shopping Cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {mounted && totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-6 flex items-center space-x-3 lg:space-x-4">
              <Link 
                href="/categories" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/categories')
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t('categories')}
              </Link>
              <div className="relative">
                <Link 
                  href="/cart" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    isActive('/cart')
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <span>{t('cart')}</span>
                  {mounted && totalItems > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>
              {isAuthenticated && (
                <Link 
                  href="/orders" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/orders')
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {t('orders') || 'Orders'}
                </Link>
              )}
              <Link 
                href="/about" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/about')
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t('about')}
              </Link>
              <Link 
                href="/contact" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/contact')
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t('contact')}
              </Link>
              <LanguageSelector />
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-3 pl-2">
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user?.firstName || user?.email}
                  </span>
                  <button 
                    onClick={logout}
                    className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {t('signOut') || 'Sign Out'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => openAuthModal()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  {t('signIn')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-3 animate-fadeIn">
            {/* Mobile Search Input */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, categories..."
                className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-1.5 bg-blue-600 text-white p-1 rounded-lg text-xs"
              >
                Go
              </button>
            </form>

            <div className="flex flex-col space-y-1">
              <Link
                href="/categories"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive('/categories') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('categories')}
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                  isActive('/cart') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{t('cart')}</span>
                {mounted && totalItems > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {totalItems} items
                  </span>
                )}
              </Link>
              {isAuthenticated && (
                <Link
                  href="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/orders') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('orders') || 'Orders'}
                </Link>
              )}
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive('/about') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('about')}
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive('/contact') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('contact')}
              </Link>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Language</span>
              <LanguageSelector />
            </div>

            <div className="pt-2 border-t border-gray-100">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 px-1 truncate">
                    Signed in as: <strong className="text-gray-800">{user?.firstName || user?.email}</strong>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-center bg-red-50 text-red-600 border border-red-200 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition"
                  >
                    {t('signOut') || 'Sign Out'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md transition"
                >
                  {t('signIn')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}