'use client';

import { Link } from '@/i18n/navigation';
import { Navbar, Footer } from '@/components/layout';
import { ProductCard } from '@/components/ui';
import { useTranslations } from 'next-intl';

export default function ProductsPage() {
  const t = useTranslations('products');
  
  const products = [
    { id: 1, nameKey: 'wirelessHeadphones', price: 299, originalPrice: 399, image: '🎧', categoryKey: 'electronics', rating: 4.8, buyersCount: 2847 },
    { id: 2, nameKey: 'smartWatch', price: 199, originalPrice: 249, image: '⌚', categoryKey: 'electronics', rating: 4.6, buyersCount: 1203 },
    { id: 3, nameKey: 'coffeeMaker', price: 159, originalPrice: 199, image: '☕', categoryKey: 'homeGarden', rating: 4.9, buyersCount: 892 },
    { id: 4, nameKey: 'backpack', price: 89, originalPrice: 120, image: '🎒', categoryKey: 'fashion', rating: 4.3, buyersCount: 654 },
    { id: 5, nameKey: 'yogaMat', price: 49, originalPrice: 69, image: '🧘', categoryKey: 'sports', rating: 4.7, buyersCount: 1456 },
    { id: 6, nameKey: 'skincareSet', price: 79, originalPrice: 110, image: '🧴', categoryKey: 'beauty', rating: 4.5, buyersCount: 923 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/products" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('title')}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent block">
              {t('subtitle')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-16">
          <button className="bg-white/70 backdrop-blur-sm text-gray-900 px-8 py-4 rounded-2xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            {t('loadMore')}
          </button>
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {t('backToHome')}
          </Link>
        </div>
      </div>
      
      <Footer activeRoute="/" />
    </div>
  );
}
