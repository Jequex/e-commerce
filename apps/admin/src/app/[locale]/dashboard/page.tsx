'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import StatsCard from '@/components/StatsCard';
import ChartCard from '@/components/ChartCard';
import { usePageStore } from '@/stores/use-page-store';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const common = useTranslations('common');
  const { data } = usePageStore.getState();

  // Sample chart data
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const ordersData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(6, 182, 212, 0.8)',
        ],
      },
    ],
  };

  const categoryData = {
    labels: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#8B5CF6',
          '#F59E0B',
          '#EF4444',
        ],
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('welcome', { store: data.store.name || '' })}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your business today
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Icons.PlusIcon className="w-4 h-4" />
            <span>Add Product</span>
          </button>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Icons.DownloadIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('totalOrders')}
          value="1,234"
          change={{ value: 12, type: 'increase' }}
          icon="FileIcon"
          color="blue"
          delay={0.1}
        />
        <StatsCard
          title={t('totalProducts')}
          value="567"
          change={{ value: 8, type: 'increase' }}
          icon="CubeIcon"
          color="green"
          delay={0.2}
        />
        <StatsCard
          title={t('totalUsers')}
          value="890"
          change={{ value: 5, type: 'decrease' }}
          icon="PersonIcon"
          color="purple"
          delay={0.3}
        />
        <StatsCard
          title={t('revenue')}
          value="$12,345"
          change={{ value: 15, type: 'increase' }}
          icon="BarChartIcon"
          color="orange"
          delay={0.4}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Sales Trend"
          type="line"
          data={salesData}
          delay={0.5}
        />
        <ChartCard
          title="Weekly Orders"
          type="bar"
          data={ordersData}
          delay={0.6}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Icons.RocketIcon className="w-5 h-5 mr-2 text-blue-600" />
            {t('serviceStatus')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: t('authService'), port: '3001', status: t('healthy'), icon: 'LockClosedIcon' },
              { name: t('productService'), port: '3002', status: t('healthy'), icon: 'CubeIcon' },
              { name: t('orderService'), port: '3003', status: t('healthy'), icon: 'FileIcon' },
              { name: t('paymentService'), port: '3004', status: t('healthy'), icon: 'CardStackIcon' },
            ].map((service, index) => {
              const ServiceIcon = Icons[service.icon as keyof typeof Icons];
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <ServiceIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{service.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('port')}: {service.port}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {service.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Category Distribution */}
        <ChartCard
          title="Product Categories"
          type="doughnut"
          data={categoryData}
          delay={0.8}
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Icons.LightningBoltIcon className="w-5 h-5 mr-2 text-purple-600" />
          {t('quickActions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: t('manageProducts'),
              description: t('manageProductsDesc'),
              icon: 'CubeIcon',
              color: 'blue',
            },
            {
              title: t('viewOrders'),
              description: t('viewOrdersDesc'),
              icon: 'FileIcon',
              color: 'green',
            },
            {
              title: t('userManagement'),
              description: t('userManagementDesc'),
              icon: 'PersonIcon',
              color: 'purple',
            },
          ].map((action, index) => {
            const ActionIcon = Icons[action.icon as keyof typeof Icons];
            return (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-left group"
              >
                <div className={`p-3 rounded-lg mb-4 inline-block ${
                  action.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
                  action.color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                  'bg-purple-50 dark:bg-purple-900/20'
                }`}>
                  <ActionIcon className={`w-6 h-6 ${
                    action.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    action.color === 'green' ? 'text-green-600 dark:text-green-400' :
                    'text-purple-600 dark:text-purple-400'
                  }`} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}