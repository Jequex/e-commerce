'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../components/SuperAdminLayout';
import Link from 'next/link';
import * as Icons from '@radix-ui/react-icons';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    productsCount: 0,
    categoriesCount: 0,
    adminsCount: 0,
    legalPoliciesCount: 3,
  });
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [prodRes, catRes, adminRes, legalRes] = await Promise.allSettled([
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/products/categories').then((r) => r.json()),
          fetch('/api/auth/admins').then((r) => r.json()),
          fetch('/api/store/legal').then((r) => r.json()),
        ]);

        const productsCount = prodRes.status === 'fulfilled' ? Number(prodRes.value?.pagination?.total || 0) : 0;
        const categoriesCount = catRes.status === 'fulfilled' ? (catRes.value?.categories?.length || 0) : 0;
        const adminsCount = adminRes.status === 'fulfilled' ? (adminRes.value?.admins?.length || 0) : 0;
        const docs = legalRes.status === 'fulfilled' ? (legalRes.value?.documents || []) : [];

        setStats({
          productsCount,
          categoriesCount,
          adminsCount,
          legalPoliciesCount: docs.length || 3,
        });
        setPolicies(docs);
      } catch (e) {
        console.error('Failed to load dashboard stats', e);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <SuperAdminLayout>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Super Admin Command Center</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">High-privilege platform control: Categories, Products, Admin Staff, Legal Compliance, and Contact Info.</p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Categories</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">Super Admin Exclusive</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-3">{loading ? '...' : stats.categoriesCount}</div>
            <p className="text-xs text-slate-400 mt-1">Active product taxonomies</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Total Products</span>
              <Icons.CubeIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-3">{loading ? '...' : stats.productsCount}</div>
            <p className="text-xs text-slate-400 mt-1">Products across all categories</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Admin Accounts</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">Staff</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-3">{loading ? '...' : stats.adminsCount}</div>
            <p className="text-xs text-slate-400 mt-1">Active platform operators</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Legal Versions</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Tracked</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-3">{loading ? '...' : stats.legalPoliciesCount}</div>
            <p className="text-xs text-slate-400 mt-1">Versioned compliance policies</p>
          </div>
        </div>

        {/* Quick Actions & Policies Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Policies Tracker */}
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-white">Active Legal Versions</h2>
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
                  <div key={item.type} className="flex items-center justify-between p-3 sm:p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl gap-2">
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

          {/* Quick Access Matrix */}
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Super Admin Governance Matrix</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/categories"
                className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition block"
              >
                <Icons.ComponentInstanceIcon className="h-5 w-5 text-amber-400 mb-2" />
                <h3 className="text-sm font-semibold text-white">Manage Categories</h3>
                <p className="text-xs text-slate-400 mt-1">Super admin only permission</p>
              </Link>

              <Link
                href="/admins"
                className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition block"
              >
                <Icons.PersonIcon className="h-5 w-5 text-indigo-400 mb-2" />
                <h3 className="text-sm font-semibold text-white">Manage Admins</h3>
                <p className="text-xs text-slate-400 mt-1">Create and manage admins</p>
              </Link>

              <Link
                href="/products"
                className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition block"
              >
                <Icons.CubeIcon className="h-5 w-5 text-purple-400 mb-2" />
                <h3 className="text-sm font-semibold text-white">Product Catalog</h3>
                <p className="text-xs text-slate-400 mt-1">Create and manage products</p>
              </Link>

              <Link
                href="/settings"
                className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition block"
              >
                <Icons.GearIcon className="h-5 w-5 text-rose-400 mb-2" />
                <h3 className="text-sm font-semibold text-white">Contact & Site CMS</h3>
                <p className="text-xs text-slate-400 mt-1">Configure phone, email, address</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

