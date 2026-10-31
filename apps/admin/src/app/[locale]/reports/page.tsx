'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from '@radix-ui/react-icons';
import { useAuthStore } from '@/stores/use-auth-store';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';

interface StoreSummary {
  storeId: string;
  totalOrders: number;
  totalGrossSales: number;
  totalSubtotal: number;
  totalPlatformFees: number;
  totalStoreDiscounts: number;
  totalJequexSponsoredDiscounts: number;
  netStorePayout: number;
}

interface OrderLedger {
  id: string;
  orderNumber: string;
  createdAt: string;
  subtotalPrice: string | number;
  totalPrice: string | number;
  platformFee: string | number;
  storeDiscount: string | number;
  jequexSponsoredDiscount: string | number;
  netPayout: string | number;
  discounts?: Array<{
    id: string;
    code?: string;
    amount: string | number;
    fundedBy?: string;
    createdByRole?: string;
  }>;
}

export default function StoreReportsPage() {
  const { token } = useAuthStore();
  const [summary, setSummary] = useState<StoreSummary | null>(null);
  const [orders, setOrders] = useState<OrderLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStoreReports();
  }, [token]);

  async function fetchStoreReports() {
    setLoading(true);
    setError('');
    try {
      const data = await callApi(`http://${urls.reports.getStoreReports}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(data.summary);
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load store reports');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Profits & Payout Ledger</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your net earnings, platform fees, and promotional discount cost attributions.
          </p>
        </div>
        <button
          onClick={fetchStoreReports}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition"
        >
          <Icons.ReloadIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Financial Protection Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4 flex items-start gap-3">
        <Icons.InfoCircledIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <p className="font-bold text-gray-900 dark:text-white">Transparent Profit & Discount Attribution:</p>
          <p>
            • <strong>Your Store Promotions</strong>: Discounts you create for your store are deducted from your gross payout.
          </p>
          <p>
            • <strong>Jequex Platform Promotions</strong>: When Jequex Super Admins issue global promotions, Jequex covers 100% of the discount from its own markup. You always receive your full product base payout without any deductions.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Sales</span>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${summary.totalGrossSales.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.totalOrders} total store orders</p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platform Fee (15%)</span>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mt-1">-${summary.totalPlatformFees.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Jequex platform service charge</p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Store Promo Costs</span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">-${summary.totalStoreDiscounts.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Deducted for store-created coupons</p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-green-500/30 rounded-xl p-5 shadow-sm bg-green-50/50 dark:bg-green-950/10">
            <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">Net Store Payout</span>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">${summary.netStorePayout.toFixed(2)}</p>
            <p className="text-xs text-green-600/80 mt-1">Your net earnings to disburse</p>
          </div>
        </div>
      )}

      {/* Jequex Sponsored Free Promotions Highlight */}
      {summary && summary.totalJequexSponsoredDiscounts > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-300">
              <Icons.TokensIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Jequex Platform Sponsored Promotions: ${summary.totalJequexSponsoredDiscounts.toFixed(2)}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                These promotions were funded entirely by Jequex to boost your sales. No deductions were made from your payout.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full text-xs font-bold">
            100% Platform Funded
          </span>
        </div>
      )}

      {/* Orders Financial Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Store Order Transactions</h2>
          <span className="text-xs text-gray-500">{orders.length} Total Orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold">Order #</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Customer Paid</th>
                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Platform Fee</th>
                <th className="py-3 px-4 font-semibold text-amber-600 dark:text-amber-400">Store Promo</th>
                <th className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">Jequex Promo</th>
                <th className="py-3 px-4 font-semibold text-right text-green-700 dark:text-green-400">Net Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Loading store financial records...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No orders recorded for your store yet.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white text-xs">
                      ${Number(ord.totalPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                      -${Number(ord.platformFee || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-amber-600 dark:text-amber-400">
                      {Number(ord.storeDiscount || 0) > 0 ? `-$${Number(ord.storeDiscount).toFixed(2)}` : '$0.00'}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      {Number(ord.jequexSponsoredDiscount || 0) > 0
                        ? `+$${Number(ord.jequexSponsoredDiscount).toFixed(2)} (Covered by Jequex)`
                        : '$0.00'}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono font-bold text-green-700 dark:text-green-400">
                      ${Number(ord.netPayout || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
