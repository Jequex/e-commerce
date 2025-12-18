'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';
import { useAuthStore } from '@/stores/use-auth-store';
import { usePageStore } from '@/stores/use-page-store';

interface StaffMember {
  id: string;
  storeId: string;
  userId: string;
  roleId: string;
  salary: string | null;
  commission: string | null;
  isActive: boolean;
  hiredAt: string;
  terminatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  store: {
    id: string;
    name: string;
    category: string | null;
  };
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface Store {
  id: string;
  name: string;
  staff: StaffMember[];
}

export default function StaffPage() {
  // const [stores, setStores] = useState<Store[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  // const [filterStore, setFilterStore] = useState<'all' | string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const t = useTranslations('staff');
  const common = useTranslations('common');
  const { token } = useAuthStore();
  const { data: pageData } = usePageStore.getState();

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const url = `http://${urls.staff.getStaff.replace(':id', pageData?.store?.id || '')}`;
      
      const data = await callApi(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // const storesData = data.stores || data || [];
      // setStores(storesData);

      // Flatten staff from all stores
      // const allStaff: StaffMember[] = [];
      // storesData.forEach((store: Store) => {
      //   if (store.staff && Array.isArray(store.staff)) {
      //     store.staff.forEach((staff: StaffMember) => {
      //       allStaff.push({
      //         ...staff,
      //         store: {
      //           id: store.id,
      //           name: store.name,
      //           category: (store as any).category || null,
      //         }
      //       });
      //     });
      //   }
      // });

      setStaffMembers(data.staff);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staffMembers.filter((staff) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      staff.user?.email?.toLowerCase().includes(searchLower) ||
      staff.user?.firstName?.toLowerCase().includes(searchLower) ||
      staff.user?.lastName?.toLowerCase().includes(searchLower) ||
      staff.role?.name?.toLowerCase().includes(searchLower) ||
      staff.store?.name?.toLowerCase().includes(searchLower);
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && staff.isActive) ||
                         (filterStatus === 'inactive' && !staff.isActive);
    
    // Store filter
    // const matchesStore = filterStore === 'all' || staff.storeId === filterStore;

    console.log(matchesSearch, matchesStatus);
    
    
    return  matchesStatus // && matchesStore;
  });

  const getStaffName = (staff: StaffMember) => {
    if (staff.user?.firstName || staff.user?.lastName) {
      return `${staff.user?.firstName || ''} ${staff.user?.lastName || ''}`.trim();
    }
    return staff.user?.email || 'Unknown';
  };

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
            {filteredStaff.length} {filteredStaff.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Icons.PlusIcon className="w-4 h-4" />
            <span>{t('addStaff')}</span>
          </button>
        </div>
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
              <option value="all">{t('status')}: All</option>
              <option value="active">{t('active')}</option>
              <option value="inactive">{t('inactive')}</option>
            </select>
          </div>

          {/* Store Filter */}
          {/* <div>
            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">{t('store')}: All</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div> */}
        </div>
      </motion.div>

      {/* Staff Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center">
            <Icons.PersonIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('noStaff')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Add staff members to manage your stores
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('store')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('salary')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('hiredAt')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {common('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {getStaffName(staff).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getStaffName(staff)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {staff.user?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {staff.store?.name || 'Unknown Store'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                        {staff.role?.name || 'No Role'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {staff.salary ? `$${parseFloat(staff.salary).toFixed(2)}` : 'N/A'}
                      </div>
                      {staff.commission && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{parseFloat(staff.commission).toFixed(1)}% commission
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(staff.hiredAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        staff.isActive 
                          ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                          : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
                      }`}>
                        {staff.isActive ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title={common('view')}
                        >
                          <Icons.EyeOpenIcon className="h-5 w-5" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title={common('edit')}
                        >
                          <Icons.Pencil1Icon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Staff Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('addStaff')}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Icons.Cross2Icon className="h-6 w-6" />
              </button>
            </div>
            <div className="text-center py-8">
              <Icons.InfoCircledIcon className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Staff management form coming soon...
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
