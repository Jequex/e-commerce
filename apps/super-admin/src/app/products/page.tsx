'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import toast from 'react-hot-toast';
import * as Icons from '@radix-ui/react-icons';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  inventoryQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  category?: { name: string };
  createdAt: string;
}

export default function ProductsManagementPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    inventoryQuantity: 50,
    categoryId: '',
    description: '',
    isActive: true,
    isFeatured: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products?limit=50').then((r) => r.json()),
        fetch('/api/products/categories').then((r) => r.json()),
      ]);

      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
    } catch (e: any) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku || `SKU-${Date.now().toString().slice(-6)}`,
        price: parseFloat(formData.price) || 0,
        inventoryQuantity: Number(formData.inventoryQuantity) || 0,
        categoryId: formData.categoryId || null,
        description: formData.description,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      toast.success('Product created successfully');
      setShowModal(false);
      setFormData({
        name: '',
        sku: '',
        price: '',
        inventoryQuantity: 50,
        categoryId: '',
        description: '',
        isActive: true,
        isFeatured: false,
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Product creation failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Product Catalog Management</h1>
            <p className="text-sm text-slate-400 mt-1">
              Create, update, and manage global merchandise and inventory listings.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            <Icons.PlusIcon className="w-4 h-4" />
            Add New Product
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No products found. Click "Add New Product" to create one.</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">Featured</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{prod.name}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{prod.sku}</td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {prod.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">${Number(prod.price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center font-mono text-xs">{prod.inventoryQuantity}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        prod.isFeatured ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-500'
                      }`}>
                        {prod.isFeatured ? 'Featured' : 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(prod.id, prod.name)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete Product"
                      >
                        <Icons.TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal for Creating Product */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">Add New Product</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Price ($USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                      placeholder="99.99"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Initial Stock</label>
                    <input
                      type="number"
                      value={formData.inventoryQuantity}
                      onChange={(e) => setFormData({ ...formData, inventoryQuantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="Product details, specs, and features..."
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 rounded bg-slate-800 border-slate-700"
                    />
                    Active Listing
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="h-4 w-4 text-amber-500 rounded bg-slate-800 border-slate-700"
                    />
                    Featured on Home
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition"
                  >
                    Create Product
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

