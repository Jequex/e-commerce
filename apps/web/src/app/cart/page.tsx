'use client';

import Link from 'next/link';
import { Navbar } from '@/components/layout';
import { useTranslation } from '@/contexts/TranslationContext';

export default function CartPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/cart" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t.cart.title.split(' ')[0]}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent block">
              {t.cart.title.split(' ')[1]}
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.cart.description}
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M20 9H8" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.cart.empty}</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {t.cart.emptyDescription}
          </p>
          <Link 
            href="/products" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 inline-block"
          >
            {t.cart.startShopping}
          </Link>
        </div>

        <div className="mt-16 bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t.cart.benefits}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.cart.securePayment}</h3>
              <p className="text-gray-600">{t.cart.securePaymentDescription}</p>
            </div>
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.cart.fastShipping}</h3>
              <p className="text-gray-600">{t.cart.fastShippingDescription}</p>
            </div>
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.cart.easyReturns}</h3>
              <p className="text-gray-600">{t.cart.easyReturnsDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
