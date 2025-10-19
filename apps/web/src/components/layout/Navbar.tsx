'use client';

import Link from 'next/link';
import { useTranslation } from '@/contexts/TranslationContext';
import { LanguageSelector } from '@/components/common';

interface NavbarProps {
  activeRoute?: string;
}

export default function Navbar({ activeRoute }: NavbarProps) {
  const { t } = useTranslation();
  const isActive = (route: string) => activeRoute === route;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">
                  {t.common.shophub}
                </h1>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/products" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/products')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t.nav.products}
              </Link>
              <Link 
                href="/cart" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/cart')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t.nav.cart}
              </Link>
              <Link 
                href="/about" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/about')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t.nav.about}
              </Link>
              <Link 
                href="/contact" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/contact')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t.nav.contact}
              </Link>
              <LanguageSelector />
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                {t.nav.signIn}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}