'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import * as Icons from '@radix-ui/react-icons';
import toast from 'react-hot-toast';

interface PlatformSummary {
  totalOrders: number;
  totalGrossSales: number;
  totalSubtotal: number;
  totalPlatformMarkup: number;
  superAdminDiscountsFunded: number;
  adminDiscountsFunded: number;
  netPlatformProfit: number;
  totalStorePayouts: number;
  platformMarginRate: string;
}

interface StoreBreakdown {
  storeId: string;
  ordersCount: number;
  grossSales: number;
  platformMarkup: number;
  superAdminDiscounts: number;
  adminDiscounts: number;
  netPlatformProfit: number;
  netStorePayout: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  subtotalPrice: string | number;
  totalPrice: string | number;
  platformMarkupAmount?: string | number;
  superAdminDiscountAmount?: string | number;
  adminDiscountAmount?: string | number;
  platformNetProfit?: string | number;
  storeNetPayout?: string | number;
  discounts?: Array<{
    id: string;
    code?: string;
    amount: string | number;
    fundedBy?: string;
    createdByRole?: string;
  }>;
}

export default function PlatformReportsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [storeBreakdowns, setStoreBreakdowns] = useState<StoreBreakdown[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, [token]);

  async function fetchReports() {
    if (!token) return;
    setLoading(true);
    try {
      let url = '/api/orders/admin/platform-reports';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load platform reports');

      setSummary(data.summary);
      setStoreBreakdowns(data.storeBreakdowns || []);
      setRecentOrders(data.recentOrders || []);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching reports');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Jequex Platform Profit & Financial Ledger</h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time audit of platform markups, discount cost allocations, and merchant net payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400">Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none"
              />
              <span className="text-xs text-slate-600">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none"
              />
            </div>
            <button
              onClick={fetchReports}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
            >
              <Icons.ReloadIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Filter
            </button>
          </div>
        </div>

        {/* Financial Accounting Rules Notice */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 flex items-start gap-3.5">
          <Icons.LockClosedIcon className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-bold text-white">Discounts Cost Attribution Policy:</p>
            <p>
              • <strong>Super Admin Promos (Jequex Funded)</strong>: Promotional discounts created by Super Admin are absorbed 100% by Jequex and deducted from platform markup. Merchants receive their full product base revenue without penalty.
            </p>
            <p>
              • <strong>Admin / Store Promos (Merchant Funded)</strong>: Discounts created by individual merchants are deducted directly from the store's payout. Jequex's platform markup remains fully protected.
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Platform Sales</span>
              <p className="text-2xl font-bold text-white mt-1">${summary.totalGrossSales.toFixed(2)}</p>
              <p className="text-[11px] text-slate-500 mt-1">{summary.totalOrders} total completed orders</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Platform Markup</span>
              <p className="text-2xl font-bold text-indigo-400 mt-1">${summary.totalPlatformMarkup.toFixed(2)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Platform commission rate earned</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Jequex-Funded Discounts</span>
              <p className="text-2xl font-bold text-rose-400 mt-1">-${summary.superAdminDiscountsFunded.toFixed(2)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Absorbed from Jequex markup</p>
            </div>

            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg bg-emerald-950/10">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Net Jequex Platform Profit</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">${summary.netPlatformProfit.toFixed(2)}</p>
              <p className="text-[11px] text-emerald-500/80 mt-1">Net profit after absorbed discounts</p>
            </div>
          </div>
        )}

        {/* Discount Reconciliation Breakdown */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                <Icons.LayersIcon className="w-4 h-4 text-indigo-400" />
                Discount Funding Reconciliation
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Customer Discounts Given:</span>
                  <span className="font-bold text-white">
                    ${(summary.superAdminDiscountsFunded + summary.adminDiscountsFunded).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-rose-400">• Absorbed by Jequex (Platform Promos):</span>
                  <span className="font-bold text-rose-400">-${summary.superAdminDiscountsFunded.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-amber-400">• Absorbed by Stores (Merchant Promos):</span>
                  <span className="font-bold text-amber-400">-${summary.adminDiscountsFunded.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-slate-400">
                  <span>Merchant Net Payouts Disbursed:</span>
                  <span className="font-bold text-indigo-300">${summary.totalStorePayouts.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                <Icons.ActivityLogIcon className="w-4 h-4 text-emerald-400" />
                Profitability Health & Ratio
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Net Platform Profit Margin:</span>
                  <span className="font-bold text-emerald-400">{summary.platformMarginRate}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Merchant Payout Share:</span>
                  <span className="font-bold text-white">
                    {summary.totalSubtotal > 0
                      ? ((summary.totalStorePayouts / summary.totalSubtotal) * 100).toFixed(2) + '%'
                      : '0.00%'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Discounts-to-Sales Ratio:</span>
                  <span className="font-bold text-slate-300">
                    {summary.totalSubtotal > 0
                      ? (((summary.superAdminDiscountsFunded + summary.adminDiscountsFunded) / summary.totalSubtotal) * 100).toFixed(2) + '%'
                      : '0.00%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Store-by-Store Profit Breakdown */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Merchant Stores Financial Ledger</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Store / Merchant ID</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Orders</th>
                  <th className="py-3.5 px-4 font-semibold">Gross Sales</th>
                  <th className="py-3.5 px-4 font-semibold">Platform Markup (Gross)</th>
                  <th className="py-3.5 px-4 font-semibold text-rose-400">Jequex Promo Cost</th>
                  <th className="py-3.5 px-4 font-semibold text-amber-400">Store Promo Cost</th>
                  <th className="py-3.5 px-4 font-semibold text-emerald-400">Jequex Net Profit</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Store Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">Loading ledger...</td>
                  </tr>
                ) : storeBreakdowns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      No merchant sales recorded in this period.
                    </td>
                  </tr>
                ) : (
                  storeBreakdowns.map((sb) => (
                    <tr key={sb.storeId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-white text-xs">
                        {sb.storeId}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {sb.ordersCount}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        ${sb.grossSales.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-indigo-300">
                        ${sb.platformMarkup.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-400">
                        -${sb.superAdminDiscounts.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">
                        -${sb.adminDiscounts.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        ${sb.netPlatformProfit.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-300">
                        ${sb.netStorePayout.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section: Recent Orders Financial Audit */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Recent Transactions Audit</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Order #</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Subtotal</th>
                  <th className="py-3.5 px-4 font-semibold">Total Paid</th>
                  <th className="py-3.5 px-4 font-semibold text-indigo-400">Platform Markup</th>
                  <th className="py-3.5 px-4 font-semibold text-rose-400">Jequex Discount</th>
                  <th className="py-3.5 px-4 font-semibold text-amber-400">Store Discount</th>
                  <th className="py-3.5 px-4 font-semibold text-emerald-400">Jequex Profit</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Store Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">Loading transactions...</td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-500">
                      No order transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        ${Number(ord.subtotalPrice || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono font-bold text-white">
                        ${Number(ord.totalPrice || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-indigo-400">
                        ${Number(ord.platformMarkupAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-rose-400">
                        {Number(ord.superAdminDiscountAmount || 0) > 0
                          ? `-$${Number(ord.superAdminDiscountAmount).toFixed(2)}`
                          : '$0.00'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-amber-400">
                        {Number(ord.adminDiscountAmount || 0) > 0
                          ? `-$${Number(ord.adminDiscountAmount).toFixed(2)}`
                          : '$0.00'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono font-bold text-emerald-400">
                        ${Number(ord.platformNetProfit || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono font-bold text-indigo-300">
                        ${Number(ord.storeNetPayout || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

