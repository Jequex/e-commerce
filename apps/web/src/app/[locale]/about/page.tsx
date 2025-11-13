'use client';

import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';
import { Navbar, Footer } from '@/components/layout';
import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations('about');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/about" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('mission')}</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {t('missionDescription')}
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              {t('missionSecondary')}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('fastShipping')}</h3>
              <p className="text-gray-600">{t('fastShippingDescription')}</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quality First</h3>
              <p className="text-gray-600">We never compromise on quality. Every product is carefully vetted to ensure it meets our high standards.</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Focused</h3>
              <p className="text-gray-600">Your satisfaction is our priority. We're here to help and ensure you have the best shopping experience.</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Innovation</h3>
              <p className="text-gray-600">We continuously evolve our platform to provide you with the latest features and best technology.</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Founded in 2024, ShopHub started with a simple vision: to create an e-commerce platform 
              that truly puts customers first. What began as a small startup has grown into a trusted 
              destination for thousands of shoppers worldwide.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Our team of passionate developers, designers, and customer service specialists work 
              tirelessly to ensure that every aspect of your shopping experience is smooth, secure, 
              and satisfying.
            </p>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Join Our Community</h3>
              <p className="text-blue-100 mb-6">
                Be part of our growing community of satisfied customers. Follow us for updates, 
                special offers, and the latest product launches.
              </p>
              <div className="flex justify-center space-x-6">
                <Link href="/products" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  Shop Now
                </Link>
                <Link href="/contact" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer activeRoute="/about" />
    </div>
  );
}