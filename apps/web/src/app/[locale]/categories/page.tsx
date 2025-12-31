'use client';

import { Link } from '@/i18n/navigation';
import { Navbar, Footer } from '@/components/layout';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { getProductCategories } from '@/api-calls/products';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await getProductCategories();
        setCategories(response.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Color gradients for categories
  const gradients = [
    'from-blue-400 via-purple-500 to-indigo-600',
    'from-pink-400 via-red-500 to-orange-500',
    'from-green-400 via-teal-500 to-cyan-600',
    'from-orange-400 via-yellow-500 to-red-500',
    'from-purple-400 via-pink-500 to-rose-500',
    'from-indigo-400 via-blue-500 to-purple-600',
    'from-gray-400 via-slate-500 to-zinc-600',
    'from-yellow-400 via-orange-500 to-pink-500',
  ];

  // Emoji icons for categories (can be customized based on category name)
  const getIconForCategory = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('electronic') || lowerName.includes('tech')) return '📱';
    if (lowerName.includes('fashion') || lowerName.includes('cloth')) return '👗';
    if (lowerName.includes('home') || lowerName.includes('garden')) return '🏡';
    if (lowerName.includes('sport') || lowerName.includes('fitness')) return '⚽';
    if (lowerName.includes('beauty') || lowerName.includes('cosmetic')) return '💄';
    if (lowerName.includes('book')) return '📚';
    if (lowerName.includes('auto') || lowerName.includes('car')) return '🚗';
    if (lowerName.includes('toy') || lowerName.includes('game')) return '🧸';
    if (lowerName.includes('food') || lowerName.includes('grocery')) return '🍔';
    if (lowerName.includes('music') || lowerName.includes('instrument')) return '🎵';
    return '🛍️'; // Default icon
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar activeRoute="/products" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-blue-900 font-semibold">Loading categories...</p>
          </div>
        </div>
        <Footer activeRoute="/categories" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar activeRoute="/products" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer activeRoute="/categories" />
      </div>
    );
  }

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
                  {categories.length} {categories.length === 1 ? 'Category' : 'Categories'} Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.filter(cat => cat.isActive).map((category, index) => (
            <Link
              key={category.id}
              href={`/?categoryId=${category.id}`}
              className="group"
            >
              <div className="relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-rotate-1">
                <div className={`h-64 bg-gradient-to-br ${gradients[index % gradients.length]} p-6 flex flex-col justify-between relative`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white/30 rounded-full"></div>
                    <div className="absolute bottom-4 right-4 w-20 h-20 border-2 border-white/20 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/10 rounded-full"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {getIconForCategory(category.name)}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 capitalize">
                      {category.name}
                    </h3>
                    <p className="text-white/80 text-sm mb-4">
                      {category.description || 'Discover amazing products'}
                    </p>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-white">
                      <span className="text-lg font-semibold">
                        Browse
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

        {categories.filter(cat => cat.isActive).length === 0 && (
          <div className="text-center py-16">
            <p className="text-blue-900/70 text-lg">No categories available at the moment.</p>
          </div>
        )}
      </div>
      
      <Footer activeRoute="/categories" />
    </div>
  );
}
