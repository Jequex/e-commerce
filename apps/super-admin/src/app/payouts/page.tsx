'use client';

import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import * as Icons from '@radix-ui/react-icons';
import { useAuthStore } from '../../stores/useAuthStore';

interface PayoutBatch {
  id: string;
  batchNumber: string;
  scheduledDate: string;
  status: string;
  totalPayoutAmount: string;
  totalStoresCount: number;
  processedAt?: string;
  createdAt: string;
}

interface StorePayout {
  id: string;
  batchId: string;
  storeId: string;
  adminId?: string;
  amount: string;
  currency: string;
  paystackTransferCode?: string;
  paystackReference: string;
  status: string;
  failureReason?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt: string;
}

interface PendingLiabilities {
  totalPendingAmount: number;
  pendingStoresCount: number;
}

export default function SuperAdminPayoutsPage() {
  const { token } = useAuthStore();
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [payouts, setPayouts] = useState<StorePayout[]>([]);
  const [pendingLiabilities, setPendingLiabilities] = useState<PendingLiabilities>({
    totalPendingAmount: 0,
    pendingStoresCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchPayoutBatches();
  }, [token]);

  async function fetchPayoutBatches() {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/payouts/batches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setBatches(json.data.batches || []);
        setPayouts(json.data.payouts || []);
        if (json.data.pendingLiabilities) {
          setPendingLiabilities(json.data.pendingLiabilities);
        }
      }
    } catch (err: any) {
      console.error('Error fetching payout batches:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTriggerWeeklyRun() {
    if (!confirm('Are you sure you want to execute the weekly payout run right now? This will initiate Paystack bank transfers for all fulfilled unpaid orders across all stores.')) {
      return;
    }

    setIsTriggering(true);
    setNotification(null);

    try {
      const res = await fetch('/api/payments/payouts/process-weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: data.message || 'Weekly payout run executed successfully!',
        });
        fetchPayoutBatches();
      } else {
        throw new Error(data.error || 'Failed to execute weekly payout');
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to process weekly payout run',
      });
    } finally {
      setIsTriggering(false);
    }
  }

  // Calculate cumulative disbursed amount
  const totalDisbursedAllTime = batches.reduce(
    (sum, b) => sum + Number(b.totalPayoutAmount || 0),
    0
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Icons.LayersIcon className="w-7 h-7 text-indigo-400" />
              Automatic Weekly Payouts Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Jequex collects payments from customers via Paystack upon checkout. Admin stores fulfill the orders, and Jequex automatically transfers weekly net earnings to merchants every Monday at 09:00 UTC.
            </p>
          </div>

          <button
            onClick={handleTriggerWeeklyRun}
            disabled={isTriggering}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-900/30 transition disabled:opacity-50"
          >
            <Icons.PlayIcon className="w-4 h-4" />
            {isTriggering ? 'Executing Payout Transfers...' : 'Run Weekly Payout Batch Now'}
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <Icons.CheckCircledIcon className="w-5 h-5 text-emerald-400" />
              ) : (
                <Icons.ExclamationTriangleIcon className="w-5 h-5 text-rose-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
              <Icons.Cross2Icon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Store Liabilities */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pending Liabilities
              </span>
              <div className="p-2 bg-amber-950/40 text-amber-400 rounded-lg border border-amber-800/40">
                <Icons.ClockIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-3">
              ₦{pendingLiabilities.totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Across {pendingLiabilities.pendingStoresCount} fulfilled merchant store{pendingLiabilities.pendingStoresCount === 1 ? '' : 's'}
            </p>
          </div>

          {/* Cumulative Disbursed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Disbursed (All Time)
              </span>
              <div className="p-2 bg-emerald-950/40 text-emerald-400 rounded-lg border border-emerald-800/40">
                <Icons.TokensIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-3">
              ₦{totalDisbursedAllTime.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Through {batches.length} weekly Monday batch runs
            </p>
          </div>

          {/* Schedule Engine */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Payout Engine Schedule
              </span>
              <div className="p-2 bg-indigo-950/40 text-indigo-400 rounded-lg border border-indigo-800/40">
                <Icons.CalendarIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-white mt-3">
              Mondays @ 09:00 UTC
            </div>
            <p className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Automatic Daemon Active
            </p>
          </div>

          {/* Payment Gateway */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Payout Gateway
              </span>
              <div className="p-2 bg-cyan-950/40 text-cyan-400 rounded-lg border border-cyan-800/40">
                <Icons.LockClosedIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-white mt-3">
              Paystack Transfers
            </div>
            <p className="text-xs text-slate-400 mt-1">
              NGN NUBAN Direct Deposit
            </p>
          </div>
        </div>

        {/* Weekly Batches Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Icons.ArchiveIcon className="w-5 h-5 text-indigo-400" />
                Weekly Payout Batches
              </h2>
              <p className="text-xs text-slate-400">
                Summary of all Monday payout processing runs.
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
              {batches.length} Batches
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4 text-center">Stores Paid</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Processed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No payout batches processed yet. Click &quot;Run Weekly Payout Batch Now&quot; to execute the first run.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-300">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(b.scheduledDate).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-200 font-semibold">
                        {b.totalStoresCount}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                        ₦{Number(b.totalPayoutAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            b.status === 'completed'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : b.status === 'processing'
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {b.processedAt ? new Date(b.processedAt).toLocaleString() : 'Pending'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Individual Store Transfers Log */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Icons.ListBulletIcon className="w-5 h-5 text-indigo-400" />
              Store Payouts Log
            </h2>
            <p className="text-xs text-slate-400">
              Granular record of each merchant store transfer, destination bank details, and Paystack transfer status.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Store ID</th>
                  <th className="py-3 px-4">Destination Bank</th>
                  <th className="py-3 px-4">Account Holder</th>
                  <th className="py-3 px-4">Paystack Ref</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      No individual store payouts recorded yet.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {p.storeId ? p.storeId.slice(0, 8) + '...' : 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {p.bankName || 'N/A'}
                        {p.accountNumber ? ` (••••${p.accountNumber.slice(-4)})` : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {p.accountName || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-indigo-300">
                        {p.paystackReference}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        ₦{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.status === 'successful'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.failureReason && (
                          <div className="text-[10px] text-rose-400 mt-0.5 max-w-xs truncate" title={p.failureReason}>
                            {p.failureReason}
                          </div>
                        )}
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

