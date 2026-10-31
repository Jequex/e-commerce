'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';
import { useAuthStore } from '@/stores/use-auth-store';
import { useRouter } from '@/i18n/navigation';

interface LegalConsent {
  id: string;
  documentType: string;
  versionNumber: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: 'customer' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    totalOrders?: number;
    totalSpent?: number;
  };
  consents?: LegalConsent[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Customer['status']>('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [filterRole, setFilterRole] = useState<'all' | Customer['role']>('all');
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  
  const t = useTranslations('customers');
  const common = useTranslations('common');
  const { token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Note: This endpoint may need to be implemented in auth-service
      // For now, we'll create a placeholder structure
      const url = `http://${urls.customers.getAll}`;
      
      const data = await callApi(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(data.users || data.customers || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      // Set empty array on error so the page still renders
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      await callApi(`http://${urls.customers.delete.replace(':id', customerId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(customers.filter(c => c.id !== customerId));
      alert(t('deleteSuccess'));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      customer.email.toLowerCase().includes(searchLower) ||
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower);
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    
    // Verified filter
    const matchesVerified = filterVerified === 'all' ||
                           (filterVerified === 'verified' && customer.emailVerified) ||
                           (filterVerified === 'unverified' && !customer.emailVerified);
    
    // Role filter
    const matchesRole = filterRole === 'all' || customer.role === filterRole;
    
    return matchesSearch && matchesStatus && matchesVerified && matchesRole;
  });

  const getCustomerName = (customer: Customer) => {
    if (customer.firstName || customer.lastName) {
      return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    }
    return customer.email;
  };

  const getRoleBadgeColor = (role: Customer['role']) => {
    const colors = {
      customer: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      admin: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
      super_admin: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    };
    return colors[role] || colors.customer;
  };

  const getRoleLabel = (role: Customer['role']) => {
    const labels = {
      customer: t('customer'),
      admin: t('admin'),
      super_admin: t('superAdmin'),
    };
    return labels[role] || role;
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
            {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button 
            onClick={fetchCustomers}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Icons.ReloadIcon className="w-4 h-4" />
            <span>{common('refresh')}</span>
          </button>
          <button 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Icons.DownloadIcon className="w-4 h-4" />
            <span>{common('export')}</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Verified Filter */}
          <div>
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Email: All</option>
              <option value="verified">{t('verified')}</option>
              <option value="unverified">{t('unverified')}</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">{t('role')}: All</option>
              <option value="customer">{t('customer')}</option>
              <option value="admin">{t('admin')}</option>
              <option value="super_admin">{t('superAdmin')}</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Customers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Icons.PersonIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('noCustomers')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No customers match your search criteria
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('phone')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('registeredAt')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('lastLogin')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Legal Consents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {common('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {getCustomerName(customer).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getCustomerName(customer)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                            <span>{customer.email}</span>
                            {customer.emailVerified && (
                              <span title="Verified">
                                <Icons.CheckCircledIcon className="h-4 w-4 text-green-500" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(customer.role)}`}>
                        {getRoleLabel(customer.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {customer.phone || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.lastLoginAt 
                          ? new Date(customer.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status === 'active' 
                          ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                          : customer.status === 'suspended'
                          ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                          : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
                      }`}>
                        {customer.status === 'active' ? t('active') : customer.status === 'suspended' ? 'Suspended' : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.consents && customer.consents.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Icons.CheckCircledIcon className="w-3.5 h-3.5" />
                          {customer.consents.length} Signed
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">None signed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewingCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title={common('view')}
                        >
                          <Icons.EyeOpenIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => router.push(`/customers/${customer.id}/edit`)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title={common('edit')}
                        >
                          <Icons.Pencil1Icon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title={common('delete')}
                        >
                          <Icons.TrashIcon className="h-5 w-5" />
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

      {/* Customer Details & Legal Consents Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  {getCustomerName(viewingCustomer).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                      {getCustomerName(viewingCustomer)}
                    </h3>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${getRoleBadgeColor(viewingCustomer.role)}`}>
                      {getRoleLabel(viewingCustomer.role)}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      viewingCustomer.status === 'active'
                        ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                        : viewingCustomer.status === 'suspended'
                        ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                        : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
                    }`}>
                      {viewingCustomer.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5 truncate">
                    {viewingCustomer.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingCustomer(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
              >
                <Icons.Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Profile Details Grid */}
              <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Account Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 block">User ID</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200 truncate block select-all text-[11px]">
                      {viewingCustomer.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 block">Email Verified</span>
                    <span className={`font-semibold ${viewingCustomer.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-amber-500'}`}>
                      {viewingCustomer.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 block">Phone</span>
                    <span className="text-gray-800 dark:text-gray-200">{viewingCustomer.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 block">Registered At</span>
                    <span className="text-gray-800 dark:text-gray-200">{new Date(viewingCustomer.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 block">Last Login</span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {viewingCustomer.lastLoginAt ? new Date(viewingCustomer.lastLoginAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 block">Lifetime Orders</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {viewingCustomer.metadata?.totalOrders ?? '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accepted Legal Agreements & Consent Logs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Accepted Legal Consents & Policies ({viewingCustomer.consents?.length || 0})
                  </h4>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">GDPR & Compliance audit log</span>
                </div>

                {!viewingCustomer.consents || viewingCustomer.consents.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 rounded-xl p-8 text-center text-gray-400 dark:text-gray-500">
                    <Icons.CheckCircledIcon className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                    <p className="text-sm">No legal consent records found for this customer.</p>
                    <p className="text-xs mt-1">Consents are automatically tracked upon sign up or policy updates.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="py-3 px-4">Document / Policy</th>
                          <th className="py-3 px-4">Version</th>
                          <th className="py-3 px-4">Accepted Timestamp</th>
                          <th className="py-3 px-4">IP Address</th>
                          <th className="py-3 px-4">User Agent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                        {viewingCustomer.consents.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-100/60 dark:hover:bg-gray-700/30">
                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white capitalize">
                              {c.documentType.replace(/_/g, ' ')}
                            </td>
                            <td className="py-3 px-4 font-mono text-blue-600 dark:text-indigo-400">
                              {c.versionNumber}
                            </td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                              {new Date(c.acceptedAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-500 dark:text-gray-400">
                              {c.ipAddress || '—'}
                            </td>
                            <td className="py-3 px-4 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={c.userAgent}>
                              {c.userAgent || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setViewingCustomer(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
