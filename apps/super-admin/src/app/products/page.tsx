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
}

export default function ProductsManagementPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Media states
  const [images, setImages] = useState<string[]>([]);
  const [demoVideo, setDemoVideo] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [selectedVideoPreview, setSelectedVideoPreview] = useState<string | null>(null);

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

  // Upload image(s) to MinIO
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

  // Upload 1 demo video to MinIO
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (MP4, WebM, MOV)');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file size exceeds maximum 100MB');
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
      setShowModal(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Product Catalog & MinIO Media</h1>
            <p className="text-sm text-slate-400 mt-1">
              Create, update, and manage products with local MinIO images and demo video uploads.
            </p>
          </div>
          <button
            onClick={() => {
              setImages([]);
              setDemoVideo(null);
              setShowModal(true);
            }}
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
                  <th className="px-6 py-4">Media</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">Featured</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map((prod) => {
                  const mainImage = prod.images && prod.images.length > 0 ? prod.images[0].src : null;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/30 transition">
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
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

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
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Add New Product</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-normal">
                    MinIO Powered
                  </span>
                </h2>
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
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {images.map((src, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-700 aspect-square bg-slate-800">
                          <img src={src} alt={`Product ${i}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 bg-indigo-600 text-white text-[9px] font-bold px-1 rounded shadow">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-full transition"
                            title="Remove image"
                          >
                            <Icons.Cross2Icon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* MinIO 1 Demo Video Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300 uppercase">
                      Demo Video (1 Video Upload to MinIO)
                    </label>
                    {demoVideo && (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        ✓ Video Attached
                      </span>
                    )}
                  </div>

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={uploadingVideo}
                  />

                  {demoVideo ? (
                    <div className="border border-slate-700 rounded-xl p-3 bg-slate-800/60 space-y-2">
                      <div className="rounded-lg overflow-hidden bg-black aspect-video max-h-48 flex items-center justify-center">
                        <video src={demoVideo} controls className="w-full h-full max-h-48 object-contain" />
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Stored in MinIO object storage</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setDemoVideo(null)}
                            className="text-rose-400 hover:text-rose-300 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploadingVideo && videoInputRef.current?.click()}
                      className={`border-2 border-dashed border-slate-700 hover:border-purple-500 bg-purple-950/10 rounded-xl p-4 text-center cursor-pointer transition ${
                        uploadingVideo ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingVideo ? (
                        <div className="flex items-center justify-center gap-2 text-purple-400 text-xs py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                          <span>Uploading demo video to MinIO (up to 100MB)...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-1">
                          <Icons.VideoIcon className="w-5 h-5 text-purple-400 mb-1" />
                          <span className="text-xs text-slate-300 font-medium">Click to upload 1 demo video</span>
                          <span className="text-[10px] text-slate-500">MP4, WebM, MOV up to 100MB</span>
                        </div>
                      )}
                    </div>
                  )}
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
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="Product details, specs, and features..."
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
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
