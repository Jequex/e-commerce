'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';
import { useAuthStore } from '@/stores/use-auth-store';
import { toast } from 'react-toastify';

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

interface EditStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (store: Store) => void;
  store: Store | null;
}

export default function EditStoreModal({
  isOpen,
  onClose,
  onSuccess,
  store,
}: EditStoreModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations('stores');
  const common = useTranslations('common');
  const { token } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!store) return;

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const storeData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      website: formData.get('website') as string,
      isActive: formData.get('isActive') === 'on',
    };

    try {
      const url = `http://${urls.store.update.replace(':id', store.id)}`;
      const updatedStore = await callApi(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(storeData),
      });

      toast.success(t('updateSuccess'));
      onSuccess(updatedStore.store || updatedStore);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update store';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !store) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('editStore')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.Cross2Icon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={store.name}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter store name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('description')}
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={store.description || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter store description"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('category')}
            </label>
            <input
              type="text"
              name="category"
              defaultValue={store.category || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Electronics, Fashion, Food"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {common('email')}
              </label>
              <input
                type="email"
                name="email"
                defaultValue={store.email || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="store@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {common('phone')}
              </label>
              <input
                type="tel"
                name="phone"
                defaultValue={store.phone || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              name="website"
              defaultValue={store.website || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://example.com"
            />
          </div>

          {/* Active Status */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={store.isActive}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('active')}
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {common('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{common('saving')}</span>
                </>
              ) : (
                <>
                  <Icons.CheckIcon className="w-4 h-4" />
                  <span>{common('save')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
