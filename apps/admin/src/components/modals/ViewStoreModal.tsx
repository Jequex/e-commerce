'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';

interface Store {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo: string | null;
  coverImage: string | null;
  rating: number | null;
  reviewCount: number;
  isActive: boolean;
  isVerified: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  addresses?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  }[];
}

interface ViewStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store | null;
}

export default function ViewStoreModal({
  isOpen,
  onClose,
  store,
}: ViewStoreModalProps) {
  const t = useTranslations('stores');
  const common = useTranslations('common');

  if (!isOpen || !store) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
            {t('viewStore')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.Cross2Icon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Store Images */}
          <div className="space-y-2">
            {store.coverImage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover Image
                </label>
                <img
                  src={store.coverImage}
                  alt={store.name}
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
            {store.logo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo
                </label>
                <img
                  src={store.logo}
                  alt={`${store.name} logo`}
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
          </div>

          {/* Store Name and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('name')}
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {store.name}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {common('status')}
              </label>
              <div className="flex gap-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  store.isActive 
                    ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                    : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
                }`}>
                  {store.isActive ? t('active') : t('inactive')}
                </span>
                {store.isVerified && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                    {t('verified')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {store.description && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('description')}
              </label>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {store.description}
              </p>
            </div>
          )}

          {/* Category */}
          {store.category && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('category')}
              </label>
              <p className="text-gray-900 dark:text-white">
                {store.category}
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {store.email && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {common('email')}
                </label>
                <p className="text-gray-900 dark:text-white break-all">
                  {store.email}
                </p>
              </div>
            )}

            {store.phone && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {common('phone')}
                </label>
                <p className="text-gray-900 dark:text-white">
                  {store.phone}
                </p>
              </div>
            )}

            {store.website && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Website
                </label>
                <a 
                  href={store.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {store.website}
                </a>
              </div>
            )}
          </div>

          {/* Rating */}
          {store.rating !== null && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rating
              </label>
              <div className="flex items-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Icons.StarFilledIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(store.rating || 0)
                          ? 'text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {store.rating?.toFixed(1)}
                </span>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  ({store.reviewCount} {t('reviews')})
                </span>
              </div>
            </div>
          )}

          {/* Addresses */}
          {store.addresses && store.addresses.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {common('address')}
              </label>
              <div className="space-y-3">
                {store.addresses.map((address, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <p className="text-gray-900 dark:text-white">
                      {address.street}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {address.country}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Created At
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {formatDate(store.createdAt)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Last Updated
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {formatDate(store.updatedAt)}
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
