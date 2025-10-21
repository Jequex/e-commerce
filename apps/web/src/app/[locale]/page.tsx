'use client';

import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/layout';
import { useTranslations } from 'next-intl';


export default function HomePage() {
  const t = useTranslations('home');
  const tNav = useTranslations('nav');
  console.log('rendering home page');
  

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center">
              <div className="animate-fade-in-up">
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                  {t('title')}
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
                  {t('subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Link 
                    href="/products" 
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                  >
                    <span className="flex items-center">
                      {t('exploreProducts')}
                      <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </Link>
                  <Link 
                    href="/cart" 
                    className="group bg-white text-gray-900 px-8 py-4 rounded-2xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="flex items-center">
                      {tNav('cart')}
                      <svg className="w-5 h-5 ml-2 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M20 9H8" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-50 animate-float"></div>
            <div className="absolute top-40 right-10 w-16 h-16 bg-purple-200 rounded-full opacity-50 animate-float-delayed"></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-200 rounded-full opacity-50 animate-float"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="group bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Product Catalog</h3>
              <p className="text-gray-600 leading-relaxed">Browse our curated collection of premium products with advanced filtering, search, and personalized recommendations.</p>
            </div>
            
            <div className="group bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M20 9H8" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Shopping</h3>
              <p className="text-gray-600 leading-relaxed">Intelligent cart management, quick checkout process, and secure payment options for a seamless shopping experience.</p>
            </div>
            
            <div className="group bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Order Tracking</h3>
              <p className="text-gray-600 leading-relaxed">Real-time order tracking, instant notifications, and transparent delivery updates from purchase to doorstep.</p>
            </div>
          </div>

          {/* System Status Section */}
          <div className="bg-white/70 backdrop-blur-sm p-10 rounded-3xl shadow-xl border border-gray-200/50">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">System Status</h2>
              <p className="text-gray-600 text-lg">All services running smoothly for the best shopping experience</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Auth Service', icon: '🔐', color: 'from-green-400 to-green-500' },
                { name: 'Product Service', icon: '📦', color: 'from-blue-400 to-blue-500' },
                { name: 'Order Service', icon: '📋', color: 'from-purple-400 to-purple-500' },
                { name: 'Payment Service', icon: '💳', color: 'from-indigo-400 to-indigo-500' }
              ].map((service) => (
                <div key={service.name} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                  <div className="text-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${service.color} rounded-xl flex items-center justify-center mx-auto mb-4 text-white text-xl`}>
                      {service.icon}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{service.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">Operational</p>
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs font-medium text-green-600">Healthy</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              ShopHub
            </h3>
            <p className="text-gray-400 mb-6">Your ultimate e-commerce destination</p>
            <div className="flex justify-center space-x-6">
              <Link href="/products" className="text-gray-400 hover:text-white transition-colors">Products</Link>
              <Link href="/cart" className="text-gray-400 hover:text-white transition-colors">Cart</Link>
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}