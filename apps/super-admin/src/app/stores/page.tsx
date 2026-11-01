'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import toast from 'react-hot-toast';
import * as Icons from '@radix-ui/react-icons';

interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string | null;
  type: 'physical' | 'online' | 'hybrid';
  status: 'active' | 'inactive' | 'pending_approval' | 'suspended' | 'closed';
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  categoryId?: string | null;
  logo?: string | null;
  banner?: string | null;
  averageRating?: string | null;
  totalOrders?: number | null;
  totalRevenue?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface Category {
  id: string;
  name: string;
}

export default function StoresManagementPage() {
  const { token } = useAuthStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'online' as 'physical' | 'online' | 'hybrid',
    status: 'active' as 'active' | 'inactive' | 'pending_approval' | 'suspended' | 'closed',
    ownerId: '',
    categoryId: '',
    email: '',
    phone: '',
    website: '',
    logo: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const authToken = (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('super-admin-auth') || '{}')?.state?.token || localStorage.getItem('token')) : '');
      const fd = new FormData();
      fd.append('files', file);

      const res = await fetch('/api/products/upload', {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload store logo');
      }

      const logoUrl = data.url || (data.urls && data.urls[0]) || (data.files && data.files[0]?.url);
      if (logoUrl) {
        setFormData((prev) => ({ ...prev, logo: logoUrl }));
        toast.success('Store logo uploaded to MinIO');
      }
    } catch (err: any) {
      toast.error(err.message || 'Store logo upload failed');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stores/?limit=100');
      const data = await res.json();
      if (data && data.stores) {
        setStores(data.stores);
      } else {
        setStores([]);
      }
    } catch (e: any) {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/auth/admins');
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (e) {
      console.error('Failed to load admins', e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchAdmins();
    fetchCategories();
  }, []);

  const handleNameChange = (name: string, isCreate: boolean) => {
    if (isCreate) {
      const autoSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, name, slug: autoSlug }));
    } else {
      setFormData(prev => ({ ...prev, name }));
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      type: 'online',
      status: 'active',
      ownerId: admins.length > 0 ? admins[0].id : '',
      categoryId: '',
      email: '',
      phone: '',
      website: '',
      logo: '',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      slug: store.slug,
      description: store.description || '',
      type: store.type || 'online',
      status: store.status || 'active',
      ownerId: store.ownerId,
      categoryId: store.categoryId || '',
      email: store.email || '',
      phone: store.phone || '',
      website: store.website || '',
      logo: store.logo || '',
    });
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        type: formData.type,
        status: formData.status,
      };
      if (formData.description) payload.description = formData.description;
      if (formData.ownerId) payload.ownerId = formData.ownerId;
      if (formData.categoryId) payload.categoryId = formData.categoryId;
      if (formData.email) payload.email = formData.email;
      if (formData.phone) payload.phone = formData.phone;
      if (formData.website) payload.website = formData.website;
      if (formData.logo) payload.logo = formData.logo;

      const res = await fetch('/api/stores/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create store');
      }

      toast.success('Store created successfully');
      setShowCreateModal(false);
      fetchStores();
    } catch (e: any) {
      toast.error(e.message || 'Error creating store');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        type: formData.type,
        status: formData.status,
      };
      if (formData.description !== undefined) payload.description = formData.description;
      if (formData.ownerId) payload.ownerId = formData.ownerId;
      if (formData.categoryId) payload.categoryId = formData.categoryId;
      if (formData.email !== undefined) payload.email = formData.email;
      if (formData.phone !== undefined) payload.phone = formData.phone;
      if (formData.website !== undefined) payload.website = formData.website;
      if (formData.logo !== undefined) payload.logo = formData.logo;

      const res = await fetch(`/api/stores/${editingStore.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update store');
      }

      toast.success('Store updated successfully');
      setShowEditModal(false);
      setEditingStore(null);
      fetchStores();
    } catch (e: any) {
      toast.error(e.message || 'Error updating store');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (storeId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      toast.success(`Store status updated to ${newStatus}`);
      fetchStores();
    } catch (e: any) {
      toast.error(e.message || 'Error updating store status');
    }
  };

  const handleDeleteStore = async (store: Store) => {
    if (!confirm(`Are you sure you want to deactivate / delete store "${store.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete store');
      }

      toast.success('Store deleted successfully');
      fetchStores();
    } catch (e: any) {
      toast.error(e.message || 'Error deleting store');
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOwnerName = (ownerId: string) => {
    const admin = admins.find(a => a.id === ownerId);
    if (!admin) return ownerId ? `Admin (${ownerId.substring(0, 8)}...)` : 'Unassigned';
    return `${admin.firstName || ''} ${admin.lastName || ''} (${admin.email})`.trim();
  };

  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId) return 'Unassigned';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>;
      case 'pending_approval':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending Approval</span>;
      case 'suspended':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">Suspended</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">{status}</span>;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Stores & Merchants</h1>
            <p className="text-sm text-slate-400 mt-1">
              Super Admin central control for merchant stores, approvals, ownership, and operations.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
          >
            <Icons.PlusIcon className="w-4 h-4" />
            Add New Store
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-400">Total Stores</p>
            <p className="text-2xl font-bold text-white mt-1">{stores.length}</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <p className="text-xs font-medium text-emerald-400">Active Stores</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {stores.filter(s => s.status === 'active').length}
            </p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-400">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {stores.filter(s => s.status === 'pending_approval').length}
            </p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <p className="text-xs font-medium text-rose-400">Suspended / Closed</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">
              {stores.filter(s => s.status === 'suspended' || s.status === 'closed').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl">
          <div className="relative flex-1">
            <Icons.MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search stores by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="suspended">Suspended</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Stores Table */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto min-w-[750px]">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4">Merchant Owner</th>
                  <th className="py-3 px-4">Category / Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mb-2"></div>
                      <p>Loading stores...</p>
                    </td>
                  </tr>
                ) : filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No stores found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((store) => (
                    <tr key={store.id} className="hover:bg-slate-800/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {store.logo ? (
                            <img
                              src={store.logo}
                              alt={store.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold">
                              {store.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {store.name}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              /{store.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-300 max-w-[220px] truncate" title={getOwnerName(store.ownerId)}>
                          {getOwnerName(store.ownerId)}
                        </div>
                        {store.email && (
                          <div className="text-xs text-slate-400 mt-0.5">{store.email}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-200">{getCategoryName(store.categoryId)}</div>
                        <div className="text-xs text-slate-400 capitalize">{store.type}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(store.status)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(store.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingStore(store)}
                            title="View Details"
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Icons.EyeOpenIcon className="w-4 h-4" />
                          </button>
                          
                          {store.status === 'pending_approval' && (
                            <button
                              onClick={() => handleStatusChange(store.id, 'active')}
                              title="Approve & Activate"
                              className="px-2 py-1 text-xs rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 font-medium"
                            >
                              Approve
                            </button>
                          )}

                          {store.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(store.id, 'suspended')}
                              title="Suspend Store"
                              className="px-2 py-1 text-xs rounded bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 font-medium"
                            >
                              Suspend
                            </button>
                          )}

                          {store.status === 'suspended' && (
                            <button
                              onClick={() => handleStatusChange(store.id, 'active')}
                              title="Reactivate Store"
                              className="px-2 py-1 text-xs rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 font-medium"
                            >
                              Activate
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(store)}
                            title="Edit Store"
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Icons.Pencil1Icon className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteStore(store)}
                            title="Delete Store"
                            className="p-1.5 rounded hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 transition-colors"
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

        {/* View Store Modal */}
        {viewingStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  {viewingStore.logo ? (
                    <img src={viewingStore.logo} alt={viewingStore.name} className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-lg">
                      {viewingStore.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{viewingStore.name}</h2>
                    <p className="text-xs text-slate-400 font-mono">ID: {viewingStore.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingStore(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 py-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-xs text-slate-400 block">Status</span>
                    <div className="mt-1">{getStatusBadge(viewingStore.status)}</div>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-xs text-slate-400 block">Type</span>
                    <span className="text-sm font-medium text-white capitalize">{viewingStore.type}</span>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-xs text-slate-400 block">Merchant Owner</span>
                  <p className="text-sm font-medium text-white mt-0.5">{getOwnerName(viewingStore.ownerId)}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">Owner ID: {viewingStore.ownerId}</p>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-xs text-slate-400 block">Category</span>
                  <p className="text-sm font-medium text-white mt-0.5">{getCategoryName(viewingStore.categoryId)}</p>
                </div>

                {viewingStore.description && (
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-xs text-slate-400 block">Description</span>
                    <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">{viewingStore.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-xs text-slate-400 block">Contact Email</span>
                    <p className="text-xs text-white mt-1 truncate">{viewingStore.email || 'None'}</p>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-xs text-slate-400 block">Phone</span>
                    <p className="text-xs text-white mt-1 truncate">{viewingStore.phone || 'None'}</p>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-xs text-slate-400 block">Website</span>
                    <p className="text-xs text-white mt-1 truncate">{viewingStore.website || 'None'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div>Created: {new Date(viewingStore.createdAt).toLocaleString()}</div>
                  <div>Updated: {new Date(viewingStore.updatedAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setViewingStore(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Store Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">Create New Store</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4 py-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value, true)}
                    placeholder="e.g. Acme Supermarket"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Store Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. acme-supermarket"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Assigned Merchant Owner *
                    </label>
                    <select
                      value={formData.ownerId}
                      onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Merchant Admin</option>
                      {admins.map((adm) => (
                        <option key={adm.id} value={adm.id}>
                          {adm.firstName || adm.email} ({adm.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Initial Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="suspended">Suspended</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Store Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="online">Online</option>
                      <option value="physical">Physical</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Category (Optional)</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description of this store..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="store@example.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Store Logo
                  </label>
                  <div className="flex items-center gap-3">
                    {formData.logo ? (
                      <div className="relative group w-12 h-12 rounded-lg border border-slate-700 bg-slate-900 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logo: '' })}
                          className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-dashed border-slate-700 bg-slate-900 flex items-center justify-center text-[10px] text-slate-500 font-bold flex-shrink-0">
                        No Logo
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex gap-2">
                        <label className={`px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg cursor-pointer transition ${
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
                          value={formData.logo}
                          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                          placeholder="Or paste image URL (https://...)"
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Store'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Store Modal */}
        {showEditModal && editingStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">Edit Store: {editingStore.name}</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 py-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value, false)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Store Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Assigned Merchant Owner
                    </label>
                    <select
                      value={formData.ownerId}
                      onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Merchant Admin</option>
                      {admins.map((adm) => (
                        <option key={adm.id} value={adm.id}>
                          {adm.firstName || adm.email} ({adm.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="suspended">Suspended</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Store Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="online">Online</option>
                      <option value="physical">Physical</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Category (Optional)</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Store Logo
                  </label>
                  <div className="flex items-center gap-3">
                    {formData.logo ? (
                      <div className="relative group w-12 h-12 rounded-lg border border-slate-700 bg-slate-900 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logo: '' })}
                          className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-dashed border-slate-700 bg-slate-900 flex items-center justify-center text-[10px] text-slate-500 font-bold flex-shrink-0">
                        No Logo
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex gap-2">
                        <label className={`px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg cursor-pointer transition ${
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
                          value={formData.logo}
                          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                          placeholder="Or paste image URL (https://...)"
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
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

