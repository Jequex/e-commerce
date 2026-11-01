'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import * as Icons from '@radix-ui/react-icons';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: string | number;
  appliesTo: 'all_products' | 'specific_products';
  productIds?: string[];
  minPurchaseAmount: string | number;
  maxDiscountAmount?: string | number | null;
  usageLimit?: number | null;
  timesUsed?: number;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  storeId?: string | null;
  createdByName?: string | null;
  createdByRole?: string | null;
  createdAt?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string | number;
}

export default function CouponsManagementPage() {
  const { token, user } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'super_admin' | 'merchant_admin'>('super_admin');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [appliesTo, setAppliesTo] = useState<'all_products' | 'specific_products'>('all_products');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchData();
  }, [token]);

  async function fetchData() {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch coupons
      const couponsRes = await fetch('/api/products/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (couponsRes.status === 401) {
        useAuthStore.getState().logout();
        toast.error('Session expired. Please sign in again.');
        window.location.href = '/login';
        return;
      }
      const couponsData = await couponsRes.json();
      setCoupons(couponsData.coupons || []);

      // 2. Fetch products for product selection
      const prodRes = await fetch('/api/products?limit=200');
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);
    } catch (err: any) {
      toast.error('Failed to load promotions & coupons');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('10');
    setAppliesTo('all_products');
    setSelectedProductIds([]);
    setMinPurchaseAmount('0');
    setMaxDiscountAmount('');
    setUsageLimit('');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description || '');
    setDiscountType(c.discountType);
    setDiscountValue(String(c.discountValue));
    setAppliesTo(c.appliesTo);
    setSelectedProductIds(c.productIds || []);
    setMinPurchaseAmount(String(c.minPurchaseAmount || 0));
    setMaxDiscountAmount(c.maxDiscountAmount ? String(c.maxDiscountAmount) : '');
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : '');
    setStartDate(c.startDate ? c.startDate.slice(0, 10) : '');
    setEndDate(c.endDate ? c.endDate.slice(0, 10) : '');
    setIsActive(c.isActive);
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    if (appliesTo === 'specific_products' && selectedProductIds.length === 0) {
      toast.error('Please select at least 1 product for this specific promotion');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        discountType,
        discountValue: parseFloat(discountValue),
        appliesTo,
        productIds: appliesTo === 'specific_products' ? selectedProductIds : [],
        minPurchaseAmount: parseFloat(minPurchaseAmount || '0'),
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        isActive,
      };

      const url = editingCoupon
        ? `/api/products/coupons/${editingCoupon.id}`
        : '/api/products/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save coupon');
      }

      toast.success(editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/products/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete coupon');

      toast.success('Coupon removed successfully');
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const toggleProductSelection = (pId: string) => {
    if (selectedProductIds.includes(pId)) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== pId));
    } else {
      setSelectedProductIds([...selectedProductIds, pId]);
    }
  };

  const superAdminCoupons = coupons.filter(
    (c) => c.createdByRole === 'super_admin' || (!c.storeId && c.createdByRole !== 'admin')
  );
  const merchantAdminCoupons = coupons.filter(
    (c) => c.createdByRole === 'admin' || Boolean(c.storeId)
  );
  const activeCouponsList = activeTab === 'super_admin' ? superAdminCoupons : merchantAdminCoupons;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Coupons & Promotions</h1>
            <p className="text-sm text-slate-400 mt-1">
              Audit and manage platform-wide promotional discounts and individual merchant store codes.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30"
          >
            <Icons.PlusIcon className="w-4 h-4" />
            Create Super Admin Promo
          </button>
        </div>

        {/* 2 Tabs: Super Admin Promos vs Other Admin Promos */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('super_admin')}
            className={`pb-3 px-4 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'super_admin'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icons.ComponentInstanceIcon className="w-4 h-4 text-indigo-400" />
            <span>Super Admin Promos (Platform Funded)</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-950 text-indigo-300 border border-indigo-800">
              {superAdminCoupons.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('merchant_admin')}
            className={`pb-3 px-4 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'merchant_admin'
                ? 'border-amber-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icons.HomeIcon className="w-4 h-4 text-amber-400" />
            <span>Merchant Admin Promos (Store Funded)</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-950 text-amber-300 border border-amber-800">
              {merchantAdminCoupons.length}
            </span>
          </button>
        </div>

        {/* Informational Scope Callout */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
          <Icons.InfoCircledIcon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          {activeTab === 'super_admin' ? (
            <div>
              <strong className="text-white">Platform-Funded Campaigns:</strong> Promos created by Super Admin are applied across eligible platform inventory. In accordance with Jequex financial policies, these discounts are absorbed 100% by Jequex from platform profit markup, leaving merchants' product earnings intact.
            </div>
          ) : (
            <div>
              <strong className="text-white">Store-Funded Promotions:</strong> Promos created by individual merchant administrators. These discount amounts are funded by the store owner and deducted from their weekly payouts, leaving Jequex platform markup preserved.
            </div>
          )}
        </div>

        {/* Coupons List Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 min-w-[700px]">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Code & Details</th>
                  <th className="py-3.5 px-4 font-semibold">Discount</th>
                  <th className="py-3.5 px-4 font-semibold">Applies To</th>
                  <th className="py-3.5 px-4 font-semibold">Creator & Funding</th>
                  <th className="py-3.5 px-4 font-semibold">Usage</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">Loading coupons...</td>
                  </tr>
                ) : activeCouponsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      {activeTab === 'super_admin'
                        ? 'No Super Admin coupons created yet. Click "Create Super Admin Promo" above.'
                        : 'No merchant admin coupons found across stores.'}
                    </td>
                  </tr>
                ) : (
                  activeCouponsList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-amber-400 text-base">{c.code}</div>
                        {c.description && <div className="text-xs text-slate-400 mt-0.5">{c.description}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-base">
                          {c.discountType === 'percentage'
                            ? `${Number(c.discountValue)}% OFF`
                            : `$${Number(c.discountValue).toFixed(2)} OFF`}
                        </span>
                        {c.maxDiscountAmount && (
                          <div className="text-[11px] text-slate-400">
                            Max: ${Number(c.maxDiscountAmount).toFixed(2)}
                          </div>
                        )}
                        {Number(c.minPurchaseAmount) > 0 && (
                          <div className="text-[11px] text-slate-400">
                            Min. order: ${Number(c.minPurchaseAmount).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.appliesTo === 'all_products' ? (
                          <span className="inline-block px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs">
                            All Products
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded text-xs">
                            {c.productIds?.length || 0} Specific Products
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {activeTab === 'super_admin' ? (
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded text-[11px] font-semibold">
                              Platform (Jequex)
                            </span>
                            <div className="text-slate-500 mt-0.5 text-[11px]">
                              {c.createdByName || 'Super Admin'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded text-[11px] font-semibold">
                              Store Merchant
                            </span>
                            <div className="text-slate-400 mt-0.5 text-[11px]">
                              {c.createdByName || 'Merchant'}
                            </div>
                            {c.storeId && (
                              <div className="text-slate-500 font-mono text-[10px] truncate max-w-[140px]">
                                Store: {c.storeId.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div>{c.timesUsed || 0} {c.usageLimit ? `/ ${c.usageLimit} max` : 'used'}</div>
                        {c.endDate && (
                          <div className="text-[11px] text-slate-500">
                            Expires {new Date(c.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${
                          c.isActive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {c.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-600/20 rounded-lg transition"
                            title="Edit Coupon"
                          >
                            <Icons.Pencil1Icon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600/20 rounded-lg transition"
                            title="Delete Coupon"
                          >
                            <Icons.TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg text-white">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotion / Coupon'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase text-sm"
                      placeholder="e.g. FLASH25"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Discount Type
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="fixed_amount">Fixed Amount Discount ($)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm"
                      placeholder={discountType === 'percentage' ? '20' : '15.00'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Min. Purchase ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={minPurchaseAmount}
                      onChange={(e) => setMinPurchaseAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Max Discount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm"
                      placeholder="Optional cap"
                      disabled={discountType === 'fixed_amount'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Description / Note
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="e.g. 25% off holiday special for all gadgets"
                  />
                </div>

                {/* Target Products */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Applies To Products
                  </label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={appliesTo === 'all_products'}
                        onChange={() => setAppliesTo('all_products')}
                        className="text-indigo-600"
                      />
                      All Store Products
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={appliesTo === 'specific_products'}
                        onChange={() => setAppliesTo('specific_products')}
                        className="text-indigo-600"
                      />
                      Specific Products Only ({selectedProductIds.length} selected)
                    </label>
                  </div>

                  {appliesTo === 'specific_products' && (
                    <div className="border border-slate-700 bg-slate-800/60 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
                      {products.length === 0 ? (
                        <p className="text-xs text-slate-500">No products available</p>
                      ) : (
                        products.map((p) => {
                          const isChecked = selectedProductIds.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                                isChecked ? 'bg-indigo-600/20 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleProductSelection(p.id)}
                                  className="rounded text-indigo-600"
                                />
                                <span className="font-medium">{p.name}</span>
                                <span className="text-slate-500 font-mono text-[11px]">SKU: {p.sku}</span>
                              </div>
                              <span className="font-bold text-amber-400">${Number(p.price).toFixed(2)}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm"
                      placeholder="e.g. 50 (blank = unlimited)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <label htmlFor="isActiveToggle" className="text-xs text-slate-300 cursor-pointer font-medium">
                    Coupon is active and redeemable immediately
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                  >
                    {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

