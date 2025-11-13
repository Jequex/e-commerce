'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSelector } from '@/components/common';
import { useState } from 'react';

interface NavbarProps {
  activeRoute?: string;
}

export default function Navbar({ activeRoute }: NavbarProps) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [searchQuery, setSearchQuery] = useState('');
  const isActive = (route: string) => activeRoute === route;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page with query
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <nav className="relative bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">
                  {tCommon('title')}
                </h1>
              </Link>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
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

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/categories" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/categories')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Categories
              </Link>
              <Link 
                href="/cart" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/cart')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t('cart')}
              </Link>
              <Link 
                href="/about" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/about')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t('about')}
              </Link>
              <Link 
                href="/contact" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/contact')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t('contact')}
              </Link>
              <LanguageSelector />
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                {t('signIn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}