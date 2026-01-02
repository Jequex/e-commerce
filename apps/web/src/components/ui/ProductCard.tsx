'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Product } from '@/types/products';
import Image from 'next/image';
import { useCartStore } from '@/stores/use-cart-store';
import { toast } from 'react-toastify';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('products');

  const renderStars = (rating: number = 4.5) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400'
            : i < rating
            ? 'text-yellow-200'
            : 'text-gray-300'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const formatBuyersCount = (count: number = 0) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const discountPercentage = product.compareAtPrice 
    ? Math.round(((parseFloat(product.compareAtPrice) - parseFloat(product.price)) / parseFloat(product.compareAtPrice)) * 100)
    : 0;

  // Get the first image or use a placeholder
  const productImage = product.images?.[0];
  const imageSrc = typeof productImage === 'string' 
    ? productImage 
    : productImage?.src;

  const addToCart = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      sku: product.sku,
      image: imageSrc,
      maxQuantity: product.inventoryQuantity,
      quantity: 1,
    });
    
    toast.success('Product added to cart!');
  };

  return (
    <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50 overflow-hidden">
      <div className="relative h-64 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden">
        <Link href={`/${product.id}`} className="absolute inset-0 z-10">
          <span className="sr-only">{product.name}</span>
        </Link>
        {imageSrc?.startsWith('http') || imageSrc?.startsWith('/') ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={imageSrc.includes('cloudinary.com')}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-4xl text-gray-400">📦</span>
          </div>
        )}
        {discountPercentage > 0 && (
          <div className="absolute top-4 right-4">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{discountPercentage}%
            </span>
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute top-4 left-4">
            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              ⭐ Featured
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {product.category?.name || 'General'}
          </span>
          {product.store && (
            <span className="text-xs text-gray-500">
              {product.store.name}
            </span>
          )}
        </div>
        
        <Link href={`/${product.id}`}>
          <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        {/* Rating and Stock */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {renderStars(4.5)}
            </div>
            <span className="text-sm font-medium text-gray-700">
              4.5
            </span>
          </div>
          {product.trackQuantity && (
            <div className="text-sm text-gray-600">
              {product.inventoryQuantity && product.inventoryQuantity > 0 ? (
                <span className="text-green-600">In Stock</span>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </div>
          )}
        </div>
        
        {/* <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">
          {product.description || t('productDescription')}
        </p> */}
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start">
            <span className="text-2xl font-bold text-gray-900">{parseFloat(product.price).toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</span>
            {product.compareAtPrice && discountPercentage > 0 && (
              <span className="text-lg text-gray-500 line-through">{parseFloat(product.compareAtPrice).toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</span>
            )}
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={product.trackQuantity && (!product.inventoryQuantity || product.inventoryQuantity <= 0)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-20"
          >
            {t('addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
}