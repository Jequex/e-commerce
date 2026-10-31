'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from '@radix-ui/react-icons';
import { useAuthStore } from '@/stores/use-auth-store';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';

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
  createdAt?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string | number;
}

export default function AdminCouponsPage() {
  const { token } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

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
    fetchCouponsAndProducts();
  }, [token]);

  async function fetchCouponsAndProducts() {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch coupons
      const couponsData = await callApi(`http://${urls.coupons.getAll}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoupons(couponsData.coupons || []);

      // 2. Fetch products
      const prodData = await callApi(`http://${urls.products.getAll}?limit=200`);
      setProducts(prodData.products || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load coupons');
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
    setError('');
    setSuccessMsg('');
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
    setError('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Coupon code is required');
      return;
    }

    if (appliesTo === 'specific_products' && selectedProductIds.length === 0) {
      setError('Please select at least 1 product');
      return;
    }

    setSaving(true);
    setError('');
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

      const endpoint = editingCoupon
        ? `http://${urls.coupons.update.replace(':id', editingCoupon.id)}`
        : `http://${urls.coupons.create}`;
      const method = editingCoupon ? 'PUT' : 'POST';

      await callApi(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setSuccessMsg(editingCoupon ? 'Coupon updated successfully!' : 'Coupon created successfully!');
      setShowModal(false);
      fetchCouponsAndProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await callApi(`http://${urls.coupons.delete.replace(':id', id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setSuccessMsg('Coupon deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  };

  const toggleProductSelection = (pId: string) => {
    if (selectedProductIds.includes(pId)) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== pId));
    } else {
      setSelectedProductIds([...selectedProductIds, pId]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons & Promotions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create promotional discount codes for specific products or all store inventory.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition shadow-sm"
        >
          <Icons.PlusIcon className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
          {successMsg}
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 min-w-[650px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold">Code</th>
                <th className="py-3 px-4 font-semibold">Discount</th>
                <th className="py-3 px-4 font-semibold">Scope</th>
                <th className="py-3 px-4 font-semibold">Usage</th>
                <th className="py-3 px-4 font-semibold">Validity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No promotional coupons found. Click "Create Coupon" to add one.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">{c.code}</div>
                      {c.description && <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {c.discountType === 'percentage'
                          ? `${Number(c.discountValue)}% OFF`
                          : `$${Number(c.discountValue).toFixed(2)} OFF`}
                      </span>
                      {Number(c.minPurchaseAmount) > 0 && (
                        <div className="text-xs text-gray-500">
                          Min: ${Number(c.minPurchaseAmount).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {c.appliesTo === 'all_products' ? (
                        <span className="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded font-medium">
                          All Products
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-medium">
                          {c.productIds?.length || 0} Products
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {c.timesUsed || 0} {c.usageLimit ? `/ ${c.usageLimit}` : 'times'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {c.endDate ? `Ends ${new Date(c.endDate).toLocaleDateString()}` : 'No expiration'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                        c.isActive
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                      }`}>
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition"
                          title="Edit"
                        >
                          <Icons.Pencil1Icon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded transition"
                          title="Delete"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Promotion / Coupon'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icons.Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono uppercase"
                    placeholder="SALE20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Min Purchase ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Max Cap ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono"
                    disabled={discountType === 'fixed_amount'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  placeholder="e.g. 20% discount on summer items"
                />
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Product Scope
                </label>
                <div className="flex gap-4 mb-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={appliesTo === 'all_products'}
                      onChange={() => setAppliesTo('all_products')}
                    />
                    All Products
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={appliesTo === 'specific_products'}
                      onChange={() => setAppliesTo('specific_products')}
                    />
                    Specific Products ({selectedProductIds.length})
                  </label>
                </div>

                {appliesTo === 'specific_products' && (
                  <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                    {products.map((p) => {
                      const isChecked = selectedProductIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center justify-between p-1.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleProductSelection(p.id)}
                            />
                            <span>{p.name}</span>
                          </div>
                          <span className="font-semibold text-blue-600">${Number(p.price).toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs"
                >
                  {saving ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
