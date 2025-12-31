'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import * as Icons from '@radix-ui/react-icons';

interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  parentId: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: Category | null;
  children?: Category[];
  products?: any[];
}

interface ViewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
}

export default function ViewCategoryModal({ isOpen, onClose, category }: ViewCategoryModalProps) {
  const t = useTranslations('categories');
  const common = useTranslations('common');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('viewCategory')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Icons.Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Image */}
          {category.image && (
            <div className="flex justify-center">
              <img 
                src={category.image} 
                alt={category.name}
                className="w-48 h-48 rounded-xl object-cover shadow-lg"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('categoryName')}
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{category.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('slug')}
              </label>
              <p className="text-lg text-gray-900 dark:text-white font-mono">{category.slug}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('status')}
              </label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                category.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {category.isActive ? t('active') : t('inactive')}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('sortOrder')}
              </label>
              <p className="text-lg text-gray-900 dark:text-white">{category.sortOrder}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('parentCategory')}
              </label>
              {category.parentId ? (
                <p className="text-lg text-gray-900 dark:text-white">
                  {category.parent?.name || category.parentId}
                </p>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Main Category
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {category.description && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {t('description')}
              </label>
              <p className="text-gray-900 dark:text-white leading-relaxed">
                {category.description}
              </p>
            </div>
          )}

          {/* Subcategories */}
          {category.children && category.children.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                {t('subcategories')} ({category.children.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {category.children.map(child => (
                  <div key={child.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Icons.ComponentInstanceIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-900 dark:text-white">{child.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEO Metadata */}
          {(category.metaTitle || category.metaDescription) && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO Metadata</h3>
              
              {category.metaTitle && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('metaTitle')}
                  </label>
                  <p className="text-gray-900 dark:text-white">{category.metaTitle}</p>
                </div>
              )}

              {category.metaDescription && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('metaDescription')}
                  </label>
                  <p className="text-gray-900 dark:text-white">{category.metaDescription}</p>
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1">Created At</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(category.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1">Updated At</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(category.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {common('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
