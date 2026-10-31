'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from '@radix-ui/react-icons';
import { useAuthStore } from '@/stores/use-auth-store';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';

interface Bank {
  name: string;
  code: string;
}

interface BankDetails {
  id?: string;
  storeId?: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  paystackRecipientCode?: string;
  isVerified?: boolean;
}

interface PayoutRecord {
  id: string;
  amount: string;
  currency: string;
  paystackReference: string;
  paystackTransferCode?: string;
  status: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
}

interface StoreItem {
  id: string;
  name: string;
}

export default function StorePayoutsPage() {
  const { token } = useAuthStore();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [banks, setBanks] = useState<Bank[]>([]);
  
  // Bank Form State
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedStatus, setResolvedStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Overview Data
  const [currentBankSettings, setCurrentBankSettings] = useState<BankDetails | null>(null);
  const [pendingBalance, setPendingBalance] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [nextPayoutDate, setNextPayoutDate] = useState<string>('');
  const [recentPayouts, setRecentPayouts] = useState<PayoutRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Initial load: stores and bank list
  useEffect(() => {
    fetchStores();
    fetchBankList();
  }, [token]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchPayoutOverview(selectedStoreId);
    }
  }, [selectedStoreId]);

  async function fetchStores() {
    try {
      const data = await callApi(`http://${urls.store.getUserStores}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const storeList = Array.isArray(data) ? data : data?.data || [];
      setStores(storeList);
      if (storeList.length > 0 && !selectedStoreId) {
        setSelectedStoreId(storeList[0].id);
      }
    } catch (err: any) {
      console.warn('Failed to load stores:', err);
    }
  }

  async function fetchBankList() {
    try {
      const res = await fetch(`http://${urls.payouts.getBanks}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBanks(data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load bank list:', err);
    }
  }

  async function fetchPayoutOverview(storeId: string) {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`http://${urls.payouts.getOverview}?storeId=${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setCurrentBankSettings(d.bankSettings);
        setPendingBalance(d.pendingBalance || 0);
        setPendingOrdersCount(d.pendingOrdersCount || 0);
        setPendingOrders(d.pendingOrders || []);
        setNextPayoutDate(d.nextPayoutDate || '');
        setRecentPayouts(d.recentPayouts || []);

        if (d.bankSettings) {
          setBankCode(d.bankSettings.bankCode || '');
          setBankName(d.bankSettings.bankName || '');
          setAccountNumber(d.bankSettings.accountNumber || '');
          setAccountName(d.bankSettings.accountName || '');
          setResolvedStatus(d.bankSettings.accountName ? 'verified' : null);
        } else {
          setBankCode('');
          setBankName('');
          setAccountNumber('');
          setAccountName('');
          setResolvedStatus(null);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load payout overview');
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveAccount() {
    if (!bankCode || accountNumber.length !== 10) {
      setErrorMessage('Please select a bank and enter a valid 10-digit account number');
      return;
    }

    setIsResolving(true);
    setErrorMessage('');
    setResolvedStatus(null);

    try {
      const res = await fetch(
        `http://${urls.payouts.resolveAccount}?accountNumber=${accountNumber}&bankCode=${bankCode}`
      );
      const data = await res.json();
      if (data.success && data.data?.account_name) {
        setAccountName(data.data.account_name);
        setResolvedStatus('verified');
      } else {
        throw new Error(data.error || 'Could not verify account name');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Account resolution failed');
      setResolvedStatus('failed');
    } finally {
      setIsResolving(false);
    }
  }

  async function handleSaveBankDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStoreId) {
      setErrorMessage('Please select a store first');
      return;
    }
    if (!bankCode || !bankName || !accountNumber || !accountName) {
      setErrorMessage('Please complete all bank details');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`http://${urls.payouts.saveBankDetails}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeId: selectedStoreId,
          bankCode,
          bankName,
          accountNumber,
          accountName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Preferred bank details verified and registered with Paystack successfully!');
        fetchPayoutOverview(selectedStoreId);
      } else {
        throw new Error(data.error || 'Failed to save bank details');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save bank details');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icons.LayersIcon className="w-6 h-6 text-indigo-600" />
            Automatic Weekly Payouts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Jequex receives customer payments via Paystack. You fulfill the orders, and Jequex automatically transfers your net revenue to your bank account every Monday.
          </p>
        </div>

        {/* Store Selector */}
        {stores.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Store:</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Workflow Explanation Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/60 border border-blue-200 dark:border-gray-700 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400 mt-0.5">
            <Icons.InfoCircledIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              How Weekly Monday Payouts Work
            </div>
            <p className="text-xs text-blue-700 dark:text-gray-300 mt-0.5">
              1. <strong>Customer Checkout:</strong> Paid directly to Jequex via Paystack.<br />
              2. <strong>Store Fulfillment:</strong> Admin marks order fulfilled / shipped.<br />
              3. <strong>Automatic Disbursement:</strong> Every Monday at 09:00 UTC, Jequex transfers all fulfilled order earnings directly to your verified bank account.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300">
          <Icons.CheckCircledIcon className="w-4 h-4 text-emerald-500" />
          <span>Paystack Payout Rail: <strong>Active</strong></span>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>
            <Icons.Cross2Icon className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')}>
            <Icons.Cross2Icon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Pending Payout Balance */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase">Upcoming Payout</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
              <Icons.TokensIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            ₦{pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {pendingOrdersCount} fulfilled order{pendingOrdersCount === 1 ? '' : 's'} queued
          </div>
        </div>

        {/* Next Scheduled Payout */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase">Disbursement Date</span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
              <Icons.CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-2">
            {nextPayoutDate ? new Date(nextPayoutDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Next Monday'}
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
            Weekly Monday Automated Run
          </div>
        </div>

        {/* Bank Account Verification Status */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase">Bank Status</span>
            <div className={`p-2 rounded-lg ${currentBankSettings?.isVerified ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
              <Icons.CheckCircledIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-2">
            {currentBankSettings?.isVerified ? 'Verified & Active' : 'Setup Required'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentBankSettings?.bankName ? `${currentBankSettings.bankName} (••••${currentBankSettings.accountNumber.slice(-4)})` : 'No bank configured'}
          </div>
        </div>

        {/* Payout Rail Provider */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase">Payout Gateway</span>
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-lg">
              <Icons.LockClosedIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-2">
            Paystack Transfers
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Recipient: {currentBankSettings?.paystackRecipientCode ? 'Registered' : 'Pending save'}
          </div>
        </div>
      </div>

      {/* Main Grid: Bank Details Setup & Current Cycle Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preferred Bank Details Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Icons.GearIcon className="w-5 h-5 text-indigo-600" />
            Payout Bank Details
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Enter your Nigerian commercial or microfinance bank details. We verify your account in real-time via Paystack NUBAN resolution.
          </p>

          <form onSubmit={handleSaveBankDetails} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Select Bank
              </label>
              <select
                value={bankCode}
                onChange={(e) => {
                  setBankCode(e.target.value);
                  const selected = banks.find((b) => b.code === e.target.value);
                  if (selected) setBankName(selected.name);
                  setResolvedStatus(null);
                }}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">-- Choose your bank --</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                10-Digit Account Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setAccountNumber(val);
                    setResolvedStatus(null);
                  }}
                  placeholder="0123456789"
                  className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={handleResolveAccount}
                  disabled={isResolving || !bankCode || accountNumber.length !== 10}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-lg disabled:opacity-50"
                >
                  {isResolving ? 'Checking...' : 'Verify'}
                </button>
              </div>
            </div>

            {/* Resolved Account Name */}
            {accountName && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <span className="text-xs text-gray-500 uppercase block font-semibold">Account Holder Name:</span>
                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{accountName}</span>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                  <Icons.CheckCircledIcon className="w-3.5 h-3.5" />
                  Verified via Paystack NUBAN
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || !bankCode || accountNumber.length !== 10 || !accountName}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm disabled:opacity-50 transition"
            >
              {isSaving ? 'Registering with Paystack...' : 'Save Bank Details'}
            </button>
          </form>
        </div>

        {/* Current Cycle: Fulfilled Orders Ready for Payout */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Icons.ClockIcon className="w-5 h-5 text-indigo-600" />
                Current Payout Cycle Orders
              </h2>
              <p className="text-xs text-gray-500">
                Orders fulfilled by your store scheduled for payment this Monday.
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full">
              {pendingOrders.length} Ready
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-3 text-right">Markup (Jequex)</th>
                  <th className="py-2.5 px-3 text-right">Store Discount</th>
                  <th className="py-2.5 px-3 text-right font-bold text-emerald-600">Net Payout</th>
                  <th className="py-2.5 px-3 text-center">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pendingOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No fulfilled orders pending payout for this cycle. Once you fulfill customer orders, they will queue here.
                    </td>
                  </tr>
                ) : (
                  pendingOrders.map((ord: any) => {
                    const subtotal = Number(ord.subtotal_price || 0);
                    const markup = Number(ord.platform_markup_amount || 0);
                    const discount = Number(ord.admin_discount_amount || 0);
                    const net = Number(ord.store_net_payout !== null ? ord.store_net_payout : (subtotal - markup - discount));

                    return (
                      <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                          {ord.order_number}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-700 dark:text-gray-300">
                          ₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-500">
                          -₦{markup.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-500">
                          -₦{discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ₦{net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            {ord.fulfillment_status || 'fulfilled'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <Icons.CounterClockwiseClockIcon className="w-5 h-5 text-indigo-600" />
          Weekly Payout History
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Record of all past automatic Monday transfers sent to your bank account via Paystack.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-4">Payout Date</th>
                <th className="py-3 px-4">Paystack Reference</th>
                <th className="py-3 px-4">Destination Bank</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4 text-right">Amount Disbursed</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentPayouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No payouts processed yet. Your first weekly payout will execute this coming Monday.
                  </td>
                </tr>
              ) : (
                recentPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                      {new Date(p.createdAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                      {p.paystackReference}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {p.bankName}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400">
                      ••••{p.accountNumber?.slice(-4)} ({p.accountName})
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ₦{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === 'successful'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.status === 'processing'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {p.status}
                      </span>
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

