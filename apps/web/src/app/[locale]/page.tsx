'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { ProductCard } from '@/components/ui';
import { useTranslations } from 'next-intl';
import { getProducts } from '@/api-calls/products';
import { Product } from '@/types/products';
import { useAuth } from '@/providers';
import { toast } from 'react-toastify';
import callApi from '@/api-calls/callApi';

export default function ProductsPage() {
  const t = useTranslations('products');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    // Handle OAuth callback token
    const token = searchParams.get('token');
    const authError = searchParams.get('auth_error');
    
    if (token) {
      handleOAuthToken(token);
    } else if (authError) {
      toast.error(decodeURIComponent(authError));
      // Clean URL
      router.replace('/');
    }
    
    fetchProducts();
  }, [searchParams]);

  const handleOAuthToken = async (token: string) => {
    try {
      // Verify token and get user data
      const response = await callApi('http://localhost:3001/api/auth/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.user) {
        login(token, response.user);
        toast.success('Successfully signed in!');
      }
      
      // Clean URL
      router.replace('/');
    } catch (error) {
      console.error('OAuth token verification error:', error);
      toast.error('Authentication failed');
      router.replace('/');
    }
  };

  const fetchProducts = async (loadMore = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = loadMore ? page + 1 : 1;
      
      // Extract query parameters
      const params: any = {
        page: currentPage,
        limit: 12,
        isActive: true,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
      };
      
      // Add optional parameters if they exist
      if (searchParams.get('categoryId')) {
        params.categoryId = searchParams.get('categoryId');
      }
      if (searchParams.get('storeId')) {
        params.storeId = searchParams.get('storeId');
      }
      if (searchParams.get('search')) {
        params.search = searchParams.get('search');
      }
      if (searchParams.get('minPrice')) {
        params.minPrice = Number(searchParams.get('minPrice'));
      }
      if (searchParams.get('maxPrice')) {
        params.maxPrice = Number(searchParams.get('maxPrice'));
      }
      
      const response = await getProducts(params);

      if (loadMore) {
        setProducts(prev => [...prev, ...response.products]);
        setPage(currentPage);
      } else {
        setProducts(response.products);
        setPage(1);
      }

      setHasMore(response.pagination?.hasNext || false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchProducts(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/" />

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

        {loading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <p className="text-red-600 text-center">{error}</p>
            <button 
              onClick={() => fetchProducts(false)}
              className="mt-4 mx-auto block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No products available at the moment.</p>
          </div>
        )}

        {products.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-16">
                <button 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-white/70 backdrop-blur-sm text-gray-900 px-8 py-4 rounded-2xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : t('loadMore')}
                </button>
              </div>
            )}
          </>
        )}

        {/* <div className="text-center mt-12">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {t('backToHome')}
          </Link>
        </div> */}
      </div>
      
      <Footer activeRoute="/" />
    </div>
  );
}
