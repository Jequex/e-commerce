'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import StatsCard from '@/components/StatsCard';
import ChartCard from '@/components/ChartCard';
import { usePageStore } from '@/stores/use-page-store';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';
import { Link, useRouter } from '@/i18n/navigation';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const common = useTranslations('common');
  const router = useRouter();
  const { data, userStores } = usePageStore.getState();
  const [currentStore, setCurrentStore] = useState<any>(data?.store || userStores?.[0] || null);
  const [loading, setLoading] = useState(true);

  // Real dashboard statistics
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeStoresCount, setActiveStoresCount] = useState(0);

  // Dynamic Chart States
  const [salesData, setSalesData] = useState({
    labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
    datasets: [
      {
        label: 'Sales ($)',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  });

  const [ordersData, setOrdersData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: [0, 0, 0, 0, 0, 0, 0],
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
  });

  const [categoryData, setCategoryData] = useState({
    labels: ['No Products'],
    datasets: [
      {
        data: [0],
        backgroundColor: ['rgba(156, 163, 175, 0.5)'],
      },
    ],
  });

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch user stores
        let storesList: any[] = [];
        try {
          const storeRes = await callApi(`http://${urls.store.getUserStores}`);
          storesList = storeRes.stores || (Array.isArray(storeRes) ? storeRes : storeRes?.data || []);
          usePageStore.getState().setUserStores(storesList);
          if (storesList.length > 0) {
            const activeStore = data?.store || storesList[0];
            usePageStore.getState().setData({
              ...usePageStore.getState().data,
              store: activeStore,
            });
            setCurrentStore(activeStore);
          }
        } catch (err) {
          console.warn('Could not load user stores in dashboard:', err);
          storesList = usePageStore.getState().userStores || [];
        }
        setActiveStoresCount(storesList.length);

        // 2. Fetch products if stores exist
        let fetchedProducts: any[] = [];
        if (storesList.length > 0) {
          try {
            const prodRes = await callApi(`http://${urls.products.getMyProducts}`);
            fetchedProducts = prodRes.products || (Array.isArray(prodRes) ? prodRes : []);
            setTotalProducts(prodRes.total !== undefined ? prodRes.total : fetchedProducts.length);
          } catch (err) {
            console.warn('Could not load products in dashboard:', err);
          }
        } else {
          setTotalProducts(0);
        }

        // Compute Product Categories Distribution
        if (fetchedProducts.length > 0) {
          const catMap: { [key: string]: number } = {};
          fetchedProducts.forEach((p) => {
            const catName = p.category?.name || p.categoryName || 'Uncategorized';
            catMap[catName] = (catMap[catName] || 0) + 1;
          });

          const catLabels = Object.keys(catMap);
          const catCounts = Object.values(catMap);
          const palette = [
            '#3B82F6',
            '#10B981',
            '#8B5CF6',
            '#F59E0B',
            '#EF4444',
            '#EC4899',
            '#06B6D4',
            '#6366F1',
          ];

          setCategoryData({
            labels: catLabels,
            datasets: [
              {
                data: catCounts,
                backgroundColor: catLabels.map((_, i) => palette[i % palette.length]),
              },
            ],
          });
        } else {
          setCategoryData({
            labels: ['No Products'],
            datasets: [
              {
                data: [1],
                backgroundColor: ['rgba(209, 213, 219, 0.4)'],
              },
            ],
          });
        }

        // 3. Fetch Orders
        let fetchedOrders: any[] = [];
        try {
          const orderRes = await callApi(`http://${urls.orders.getAll}`);
          fetchedOrders = orderRes.orders || (Array.isArray(orderRes) ? orderRes : []);
          setTotalOrders(orderRes.pagination?.total !== undefined ? orderRes.pagination.total : fetchedOrders.length);
        } catch (err) {
          console.warn('Could not load orders in dashboard:', err);
        }

        // Compute Total Revenue
        const revenue = fetchedOrders.reduce((sum: number, o: any) => {
          const amount = Number(o.totalPrice ?? o.total_price ?? o.totalAmount ?? 0);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        setTotalRevenue(revenue);

        // Compute Sales Trend (Last 6 Months)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const past6Months: { key: string; label: string; total: number }[] = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const label = `${monthNames[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ''}`.trim();
          past6Months.push({ key, label, total: 0 });
        }

        fetchedOrders.forEach((o: any) => {
          const dateStr = o.createdAt || o.created_at;
          if (dateStr) {
            const d = new Date(dateStr);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const target = past6Months.find((m) => m.key === key);
            if (target) {
              const amount = Number(o.totalPrice ?? o.total_price ?? o.totalAmount ?? 0);
              target.total += isNaN(amount) ? 0 : amount;
            }
          }
        });

        setSalesData({
          labels: past6Months.map((m) => m.label),
          datasets: [
            {
              label: 'Sales ($)',
              data: past6Months.map((m) => m.total),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        });

        // Compute Weekly Orders (Mon - Sun of current week)
        const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon (0) to Sun (6)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        fetchedOrders.forEach((o: any) => {
          const dateStr = o.createdAt || o.created_at;
          if (dateStr) {
            const d = new Date(dateStr);
            if (d >= sevenDaysAgo) {
              // getDay(): 0 is Sunday, 1 is Monday... 6 is Saturday
              const dayIndex = (d.getDay() + 6) % 7; // Convert to Mon=0, Sun=6
              dayCounts[dayIndex] += 1;
            }
          }
        });

        setOrdersData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Orders',
              data: dayCounts,
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
        });
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

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
            {currentStore?.name || currentStore?.storeName
              ? t('welcome', { store: currentStore.name || currentStore.storeName })
              : t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentStore?.name || currentStore?.storeName
              ? "Here's what's happening with your business today"
              : 'Get started by creating your first store to manage products, orders, and payouts'}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Icons.DownloadIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </motion.div>

      {/* No Store Banner */}
      {!loading && !currentStore && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <Icons.InfoCircledIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                No Store Created Yet
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                You need a store before you can add products, track inventory, and accept orders.
              </p>
            </div>
          </div>
          <Link
            href="/stores"
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Create Store
          </Link>
        </motion.div>
      )}

      {/* Stats Cards with Live Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('totalOrders')}
          value={totalOrders.toLocaleString()}
          icon="FileIcon"
          color="blue"
          delay={0.1}
        />
        <StatsCard
          title={t('totalProducts')}
          value={totalProducts.toLocaleString()}
          icon="CubeIcon"
          color="green"
          delay={0.2}
        />
        <StatsCard
          title="Active Stores"
          value={activeStoresCount.toString()}
          icon="HomeIcon"
          color="purple"
          delay={0.3}
        />
        <StatsCard
          title={t('revenue')}
          value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="BarChartIcon"
          color="orange"
          delay={0.4}
        />
      </div>

      {/* Charts Section with Dynamic Data */}
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
              href: '/products',
            },
            {
              title: t('viewOrders'),
              description: t('viewOrdersDesc'),
              icon: 'FileIcon',
              color: 'green',
              href: '/orders',
            },
            {
              title: 'Store Management',
              description: 'Manage store profiles and operations',
              icon: 'HomeIcon',
              color: 'purple',
              href: '/stores',
            },
          ].map((action, index) => {
            const ActionIcon = Icons[action.icon as keyof typeof Icons];
            return (
              <motion.button
                key={action.title}
                onClick={() => router.push(action.href as any)}
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
