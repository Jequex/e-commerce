'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';
import { useAuthStore } from '@/stores/use-auth-store';
import { usePageStore } from '@/stores/use-page-store';
import { useRouter } from '@/i18n/navigation';
import { permission } from 'process';
import ViewStoreModal from '@/components/modals/ViewStoreModal';
import EditStoreModal from '@/components/modals/EditStoreModal';

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

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  
  const t = useTranslations('stores');
  const common = useTranslations('common');
  const { token } = useAuthStore();
  const { data: {permissionsByResource : { stores : storePermissions } } } = usePageStore.getState();
  const router = useRouter();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    setError('');
    
    try {
      const url = `http://${urls.store.getAll}`;
      
      const data = await callApi(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStores(data.stores || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storeId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      await callApi(`http://${urls.store.delete.replace(':id', storeId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStores(stores.filter(s => s.id !== storeId));
      alert(t('deleteSuccess'));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete store');
    }
  };

  const handleViewClick = (store: Store) => {
    setSelectedStore(store);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (store: Store) => {
    setSelectedStore(store);
    setIsEditModalOpen(true);
  };

  const handleStoreUpdated = (updatedStore: Store) => {
    setStores(stores.map(s => s.id === updatedStore.id ? updatedStore : s));
    setSelectedStore(null);
  };

  const filteredStores = stores.filter((store) => {
    // Search filter
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         store.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         store.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && store.isActive) ||
                         (filterStatus === 'inactive' && !store.isActive);
    
    // Verified filter
    const matchesVerified = filterVerified === 'all' ||
                           (filterVerified === 'verified' && store.isVerified) ||
                           (filterVerified === 'unverified' && !store.isVerified);
    
    return matchesSearch && matchesStatus && matchesVerified;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredStores.length} {filteredStores.length === 1 ? 'store' : 'stores'}
          </p>
        </div>
        {storePermissions?.find((permission:{action: string}) => permission.action === 'create') && <div className="mt-4 md:mt-0">
          <button 
            onClick={() => router.push('/stores/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Icons.PlusIcon className="w-4 h-4" />
            <span>{t('addStore')}</span>
          </button>
        </div>}
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start"
        >
          <Icons.ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Icons.MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">{common('status')}: All</option>
              <option value="active">{t('active')}</option>
              <option value="inactive">{t('inactive')}</option>
            </select>
          </div>

          {/* Verified Filter */}
          <div>
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Verification: All</option>
              <option value="verified">{t('verified')}</option>
              <option value="unverified">{t('unverified')}</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Stores Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {filteredStores.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Icons.ArchiveIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('noStores')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get started by adding your first store
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Store Cover Image */}
                <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                  {store.coverImage ? (
                    <img src={store.coverImage} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icons.ImageIcon className="h-12 w-12 text-white/50" />
                    </div>
                  )}
                  {/* Status Badges */}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      store.isActive 
                        ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                        : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
                    }`}>
                      {store.isActive ? t('active') : t('inactive')}
                    </span>
                    {store.isVerified && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                        <Icons.CheckCircledIcon className="h-3 w-3 mr-1" />
                        {t('verified')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Store Info */}
                <div className="p-5">
                  {/* Logo and Name */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center -mt-8 border-4 border-white dark:border-gray-800">
                        {store.logo ? (
                          <img src={store.logo} alt={store.name} className="w-full h-full rounded-lg object-cover" />
                        ) : (
                          <Icons.HomeIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {store.name}
                        </h3>
                        {store.category && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {store.category}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {store.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {store.description}
                    </p>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    {store.email && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Icons.EnvelopeClosedIcon className="h-4 w-4 mr-2" />
                        <span className="truncate">{store.email}</span>
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Icons.MobileIcon className="h-4 w-4 mr-2" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                    {store.website && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Icons.GlobeIcon className="h-4 w-4 mr-2" />
                        <a href={store.website} target="_blank" rel="noopener noreferrer" className="truncate hover:text-blue-600">
                          {store.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  {store.rating !== null && (
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Icons.StarFilledIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(store.rating || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {store.rating?.toFixed(1)} ({store.reviewCount} {t('reviews')})
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {storePermissions?.find((permission:{action: string}) => permission.action === 'view') && <button
                      onClick={() => handleViewClick(store)}
                      className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center space-x-1"
                      title={common('view')}
                    >
                      <Icons.EyeOpenIcon className="h-4 w-4" />
                      <span>{common('view')}</span>
                    </button>}
                    {storePermissions?.find((permission:{action: string}) => permission.action === 'update') && <button
                      onClick={() => handleEditClick(store)}
                      className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center space-x-1"
                      title={common('edit')}
                    >
                      <Icons.Pencil1Icon className="h-4 w-4" />
                      <span>{common('edit')}</span>
                    </button>}
                    {storePermissions?.find((permission:{action: string}) => permission.action === 'delete') && <button
                      onClick={() => handleDelete(store.id)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={common('delete')}
                    >
                      <Icons.TrashIcon className="h-4 w-4" />
                    </button>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      
      {/* View Store Modal */}
      <ViewStoreModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedStore(null);
        }}
        store={selectedStore}
      />
      
      {/* Edit Store Modal */}
      <EditStoreModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStore(null);
        }}
        onSuccess={handleStoreUpdated}
        store={selectedStore}
      />
    </div>
  );
}
