'use client';

import React, { useEffect, useState, useRef } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import toast from 'react-hot-toast';
import * as Icons from '@radix-ui/react-icons';

interface ProductImage {
  src: string;
  position?: number;
}

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
  images?: ProductImage[];
  demoVideo?: string | null;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function ProductsManagementPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedVideoPreview, setSelectedVideoPreview] = useState<string | null>(null);

  // Add Product Form State
  const [images, setImages] = useState<string[]>([]);
  const [demoVideo, setDemoVideo] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  // Edit Product Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    sku: '',
    price: '',
    inventoryQuantity: 0,
    categoryId: '',
    description: '',
    isActive: true,
    isFeatured: false,
  });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editDemoVideo, setEditDemoVideo] = useState<string | null>(null);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [uploadingEditVideo, setUploadingEditVideo] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const editVideoInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products?limit=50').then((r) => r.json()),
        fetch('/api/products/categories').then((r) => r.json()),
      ]);

      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Upload image(s) to MinIO for Add Product
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 8) {
      toast.error('You can upload up to 8 images per product');
      return;
    }

    setUploadingImage(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((file) => {
        fd.append('files', file);
      });

      const res = await fetch('/api/products/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image(s) to MinIO');
      }

      const uploadedUrls: string[] = data.urls || (data.files ? data.files.map((f: any) => f.url) : []);
      setImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) stored in MinIO`);
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Upload demo video to MinIO for Add Product
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be less than 50MB');
      return;
    }

    setUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append('files', file);

      const res = await fetch('/api/products/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload demo video to MinIO');
      }

      const videoUrl = data.url || (data.urls && data.urls[0]) || (data.files && data.files[0]?.url);
      setDemoVideo(videoUrl);
      toast.success('Demo video stored in MinIO successfully');
    } catch (err: any) {
      toast.error(err.message || 'Video upload failed');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // Open Edit Product Modal and prepopulate
  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setEditFormData({
      name: prod.name || '',
      sku: prod.sku || '',
      price: String(prod.price || '0'),
      inventoryQuantity: prod.inventoryQuantity || 0,
      categoryId: prod.categoryId || '',
      description: prod.description || '',
      isActive: prod.isActive ?? true,
      isFeatured: prod.isFeatured ?? false,
    });
    setEditImages(prod.images ? prod.images.map((img) => img.src) : []);
    setEditDemoVideo(prod.demoVideo || null);
  };

  // Upload image(s) to MinIO for Edit Product
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (editImages.length + files.length > 8) {
      toast.error('You can upload up to 8 images per product');
      return;
    }

    setUploadingEditImage(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((file) => {
        fd.append('files', file);
      });

      const res = await fetch('/api/products/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image(s) to MinIO');
      }

      const uploadedUrls: string[] = data.urls || (data.files ? data.files.map((f: any) => f.url) : []);
      setEditImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) added to product`);
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingEditImage(false);
      if (editImageInputRef.current) editImageInputRef.current.value = '';
    }
  };

  // Upload demo video to MinIO for Edit Product
  const handleEditVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be less than 50MB');
      return;
    }

    setUploadingEditVideo(true);
    try {
      const fd = new FormData();
      fd.append('files', file);

      const res = await fetch('/api/products/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload demo video to MinIO');
      }

      const videoUrl = data.url || (data.urls && data.urls[0]) || (data.files && data.files[0]?.url);
      setEditDemoVideo(videoUrl);
      toast.success('Demo video replaced with new MinIO upload');
    } catch (err: any) {
      toast.error(err.message || 'Video upload failed');
    } finally {
      setUploadingEditVideo(false);
      if (editVideoInputRef.current) editVideoInputRef.current.value = '';
    }
  };

  // Submit Edit Product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsUpdating(true);
    try {
      const payload = {
        name: editFormData.name,
        sku: editFormData.sku,
        price: parseFloat(editFormData.price) || 0,
        inventoryQuantity: Number(editFormData.inventoryQuantity) || 0,
        categoryId: editFormData.categoryId || null,
        description: editFormData.description,
        isActive: editFormData.isActive,
        isFeatured: editFormData.isFeatured,
        demoVideo: editDemoVideo || null,
        images: editImages.map((src, idx) => ({
          src,
          position: idx,
        })),
      };

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      toast.success('Product updated successfully');
      setEditingProduct(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

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
        demoVideo: demoVideo || null,
        images: images.map((src, idx) => ({
          src,
          position: idx,
        })),
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

      toast.success('Product created with MinIO media successfully');
      setShowAddModal(false);
      setImages([]);
      setDemoVideo(null);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Icons.CubeIcon className="w-7 h-7 text-indigo-400" />
              Product Catalog & MinIO Media
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Create, view, edit, and manage products with local MinIO photos and demo video uploads.
            </p>
          </div>
          <button
            onClick={() => {
              setImages([]);
              setDemoVideo(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition self-start md:self-auto"
          >
            <Icons.PlusIcon className="w-4 h-4" />
            Add New Product
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No products found. Click &quot;Add New Product&quot; to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Media</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4 text-center">Stock</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {products.map((prod) => {
                    const mainImage = prod.images && prod.images.length > 0 ? prod.images[0].src : null;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {mainImage ? (
                              <img
                                src={mainImage}
                                alt={prod.name}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-700 bg-slate-800 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs flex-shrink-0">
                                📷
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white">{prod.name}</div>
                              {prod.description && (
                                <div className="text-xs text-slate-400 line-clamp-1 max-w-xs">{prod.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {prod.images && prod.images.length > 0 && (
                              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                                {prod.images.length} {prod.images.length === 1 ? 'photo' : 'photos'}
                              </span>
                            )}
                            {prod.demoVideo ? (
                              <button
                                onClick={() => setSelectedVideoPreview(prod.demoVideo!)}
                                className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 transition"
                              >
                                ▶ Demo Video
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600">No video</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{prod.sku}</td>
                        <td className="px-6 py-4 text-xs text-slate-300">
                          {prod.category?.name || 'Uncategorized'}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">${Number(prod.price).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs">{prod.inventoryQuantity}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                prod.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {prod.isActive ? 'Active' : 'Draft'}
                            </span>
                            {prod.isFeatured && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingProduct(prod)}
                              className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-lg transition"
                              title="View Product"
                            >
                              <Icons.EyeOpenIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(prod)}
                              className="p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition"
                              title="Edit Product"
                            >
                              <Icons.Pencil1Icon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(prod.id, prod.name)}
                              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition"
                              title="Delete Product"
                            >
                              <Icons.TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* VIEW PRODUCT MODAL                                      */}
        {/* ======================================================== */}
        {viewingProduct && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{viewingProduct.name}</h2>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      viewingProduct.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {viewingProduct.isActive ? 'Active' : 'Draft'}
                  </span>
                  {viewingProduct.isFeatured && (
                    <span className="text-xs px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium">
                      Featured
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              {/* Photos Gallery */}
              {viewingProduct.images && viewingProduct.images.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Product Photos ({viewingProduct.images.length})
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {viewingProduct.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={img.src}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500 transition block bg-slate-950"
                      >
                        <img src={img.src} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Demo Video Player */}
              {viewingProduct.demoVideo && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Icons.VideoIcon className="w-4 h-4 text-purple-400" />
                    Demo Video
                  </label>
                  <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-64 flex items-center justify-center border border-slate-800">
                    <video src={viewingProduct.demoVideo} controls className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block uppercase">Price</span>
                  <span className="text-base font-bold text-emerald-400">
                    ${Number(viewingProduct.price).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">SKU</span>
                  <span className="font-mono text-slate-200">{viewingProduct.sku || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">Category</span>
                  <span className="text-slate-200 font-medium">
                    {viewingProduct.category?.name || 'Uncategorized'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">Inventory Stock</span>
                  <span className="text-slate-200 font-mono font-bold">
                    {viewingProduct.inventoryQuantity} units
                  </span>
                </div>
              </div>

              {/* Description */}
              {viewingProduct.description && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Description
                  </label>
                  <p className="text-sm text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed">
                    {viewingProduct.description}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Created {new Date(viewingProduct.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const p = viewingProduct;
                      setViewingProduct(null);
                      openEditModal(p);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Icons.Pencil1Icon className="w-3.5 h-3.5" />
                    Edit This Product
                  </button>
                  <button
                    onClick={() => setViewingProduct(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* EDIT PRODUCT MODAL                                      */}
        {/* ======================================================== */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Icons.Pencil1Icon className="w-5 h-5 text-indigo-400" />
                  <span>Edit Product: {editingProduct.name}</span>
                </h2>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="mt-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Product Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category & SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                    <select
                      value={editFormData.categoryId}
                      onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    >
                      <option value="">-- No Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SKU</label>
                    <input
                      type="text"
                      value={editFormData.sku}
                      onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Price & Inventory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Price ($) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Inventory Stock Quantity
                    </label>
                    <input
                      type="number"
                      required
                      value={editFormData.inventoryQuantity}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, inventoryQuantity: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm leading-relaxed"
                  />
                </div>

                {/* Active and Featured checkboxes */}
                <div className="flex items-center gap-6 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>Active & Available for Sale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-300">
                    <input
                      type="checkbox"
                      checked={editFormData.isFeatured}
                      onChange={(e) => setEditFormData({ ...editFormData, isFeatured: e.target.checked })}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4"
                    />
                    <span>Featured Product</span>
                  </label>
                </div>

                {/* Images (MinIO) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300 uppercase">
                      Product Photos (MinIO)
                    </label>
                    <span className="text-[11px] text-slate-400">{editImages.length}/8 uploaded</span>
                  </div>

                  {editImages.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {editImages.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition shadow"
                            title="Remove Photo"
                          >
                            <Icons.TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    ref={editImageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="hidden"
                    disabled={uploadingEditImage || editImages.length >= 8}
                  />

                  {editImages.length < 8 && (
                    <button
                      type="button"
                      onClick={() => editImageInputRef.current?.click()}
                      disabled={uploadingEditImage}
                      className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-xs text-slate-300 flex items-center justify-center gap-2 transition"
                    >
                      <Icons.UploadIcon className="w-4 h-4 text-indigo-400" />
                      {uploadingEditImage ? 'Uploading photo(s) to MinIO...' : '+ Upload Additional Photos to MinIO'}
                    </button>
                  )}
                </div>

                {/* Demo Video (MinIO) */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Demo Video (MinIO)
                  </label>

                  {editDemoVideo ? (
                    <div className="flex items-center justify-between p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Icons.VideoIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-purple-200">Current Demo Video Loaded</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVideoPreview(editDemoVideo)}
                          className="px-2 py-1 bg-purple-900/40 hover:bg-purple-900/70 text-purple-200 text-xs rounded-lg transition"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditDemoVideo(null)}
                          className="px-2 py-1 bg-rose-900/40 hover:bg-rose-900/70 text-rose-200 text-xs rounded-lg transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={editVideoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleEditVideoUpload}
                        className="hidden"
                        disabled={uploadingEditVideo}
                      />
                      <button
                        type="button"
                        onClick={() => editVideoInputRef.current?.click()}
                        disabled={uploadingEditVideo}
                        className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-purple-500 rounded-xl text-xs text-slate-300 flex items-center justify-center gap-2 transition"
                      >
                        <Icons.VideoIcon className="w-4 h-4 text-purple-400" />
                        {uploadingEditVideo ? 'Uploading demo video to MinIO...' : 'Upload Demo Video (MP4/WebM)'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving Product...' : 'Save Product Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Video Preview Modal */}
        {selectedVideoPreview && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Icons.VideoIcon className="w-5 h-5 text-purple-400" />
                  Product Demo Video Preview (MinIO)
                </h3>
                <button
                  onClick={() => setSelectedVideoPreview(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-96 flex items-center justify-center">
                <video src={selectedVideoPreview} controls autoPlay className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        )}

        {/* Modal for Creating Product */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Add New Product</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-normal">
                    MinIO Powered
                  </span>
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
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

                {/* MinIO Image Uploads */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300 uppercase">
                      Product Images (MinIO)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {images.length}/8 uploaded
                    </span>
                  </div>

                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage || images.length >= 8}
                  />

                  <div
                    onClick={() => !uploadingImage && imageInputRef.current?.click()}
                    className={`border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/40 rounded-xl p-4 text-center cursor-pointer transition ${
                      uploadingImage ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="flex items-center justify-center gap-2 text-indigo-400 text-xs py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                        <span>Uploading images to local MinIO...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-1">
                        <Icons.UploadIcon className="w-5 h-5 text-indigo-400 mb-1" />
                        <span className="text-xs text-slate-300 font-medium">Click to upload photos</span>
                        <span className="text-[10px] text-slate-500">JPG, PNG, WebP up to 10MB</span>
                      </div>
                    )}
                  </div>

                  {images.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {images.map((src, idx) => (
                        <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-700">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            className="absolute inset-0 bg-black/60 text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            <Icons.TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* MinIO Demo Video Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300 uppercase">
                      Demo Video (MinIO, Max 1)
                    </label>
                    <span className="text-[11px] text-slate-400">Max 50MB</span>
                  </div>

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={uploadingVideo}
                  />

                  {demoVideo ? (
                    <div className="flex items-center justify-between p-3 bg-purple-950/20 border border-purple-800/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Icons.VideoIcon className="w-5 h-5 text-purple-400" />
                        <span className="text-xs text-purple-200 font-medium">Demo Video Uploaded to MinIO</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVideoPreview(demoVideo)}
                          className="text-xs text-purple-300 hover:text-white px-2 py-1 bg-purple-900/40 rounded"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setDemoVideo(null)}
                          className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-900/40 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploadingVideo && videoInputRef.current?.click()}
                      className={`border-2 border-dashed border-slate-700 hover:border-purple-500 bg-slate-800/40 rounded-xl p-3 text-center cursor-pointer transition ${
                        uploadingVideo ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingVideo ? (
                        <div className="flex items-center justify-center gap-2 text-purple-400 text-xs py-1">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                          <span>Uploading demo video to local MinIO...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                          <Icons.VideoIcon className="w-4 h-4 text-purple-400" />
                          <span>Click to upload 1 demo video (MP4, WebM)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                      placeholder="Optional, auto-generated"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                      placeholder="29.99"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Stock</label>
                    <input
                      type="number"
                      required
                      value={formData.inventoryQuantity}
                      onChange={(e) => setFormData({ ...formData, inventoryQuantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="Short product overview"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>Active Product</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4"
                    />
                    <span>Featured on Home</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
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
