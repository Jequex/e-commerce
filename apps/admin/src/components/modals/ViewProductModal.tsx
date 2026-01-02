'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';

interface Category {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  parentId: number | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  compareAtPrice: number | string | null;
  costPerItem: number | null;
  sku: string | null;
  barcode: string | null;
  trackQuantity: boolean;
  inventoryQuantity: number;
  category: Category | null;
  images: { src: string; position?: number }[] | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export default function ViewProductModal({
  isOpen,
  onClose,
  product,
}: ViewProductModalProps) {
  const t = useTranslations('products');
  const common = useTranslations('common');

  if (!isOpen || !product) return null;

  const formatPrice = (price: number | string | null) => {
    if (price === null) return '-';
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return `$${numPrice.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: t('outOfStock'), color: 'text-red-600 bg-red-50 dark:bg-red-900/20' };
    if (quantity <= 10) return { label: t('lowStock'), color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' };
    return { label: t('inStock'), color: 'text-green-600 bg-green-50 dark:bg-green-900/20' };
  };

  const stockStatus = getStockStatus(product.inventoryQuantity);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('viewProduct')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.Cross2Icon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Images */}
          {product.images && product.images.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('image')}
              </label>
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.src}
                    alt={`${product.name} ${index + 1}`}
                    className="h-32 w-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Product Name and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('productName')}
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {product.name}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {common('status')}
              </label>
              <div className="flex gap-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  product.isActive 
                    ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                    : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
                }`}>
                  {product.isActive ? t('active') : t('inactive')}
                </span>
                {product.isFeatured && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full text-purple-600 bg-purple-50 dark:bg-purple-900/20">
                    {t('featured')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('description')}
              </label>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* Pricing Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('price')}
              </label>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatPrice(product.price)}
              </p>
            </div>

            {product.compareAtPrice && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('compareAtPrice')}
                </label>
                <p className="text-xl font-semibold text-gray-500 dark:text-gray-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </p>
              </div>
            )}

            {product.costPerItem !== null && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cost Per Item
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPrice(product.costPerItem)}
                </p>
              </div>
            )}
          </div>

          {/* SKU and Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('sku')}
              </label>
              <p className="text-gray-900 dark:text-white font-mono">
                {product.sku || '-'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('barcode')}
              </label>
              <p className="text-gray-900 dark:text-white font-mono">
                {product.barcode || '-'}
              </p>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('category')}
            </label>
            <p className="text-gray-900 dark:text-white">
              {product.category?.name || '-'}
            </p>
          </div>

          {/* Inventory Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('quantity')}
              </label>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.inventoryQuantity}
                </p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                  {stockStatus.label}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('trackQuantity')}
              </label>
              <p className="text-gray-900 dark:text-white">
                {product.trackQuantity ? (
                  <span className="flex items-center text-green-600 dark:text-green-400">
                    <Icons.CheckIcon className="h-5 w-5 mr-1" />
                    Enabled
                  </span>
                ) : (
                  <span className="flex items-center text-gray-500 dark:text-gray-400">
                    <Icons.Cross2Icon className="h-5 w-5 mr-1" />
                    Disabled
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Created At
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {formatDate(product.createdAt)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Last Updated
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {formatDate(product.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {common('close')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
