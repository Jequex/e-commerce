'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../components/SuperAdminLayout';
import Link from 'next/link';
import * as Icons from '@radix-ui/react-icons';
import { useAuthStore } from '../stores/useAuthStore';
import ChartCard from '../components/ChartCard';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Global platform metrics
  const [globalStats, setGlobalStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalStores: 0,
    activeStores: 0,
    grossRevenue: 0,
    platformProfit: 0,
    categoriesCount: 0,
    adminsCount: 0,
    legalPoliciesCount: 3,
  });

  const [policies, setPolicies] = useState<any[]>([]);

  // Dynamic Chart States
  const [salesData, setSalesData] = useState({
    labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
    datasets: [
      {
        label: 'Platform Sales ($)',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: '#3b82f6',
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
        label: 'Global Orders',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.85)',
          'rgba(16, 185, 129, 0.85)',
          'rgba(139, 92, 246, 0.85)',
          'rgba(245, 101, 101, 0.85)',
          'rgba(251, 191, 36, 0.85)',
          'rgba(236, 72, 153, 0.85)',
          'rgba(6, 182, 212, 0.85)',
        ],
      },
    ],
  });

  const [categoryData, setCategoryData] = useState({
    labels: ['No Products'],
    datasets: [
      {
        data: [1],
        backgroundColor: ['rgba(148, 163, 184, 0.3)'],
      },
    ],
  });

  // Infrastructure health statuses
  const [serviceHealth, setServiceHealth] = useState([
    { name: 'Auth Service', port: '3001', status: 'Healthy', icon: 'LockClosedIcon', healthy: true },
    { name: 'Product Service', port: '3002', status: 'Healthy', icon: 'CubeIcon', healthy: true },
    { name: 'Order Service', port: '3003', status: 'Healthy', icon: 'FileIcon', healthy: true },
    { name: 'Payment Service', port: '3004', status: 'Healthy', icon: 'CardStackIcon', healthy: true },
    { name: 'Store Service', port: '3007', status: 'Healthy', icon: 'HomeIcon', healthy: true },
  ]);

  useEffect(() => {
    async function loadGlobalDashboard() {
      setLoading(true);
      const authToken =
        token ||
        (typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('super-admin-auth') || '{}')?.state?.token ||
            localStorage.getItem('token')
          : '');

      const authHeaders: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      try {
        const [
          prodRes,
          catRes,
          adminRes,
          legalRes,
          ordersRes,
          storesRes,
          reportsRes,
        ] = await Promise.allSettled([
          fetch('/api/products?limit=100').then((r) => r.json()),
          fetch('/api/products/categories').then((r) => r.json()),
          fetch('/api/auth/admins', { headers: authHeaders }).then((r) => r.json()),
          fetch('/api/store/legal').then((r) => r.json()),
          fetch('/api/orders/admin/all', { headers: authHeaders }).then((r) => r.json()),
          fetch('/api/stores/?limit=100').then((r) => r.json()),
          fetch('/api/orders/admin/platform-reports', { headers: authHeaders }).then((r) => r.json()),
        ]);

        // 1. Products
        const prodData = prodRes.status === 'fulfilled' ? prodRes.value : {};
        const allProducts = prodData.products || (Array.isArray(prodData) ? prodData : []);
        const productsCount = Number(prodData?.pagination?.total ?? prodData?.total ?? allProducts.length);

        // 2. Categories
        const catData = catRes.status === 'fulfilled' ? catRes.value : {};
        const categoriesList = catData.categories || (Array.isArray(catData) ? catData : []);
        const categoriesCount = categoriesList.length;

        // 3. Admins
        const adminData = adminRes.status === 'fulfilled' ? adminRes.value : {};
        const adminsCount = (adminData.admins || (Array.isArray(adminData) ? adminData : [])).length;

        // 4. Legal Policies
        const legalData = legalRes.status === 'fulfilled' ? legalRes.value : {};
        const docs = legalData.documents || (Array.isArray(legalData) ? legalData : []);
        setPolicies(docs);

        // 5. Stores
        const storesData = storesRes.status === 'fulfilled' ? storesRes.value : {};
        const allStores = storesData.stores || (Array.isArray(storesData) ? storesData : []);
        const totalStores = allStores.length;
        const activeStores = allStores.filter((s: any) => s.status === 'active' || !s.status).length;

        // 6. Orders & Revenue
        const ordersDataResponse = ordersRes.status === 'fulfilled' ? ordersRes.value : {};
        const allOrders = ordersDataResponse.orders || (Array.isArray(ordersDataResponse) ? ordersDataResponse : []);
        const totalOrders = Number(ordersDataResponse.pagination?.total ?? allOrders.length);

        const grossRevenue = allOrders.reduce((sum: number, o: any) => {
          const amt = Number(o.totalPrice ?? o.total_price ?? o.totalAmount ?? 0);
          return sum + (isNaN(amt) ? 0 : amt);
        }, 0);

        // 7. Platform Net Profit
        const reportsData = reportsRes.status === 'fulfilled' ? reportsRes.value : {};
        const platformProfit = Number(reportsData.summary?.netPlatformProfit ?? 0);

        setGlobalStats({
          totalOrders,
          totalProducts: productsCount,
          totalStores,
          activeStores,
          grossRevenue,
          platformProfit,
          categoriesCount,
          adminsCount,
          legalPoliciesCount: docs.length || 3,
        });

        // Compute Product Categories Distribution
        if (allProducts.length > 0) {
          const catMap: { [key: string]: number } = {};
          allProducts.forEach((p: any) => {
            const catName = p.category?.name || p.categoryName || 'Uncategorized';
            catMap[catName] = (catMap[catName] || 0) + 1;
          });

          const catLabels = Object.keys(catMap);
          const catCounts = Object.values(catMap);
          const palette = [
            '#3b82f6',
            '#10b981',
            '#8b5cf6',
            '#f59e0b',
            '#ef4444',
            '#ec4899',
            '#06b6d4',
            '#6366f1',
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
                backgroundColor: ['rgba(148, 163, 184, 0.3)'],
              },
            ],
          });
        }

        // Compute Sales Trend (Last 6 Months across platform)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const past6Months: { key: string; label: string; total: number }[] = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const label = `${monthNames[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ''}`.trim();
          past6Months.push({ key, label, total: 0 });
        }

        allOrders.forEach((o: any) => {
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
              label: 'Platform Sales ($)',
              data: past6Months.map((m) => m.total),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              tension: 0.4,
              fill: true,
            },
          ],
        });

        // Compute Weekly Orders (Mon - Sun of current week across platform)
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        allOrders.forEach((o: any) => {
          const dateStr = o.createdAt || o.created_at;
          if (dateStr) {
            const d = new Date(dateStr);
            if (d >= sevenDaysAgo) {
              const dayIndex = (d.getDay() + 6) % 7;
              dayCounts[dayIndex] += 1;
            }
          }
        });

        setOrdersData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Global Orders',
              data: dayCounts,
              backgroundColor: [
                'rgba(59, 130, 246, 0.85)',
                'rgba(16, 185, 129, 0.85)',
                'rgba(139, 92, 246, 0.85)',
                'rgba(245, 101, 101, 0.85)',
                'rgba(251, 191, 36, 0.85)',
                'rgba(236, 72, 153, 0.85)',
                'rgba(6, 182, 212, 0.85)',
              ],
            },
          ],
        });

        // Test health checks
        try {
          const checks = await Promise.allSettled([
            fetch('/api/auth/health').then((r) => r.ok),
            fetch('/api/products/health').then((r) => r.ok),
            fetch('/api/orders/health').then((r) => r.ok),
            fetch('/api/payments/health').then((r) => r.ok),
            fetch('/api/stores/health').then((r) => r.ok),
          ]);

          setServiceHealth((prev) =>
            prev.map((s, idx) => ({
              ...s,
              healthy: checks[idx]?.status === 'fulfilled' ? Boolean(checks[idx].value) : true,
              status: (checks[idx]?.status === 'fulfilled' && checks[idx].value) ? 'Healthy' : 'Active',
            }))
          );
        } catch (_) {}
      } catch (e) {
        console.error('Failed to load global dashboard data', e);
      } finally {
        setLoading(false);
      }
    }

    loadGlobalDashboard();
  }, [token]);

  return (
    <SuperAdminLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Icons.GlobeIcon className="w-7 h-7 text-indigo-400" />
              Global Command Center & Platform Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Global tracking for all stores, products, orders, revenues, and microservice infrastructure health.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Icons.DownloadIcon className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Global Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Global Total Orders */}
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Total System Orders</span>
              <Icons.FileIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              {loading ? '...' : globalStats.totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Orders placed across all stores</p>
          </div>

          {/* Global Total Products */}
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Total Catalog Products</span>
              <Icons.CubeIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              {loading ? '...' : globalStats.totalProducts.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Products across entire platform</p>
          </div>

          {/* Global Stores */}
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Platform Stores</span>
              <Icons.HomeIcon className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              {loading ? '...' : globalStats.totalStores}
            </div>
            <p className="text-xs text-emerald-400 mt-1 font-medium">
              {globalStats.activeStores} Active merchant stores
            </p>
          </div>

          {/* Global Revenue */}
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Gross Sales</span>
              <Icons.BarChartIcon className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              {loading
                ? '...'
                : `$${globalStats.grossRevenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </div>
            <p className="text-xs text-slate-400 mt-1">All processed transactions</p>
          </div>
        </div>

        {/* Global Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Global Sales Trend (Platform-Wide)"
            type="line"
            data={salesData}
            delay={0.2}
          />
          <ChartCard
            title="Weekly Order Volume (All Stores)"
            type="bar"
            data={ordersData}
            delay={0.3}
          />
        </div>

        {/* Infrastructure Service Status & Global Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Infrastructure Service Status (Moved from Admin App) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Icons.RocketIcon className="w-5 h-5 text-indigo-400" />
                Infrastructure & Microservices Status
              </h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                Super Admin Exclusive
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {serviceHealth.map((service, index) => {
                const IconComponent = Icons[service.icon as keyof typeof Icons] || Icons.RocketIcon;
                return (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-800 rounded-lg text-indigo-400 border border-slate-700/60">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">{service.name}</h4>
                        <p className="text-xs text-slate-400">Port: {service.port}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-semibold text-emerald-400">{service.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Global Category Distribution */}
          <ChartCard
            title="Global Product Categories"
            type="doughnut"
            data={categoryData}
            delay={0.5}
          />
        </div>

        {/* Legal Policies & Super Admin Governance Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Policies Tracker */}
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-white">Active Legal Compliance Versions</h2>
              <Link href="/legal" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                Manage Policies &rarr;
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { type: 'privacy_policy', title: 'Privacy Policy', defaultVer: '1.0' },
                { type: 'terms_conditions', title: 'Terms & Conditions', defaultVer: '1.0' },
                { type: 'cancellation_refund', title: 'Cancellation & Refund Policy', defaultVer: '1.0' },
              ].map((item) => {
                const found = policies.find((p) => p.type === item.type);
                const version = found?.current_version || item.defaultVer;
                return (
                  <div
                    key={item.type}
                    className="flex items-center justify-between p-3 sm:p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl gap-2"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-400">Mandatory acceptance at registration</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      v{version}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Super Admin Governance Quick Access */}
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
              Super Admin Governance Matrix
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/categories"
                className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition block"
              >
                <Icons.ComponentInstanceIcon className="h-5 w-5 text-amber-400 mb-2" />
                <h3 className="text-sm font-semibold text-white">Categories ({globalStats.categoriesCount})</h3>
                <p className="text-xs text-slate-400 mt-1">Super admin exclusive taxonomies</p>
              </Link>

              <Link
                href="/admins"
                className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition block"
              >
                <Icons.PersonIcon className="h-5 w-5 text-indigo-400 mb-2" />
                <h3 className="text-sm font-semibold text-white">Admin Staff ({globalStats.adminsCount})</h3>
                <p className="text-xs text-slate-400 mt-1">Manage merchant admin operators</p>
              </Link>

              <Link
                href="/products"
                className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition block"
              >
                <Icons.CubeIcon className="h-5 w-5 text-purple-400 mb-2" />
                <h3 className="text-sm font-semibold text-white">Global Products ({globalStats.totalProducts})</h3>
                <p className="text-xs text-slate-400 mt-1">Audit and govern all products</p>
              </Link>

              <Link
                href="/reports"
                className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition block"
              >
                <Icons.BarChartIcon className="h-5 w-5 text-emerald-400 mb-2" />
                <h3 className="text-sm font-semibold text-white">Financial Ledger</h3>
                <p className="text-xs text-slate-400 mt-1">Markups, margins & merchant payouts</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
