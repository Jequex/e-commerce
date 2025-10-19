'use client';

import Link from 'next/link';
import { Navbar } from '@/components/layout';
import { useTranslation } from '@/contexts/TranslationContext';

export default function ProductsPage() {
  const { t } = useTranslation();
  
  const products = [
    { id: 1, nameKey: 'wirelessHeadphones', price: 299, originalPrice: 399, image: '🎧', categoryKey: 'electronics' },
    { id: 2, nameKey: 'smartWatch', price: 199, originalPrice: 249, image: '⌚', categoryKey: 'electronics' },
    { id: 3, nameKey: 'coffeeMaker', price: 159, originalPrice: 199, image: '☕', categoryKey: 'homeGarden' },
    { id: 4, nameKey: 'backpack', price: 89, originalPrice: 120, image: '🎒', categoryKey: 'fashion' },
    { id: 5, nameKey: 'yogaMat', price: 49, originalPrice: 69, image: '🧘', categoryKey: 'sports' },
    { id: 6, nameKey: 'skincareSet', price: 79, originalPrice: 110, image: '🧴', categoryKey: 'beauty' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/products" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t.products.title}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent block">
              {t.products.subtitle}
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t.products.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50 overflow-hidden">
              <div className="relative h-64 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                <span className="text-6xl">{product.image}</span>
                <div className="absolute top-4 right-4">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {t.products.categories[product.categoryKey as keyof typeof t.products.categories]}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {t.products.productNames[product.nameKey as keyof typeof t.products.productNames]}
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {t.products.productDescription}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                    <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
                  </div>
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center">
                    {t.products.addToCart}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <button className="bg-white/70 backdrop-blur-sm text-gray-900 px-8 py-4 rounded-2xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            {t.products.loadMore}
          </button>
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {t.products.backToHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
