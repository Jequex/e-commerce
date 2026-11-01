'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Navbar, Footer } from '@/components/layout';
import Image from 'next/image';
import { getProductById } from '@/api-calls/products';
import { Product } from '@/types/products';
import { useCartStore } from '@/stores/use-cart-store';
import { toast } from 'react-toastify';

export default function ProductDetailsPage() {
  const params = useParams();
  const t = useTranslations('productDetails');
  const tProducts = useTranslations('products');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        setError('');
        const response = await getProductById(params.id as string);
        setProduct(response.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const sizes = ['S', 'M', 'L', 'XL'];
  const colors = ['Black', 'White', 'Blue', 'Red'];
  const addToCart = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    if (!product) return;
    
    const firstImage = product.images?.[0];
    const imageSrc = typeof firstImage === 'string' 
      ? firstImage 
      : firstImage?.src || '';
    
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      sku: product.sku,
      image: imageSrc,
      maxQuantity: product.inventoryQuantity,
      quantity: quantity,
    });
    
    toast.success(`${quantity} item(s) added to cart!`);
    setQuantity(1);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      setSubmittingReview(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        toast.info('Please log in to submit a review');
        return;
      }

      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle,
          content: reviewContent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('Thank you! Your review has been submitted.');
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewContent('');
      setReviewRating(5);

      // Update product reviews locally
      setProduct((prev) => {
        if (!prev) return prev;
        const currentReviews = prev.reviews || [];
        return {
          ...prev,
          reviews: [data.review, ...currentReviews],
          rating: data.reviewStats?.averageRating || prev.rating,
          reviewCount: data.reviewStats?.reviewCount || ((prev.reviewCount || 0) + 1),
          reviewStats: data.reviewStats || prev.reviewStats
        };
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${
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

  const formatBuyersCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/" />

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/" className="text-blue-600 hover:underline">
              Go back to home
            </Link>
          </div>
        </div>
      )}

      {/* Product Content */}
      {product && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                {t('breadcrumb.home')}
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-500">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[selectedImageIndex].src}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  unoptimized={product.images[selectedImageIndex].src?.includes('cloudinary.com')}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image.src}
                      alt={`${product.name} ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                      unoptimized={image.src?.includes('cloudinary.com')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.category && (
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {product.category.name}
                  </span>
                )}
                {product.compareAtPrice && (
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded">
                    -{Math.round(((parseFloat(product.compareAtPrice) - parseFloat(product.price)) / parseFloat(product.compareAtPrice)) * 100)}%
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              {/* Rating and Reviews */}
              <div className="flex items-center gap-4 mb-4">
                {product.reviewStats?.reviewCount && product.reviewStats.reviewCount > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {renderStars(product.reviewStats.averageRating || 0)}
                      </div>
                      <span className="text-lg font-medium text-gray-700">
                        {Number(product.reviewStats.averageRating || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <span>({product.reviewStats.reviewCount} {product.reviewStats.reviewCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      {renderStars(0)}
                    </div>
                    <span>No reviews yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-gray-900">{parseFloat(product.price).toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</span>
              {product.compareAtPrice && (
                <span className="text-2xl text-gray-500 line-through">{parseFloat(product.compareAtPrice).toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.isActive && (product.inventoryQuantity === undefined || product.inventoryQuantity > 0) ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">
                    {t('inStock')} {product.inventoryQuantity !== undefined && `(${product.inventoryQuantity} ${t('available')})`}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-600 font-medium">{t('outOfStock')}</span>
                </>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('description')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4">
              {/* Size Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">{t('size')}</h4>
                <div className="flex gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        selectedSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">{t('color')}</h4>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                        selectedColor === color
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {t(`colors.${color.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">{t('quantity')}</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.inventoryQuantity || 99, quantity + 1))}
                    className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button                 onClick={handleAddToCart}                disabled={!product.isActive || (product.inventoryQuantity !== undefined && product.inventoryQuantity <= 0)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {t('addToCart')}
              </button>
              <button className="w-full border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-colors">
                {t('addToWishlist')}
              </button>
            </div>

            {/* Product Meta */}
            <div className="border-t pt-6 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>{t('sku')}:</span>
                <span className="font-medium">{product.sku}</span>
              </div>
              {product.store && (
                <div className="flex justify-between">
                  <span>Store:</span>
                  <Link 
                    href={`/?storeId=${product.storeId}`}
                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    {product.store.name}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto whitespace-nowrap">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={`px-5 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    activeTab === 'description' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('description')}
                </button>
                <button 
                  onClick={() => setActiveTab('specifications')}
                  className={`px-5 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    activeTab === 'specifications' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('specifications')}
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`px-5 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    activeTab === 'reviews' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('reviews')}
                </button>
              </nav>
            </div>
            <div className="p-4 sm:p-8">
              {/* Description Tab */}
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Tags:</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Specifications Tab */}
              {activeTab === 'specifications' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-900">SKU</span>
                    <span className="text-gray-600">{product.sku}</span>
                  </div>
                  {product.barcode && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-900">Barcode</span>
                      <span className="text-gray-600">{product.barcode}</span>
                    </div>
                  )}
                  {product.weight && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-900">Weight</span>
                      <span className="text-gray-600">{product.weight}g</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-900">Dimensions</span>
                      <span className="text-gray-600">
                        {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} {product.dimensions.unit}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Status</span>
                    <span className="text-gray-600 capitalize">{product.isActive}</span>
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-8">
                  {/* Reviews Summary */}
                  {product.reviewStats?.reviewCount && product.reviewStats.reviewCount > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-gray-200">
                      <div className="text-center sm:w-48">
                        <div className="text-4xl font-bold text-gray-900 mb-2">
                          {Number(product.reviewStats.averageRating || 0).toFixed(1)}
                        </div>
                        <div className="flex items-center justify-center mb-2">
                          {renderStars(product.reviewStats.averageRating || 0)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {product.reviewStats.reviewCount} {product.reviewStats.reviewCount === 1 ? 'review' : 'reviews'}
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = product.reviews?.filter((r) => r.rating === stars).length || 0;
                          const total = product.reviewStats?.reviewCount || 1;
                          const percentage = Math.round((count / total) * 100);
                          return (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="text-sm text-gray-600 w-8">{stars} ★</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12">{percentage}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border-b border-gray-200">
                      <div className="flex items-center justify-center mb-2">
                        {renderStars(0)}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">No reviews yet</h4>
                      <p className="text-gray-500 text-sm">Be the first to share your experience with this product!</p>
                    </div>
                  )}

                  {/* Individual Reviews List */}
                  {product.reviews && product.reviews.length > 0 && (
                    <div className="space-y-4 divide-y divide-gray-100">
                      {product.reviews.map((rev) => (
                        <div key={rev.id} className="pt-4 first:pt-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {renderStars(rev.rating)}
                              {rev.title && <span className="font-semibold text-gray-900">{rev.title}</span>}
                            </div>
                            {rev.createdAt && (
                              <span className="text-xs text-gray-400">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {rev.content && (
                            <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                              {rev.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Write Review Form or Button */}
                  <div className="pt-6 border-t border-gray-200">
                    {showReviewForm ? (
                      <form onSubmit={handleSubmitReview} className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4 max-w-xl mx-auto">
                        <h4 className="text-lg font-bold text-gray-900">Write a Review</h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className={`text-2xl transition-colors ${
                                  star <= reviewRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                                }`}
                              >
                                ★
                              </button>
                            ))}
                            <span className="text-sm font-semibold text-gray-700 ml-2">{reviewRating} / 5</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
                          <input
                            type="text"
                            value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)}
                            placeholder="Summary of your review"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                          <textarea
                            value={reviewContent}
                            onChange={(e) => setReviewContent(e.target.value)}
                            rows={4}
                            placeholder="What did you like or dislike about this product?"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReviewForm(false)}
                            className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center">
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          {t('writeReview') || 'Write a Review'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      <Footer activeRoute="/products" />
    </div>
  );
}