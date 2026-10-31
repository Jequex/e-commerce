'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import * as Icons from '@radix-ui/react-icons';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  defaultMarkupPercentage: string | number;
  sortOrder?: number;
  isActive?: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AdminMarkup {
  id: string;
  adminId: string;
  adminName?: string;
  adminEmail?: string;
  categoryId: string;
  markupPercentage: string | number;
  createdAt?: string;
  updatedAt?: string;
}

export default function MarkupsManagementPage() {
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [adminMarkups, setAdminMarkups] = useState<AdminMarkup[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Category inline edits: { [categoryId]: markupPercentage }
  const [categoryEdits, setCategoryEdits] = useState<Record<string, string>>({});
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  // New admin override modal / form
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [editingOverride, setEditingOverride] = useState<AdminMarkup | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [overridePercentage, setOverridePercentage] = useState('10.00');
  const [savingOverride, setSavingOverride] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  async function fetchData() {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch categories and existing markups from product service
      const markupsRes = await fetch('/api/products/markups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const markupsData = await markupsRes.json();
      const cats: Category[] = markupsData.categories || [];
      setCategories(cats);
      setAdminMarkups(markupsData.adminMarkups || []);

      const initEdits: Record<string, string> = {};
      cats.forEach((c) => {
        initEdits[c.id] = String(c.defaultMarkupPercentage || '0.00');
      });
      setCategoryEdits(initEdits);

      // 2. Fetch admins list from auth service
      const adminsRes = await fetch('/api/auth/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adminsData = await adminsRes.json();
      const adminList: AdminUser[] = adminsData.admins || [];
      setAdmins(adminList);
      if (adminList.length > 0 && !selectedAdminId) {
        setSelectedAdminId(adminList[0].id);
      }
      if (cats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(cats[0].id);
      }
    } catch (err: any) {
      toast.error('Failed to load markup policies');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateCategoryDefault = async (catId: string) => {
    const val = categoryEdits[catId];
    if (val === undefined || isNaN(Number(val))) {
      toast.error('Please enter a valid markup percentage');
      return;
    }

    setSavingCategory(catId);
    try {
      const res = await fetch(`/api/products/markups/category/${catId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ defaultMarkupPercentage: parseFloat(val) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update markup');
      }

      toast.success('Category default profit markup updated');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSavingCategory(null);
    }
  };

  const handleSaveAdminOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminId || !selectedCategoryId) {
      toast.error('Admin and Category must be selected');
      return;
    }

    setSavingOverride(true);
    try {
      const selectedAdmin = admins.find((a) => a.id === selectedAdminId);
      const adminName = selectedAdmin ? `${selectedAdmin.firstName || ''} ${selectedAdmin.lastName || ''}`.trim() : '';
      const adminEmail = selectedAdmin?.email || '';

      const url = editingOverride
        ? `/api/products/markups/admin/${editingOverride.id}`
        : '/api/products/markups/admin';
      const method = editingOverride ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminId: selectedAdminId,
          adminName: adminName || (editingOverride?.adminName ?? ''),
          adminEmail: adminEmail || (editingOverride?.adminEmail ?? ''),
          categoryId: selectedCategoryId,
          markupPercentage: parseFloat(overridePercentage),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save admin markup override');
      }

      toast.success(editingOverride ? 'Profit markup override updated successfully' : 'Individual admin markup override configured');
      setShowOverrideModal(false);
      setEditingOverride(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteAdminOverride = async (id: string) => {
    if (!confirm('Are you sure you want to remove this individual markup override?')) return;

    try {
      const res = await fetch(`/api/products/markups/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete override');

      toast.success('Override removed successfully');
      setAdminMarkups((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Profit Markup Policies</h1>
            <p className="text-sm text-slate-400 mt-1">
              Configure default profit markups per category and individual markup overrides for specific merchants or admins.
            </p>
          </div>
          <button
            onClick={() => setShowOverrideModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
          >
            <Icons.PlusIcon className="w-4 h-4" />
            Set Admin Override
          </button>
        </div>

        {/* Info card */}
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-300">
          <Icons.InfoCircledIcon className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold text-amber-200">How Profit Markups Work:</span> Every product price calculation begins with the base cost. When selling in a category, the platform applies the <strong>Default Category Markup %</strong>. If an individual administrator has an assigned <strong>Admin Override %</strong> for that category, their custom markup takes precedence.
          </div>
        </div>

        {/* Section 1: Default Category Markups */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Category Default Profit Markups</h2>
            <span className="text-xs text-slate-400">{categories.length} Total Categories</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Category Name</th>
                  <th className="py-3.5 px-4 font-semibold">Slug</th>
                  <th className="py-3.5 px-4 font-semibold">Default Markup %</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">Loading categories...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">No categories found.</td>
                  </tr>
                ) : (
                  categories.map((c) => {
                    const isSaving = savingCategory === c.id;
                    const val = categoryEdits[c.id] ?? String(c.defaultMarkupPercentage || '0.00');
                    const hasChanged = Number(val) !== Number(c.defaultMarkupPercentage || 0);

                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {c.name}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                          {c.slug}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 max-w-[140px]">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1000"
                              value={val}
                              onChange={(e) => setCategoryEdits({ ...categoryEdits, [c.id]: e.target.value })}
                              className="w-24 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm text-right focus:border-amber-500 focus:outline-none"
                            />
                            <span className="text-slate-400 font-bold">%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleUpdateCategoryDefault(c.id)}
                            disabled={isSaving || !hasChanged}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              hasChanged
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {isSaving ? 'Saving...' : 'Save Default'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Individual Admin Overrides */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Individual Admin Markup Overrides</h2>
              <p className="text-xs text-slate-400">
                Custom markup rates tailored for specific merchants and administrators.
              </p>
            </div>
            <button
              onClick={() => setShowOverrideModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
            >
              + Add Override
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Admin / Merchant</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Override Markup %</th>
                  <th className="py-3.5 px-4 font-semibold">Last Updated</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">Loading overrides...</td>
                  </tr>
                ) : adminMarkups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No admin-specific overrides set. All admins currently use the category default profit markup.
                    </td>
                  </tr>
                ) : (
                  adminMarkups.map((m) => {
                    const cat = categories.find((c) => c.id === m.categoryId);
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{m.adminName || 'Admin'}</div>
                          <div className="text-xs text-slate-400 font-mono">{m.adminEmail || m.adminId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-200 font-medium">
                            {cat ? cat.name : m.categoryId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-sm">
                          {Number(m.markupPercentage).toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingOverride(m);
                                setSelectedAdminId(m.adminId);
                                setSelectedCategoryId(m.categoryId);
                                setOverridePercentage(String(m.markupPercentage));
                                setShowOverrideModal(true);
                              }}
                              className="p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition"
                              title="Edit / Update Override"
                            >
                              <Icons.Pencil1Icon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdminOverride(m.id)}
                              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition"
                              title="Delete Override"
                            >
                              <Icons.TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Set Override Modal */}
        {showOverrideModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-bold text-lg text-white">
                  {editingOverride ? 'Update Profit Markup Override' : 'Set Admin Category Markup Override'}
                </h3>
                <button
                  onClick={() => {
                    setShowOverrideModal(false);
                    setEditingOverride(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAdminOverride} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Select Administrator / Merchant
                  </label>
                  <select
                    value={selectedAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    required
                  >
                    {admins.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.firstName || a.lastName ? `${a.firstName || ''} ${a.lastName || ''} (${a.email})` : a.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Select Category
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Default: {Number(c.defaultMarkupPercentage || 0).toFixed(2)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Custom Markup Override Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    required
                    value={overridePercentage}
                    onChange={(e) => setOverridePercentage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm"
                    placeholder="15.00"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This markup will apply exclusively to this admin for products under this category.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOverrideModal(false);
                      setEditingOverride(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingOverride}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50"
                  >
                    {savingOverride ? 'Saving...' : editingOverride ? 'Update Override' : 'Save Override'}
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

