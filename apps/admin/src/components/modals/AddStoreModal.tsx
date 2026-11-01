'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';
import { useAuthStore } from '@/stores/use-auth-store';
import { toast } from 'react-toastify';

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (store: any) => void;
}

export default function AddStoreModal({
  isOpen,
  onClose,
  onSuccess,
}: AddStoreModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'online' | 'physical' | 'hybrid'>('online');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('files', file);

      const res = await fetch(`http://${urls.products.create}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem('token') || ''}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      const uploadedUrl = data.url || (data.urls && data.urls[0]) || (data.files && data.files[0]?.url);
      if (uploadedUrl) {
        setLogo(uploadedUrl);
        toast.success('Store logo uploaded to MinIO');
      }
    } catch (err: any) {
      toast.error(err.message || 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const t = useTranslations('stores');
  const common = useTranslations('common');
  const { token } = useAuthStore();

  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Store name and slug are required');
      return;
    }

    setIsSubmitting(true);

    const storePayload: any = {
      name: name.trim(),
      slug: slug.trim(),
      type,
      status: 'active',
    };

    if (description.trim()) storePayload.description = description.trim();
    if (email.trim()) storePayload.email = email.trim();
    if (phone.trim()) storePayload.phone = phone.trim();
    if (website.trim()) storePayload.website = website.trim();
    if (logo.trim()) storePayload.logo = logo.trim();
    if (banner.trim()) storePayload.banner = banner.trim();
    if (categoryId.trim()) storePayload.categoryId = categoryId.trim();

    try {
      const url = `http://${urls.store.create}`;
      const res = await callApi(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(storePayload),
      });

      const created = res.store || res;
      toast.success('Store created successfully');
      onSuccess(created);
      onClose();

      // Reset form
      setName('');
      setSlug('');
      setDescription('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setLogo('');
      setBanner('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create store');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Store
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.Cross2Icon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Urban Fashion Outlet"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          {/* Store Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Store Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="urban-fashion-outlet"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
            />
          </div>

          {/* Store Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Store Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="online">Online Store</option>
              <option value="physical">Physical Store</option>
              <option value="hybrid">Hybrid (Physical & Online)</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your store..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          {/* Contact Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="store@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Website & Logo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Store Logo
              </label>
              <div className="flex items-center space-x-3">
                {logo ? (
                  <div className="relative group w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt="Store logo" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      className="absolute inset-0 bg-red-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400 font-bold flex-shrink-0">
                    No Logo
                  </div>
                )}
                <div className="flex-1 flex space-x-2">
                  <label className={`px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg cursor-pointer transition whitespace-nowrap flex items-center ${
                    uploadingLogo ? 'opacity-50 pointer-events-none' : ''
                  }`}>
                    {uploadingLogo ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </label>
                  <input
                    type="url"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="Or paste URL"
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
