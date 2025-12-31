'use client';

import { Link } from '@/i18n/navigation';
import { Navbar, Footer } from '@/components/layout';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/use-cart-store';
import Image from 'next/image';
import { toast } from 'react-toastify';

export default function CartPage() {
  const t = useTranslations('cart');
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    toast.success('Item removed from cart');
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  const totalPrice = getTotalPrice();
  const shippingCost = totalPrice > 100 ? 0 : 10;
  const tax = totalPrice * 0.1; // 10% tax
  const finalTotal = totalPrice + shippingCost + tax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/cart" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title').split(' ')[0]}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent block">
              {t('title').split(' ')[1]}
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M20 9H8" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('empty')}</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t('emptyDescription')}
            </p>
            <Link 
              href="/" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 inline-block"
            >
              {t('startShopping')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('items') || 'Cart Items'} ({items.length})
                </h2>
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                >
                  {t('clearCart') || 'Clear Cart'}
                </button>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <Link href={`/${item.productId}`} className="flex-shrink-0">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/${item.productId}`}>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 mb-2">SKU: {item.sku}</p>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl font-bold text-blue-600">
                          {item.price.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="px-6 py-2 bg-white font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-red-600 hover:text-red-700 font-medium transition-colors"
                        >
                          {t('remove') || 'Remove'}
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-2">{t('subtotal') || 'Subtotal'}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(item.price * item.quantity).toLocaleString('en-US', {style: 'currency', currency: 'USD'})}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('orderSummary') || 'Order Summary'}
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>{t('subtotal') || 'Subtotal'}</span>
                    <span className="font-semibold">{totalPrice.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>{t('shipping') || 'Shipping'}</span>
                    <span className="font-semibold">
                      {shippingCost === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        shippingCost.toLocaleString('en-US', {style: 'currency', currency: 'USD'})
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>{t('tax') || 'Tax'} (10%)</span>
                    <span className="font-semibold">{tax.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>{t('total') || 'Total'}</span>
                      <span className="text-blue-600">{finalTotal.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</span>
                    </div>
                  </div>
                </div>

                {totalPrice < 100 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {t('freeShippingMessage') || `Add $${(100 - totalPrice).toFixed(2)} more for free shipping!`}
                    </p>
                  </div>
                )}

                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 mb-4">
                  {t('proceedToCheckout') || 'Proceed to Checkout'}
                </button>

                <Link
                  href="/"
                  className="block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition-colors"
                >
                  {t('continueShopping') || 'Continue Shopping'}
                </Link>

                {/* Trust Badges */}
                <div className="mt-8 pt-6 border-t border-gray-300">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>{t('secureCheckout') || 'Secure Checkout'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t('freeReturns') || 'Free Returns'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{t('fastShipping') || '2-3 Day Shipping'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('benefits')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('securePayment')}</h3>
              <p className="text-gray-600">{t('securePaymentDescription')}</p>
            </div>
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('fastShipping')}</h3>
              <p className="text-gray-600">{t('fastShippingDescription')}</p>
            </div>
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('easyReturns')}</h3>
              <p className="text-gray-600">{t('easyReturnsDescription')}</p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer activeRoute="/cart" />
    </div>
  );
}
