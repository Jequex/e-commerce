'use client';

import { Link } from '@/i18n/navigation';
import { Navbar, Footer } from '@/components/layout';
import { useTranslations } from 'next-intl';

export default function CategoriesPage() {
  const t = useTranslations('categories');
  
  const categories = [
    { 
      id: 1, 
      nameKey: 'electronics', 
      icon: '📱', 
      productCount: 245,
      bgGradient: 'from-blue-400 via-purple-500 to-indigo-600',
      description: 'Latest gadgets and technology'
    },
    { 
      id: 2, 
      nameKey: 'fashion', 
      icon: '👗', 
      productCount: 189,
      bgGradient: 'from-pink-400 via-red-500 to-orange-500',
      description: 'Trendy clothing and accessories'
    },
    { 
      id: 3, 
      nameKey: 'homeGarden', 
      icon: '🏡', 
      productCount: 156,
      bgGradient: 'from-green-400 via-teal-500 to-cyan-600',
      description: 'Home decor and gardening essentials'
    },
    { 
      id: 4, 
      nameKey: 'sports', 
      icon: '⚽', 
      productCount: 134,
      bgGradient: 'from-orange-400 via-yellow-500 to-red-500',
      description: 'Sports and fitness equipment'
    },
    { 
      id: 5, 
      nameKey: 'beauty', 
      icon: '💄', 
      productCount: 98,
      bgGradient: 'from-purple-400 via-pink-500 to-rose-500',
      description: 'Beauty and personal care products'
    },
    { 
      id: 6, 
      nameKey: 'books', 
      icon: '📚', 
      productCount: 87,
      bgGradient: 'from-indigo-400 via-blue-500 to-purple-600',
      description: 'Books and educational materials'
    },
    { 
      id: 7, 
      nameKey: 'automotive', 
      icon: '🚗', 
      productCount: 76,
      bgGradient: 'from-gray-400 via-slate-500 to-zinc-600',
      description: 'Car accessories and parts'
    },
    { 
      id: 8, 
      nameKey: 'toys', 
      icon: '🧸', 
      productCount: 65,
      bgGradient: 'from-yellow-400 via-orange-500 to-pink-500',
      description: 'Toys and games for all ages'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/products" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl"></div>
          <div className="relative z-10 py-16 px-8">
            <h1 className="text-6xl md:text-8xl font-black text-blue-900 mb-6 animate-bounce">
              🛍️ Categories
            </h1>
            <p className="text-xl md:text-2xl text-blue-900/90 max-w-3xl mx-auto mb-8 leading-relaxed">
              Explore our amazing collection of products across different categories
            </p>
            <div className="flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-blue-900 font-semibold">
                  {categories.reduce((total, cat) => total + cat.productCount, 0)}+ Products Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/?category=${category.nameKey}`}
              className="group"
            >
              <div className="relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-rotate-1">
                <div className={`h-64 bg-gradient-to-br ${category.bgGradient} p-6 flex flex-col justify-between relative`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white/30 rounded-full"></div>
                    <div className="absolute bottom-4 right-4 w-20 h-20 border-2 border-white/20 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/10 rounded-full"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 capitalize">
                      {category.nameKey}
                    </h3>
                    <p className="text-white/80 text-sm mb-4">
                      {category.description}
                    </p>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-white">
                      <span className="text-lg font-semibold">
                        {category.productCount} items
                      </span>
                      <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full group-hover:bg-white/30 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <Footer activeRoute="/categories" />
    </div>
  );
}
