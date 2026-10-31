'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import toast from 'react-hot-toast';
import * as Icons from '@radix-ui/react-icons';

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function AdminsManagementPage() {
  const { token, user: currentUser } = useAuthStore();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'admin',
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admins');
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (e: any) {
      toast.error('Failed to load admin list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/admin-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create admin user');
      }

      toast.success('Admin user created successfully');
      setShowCreateModal(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'admin' });
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    const nextStatus = admin.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/auth/admins/${admin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      toast.success(`Admin ${nextStatus === 'active' ? 'activated' : 'suspended'}`);
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (id === currentUser?.id) {
      toast.error('You cannot delete your own active super admin account.');
      return;
    }

    if (!confirm(`Are you sure you want to delete admin "${email}"?`)) return;

    try {
      const res = await fetch(`/api/auth/admins/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete admin');
      }

      toast.success('Admin removed');
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Admin Accounts Governance</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Super Admin Exclusive
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Create and manage staff, assign administrator roles, and monitor administrative access.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            <Icons.PlusIcon className="w-4 h-4" />
            Create Admin User
          </button>
        </div>

        {/* Admins Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading administrators...</div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No admins found.</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {adm.firstName || ''} {adm.lastName || ''}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{adm.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        adm.role === 'super_admin'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {adm.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                        adm.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {adm.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(adm.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {adm.lastLoginAt ? new Date(adm.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {adm.role !== 'super_admin' && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(adm)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
                            >
                              {adm.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(adm.id, adm.email)}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                              title="Delete Admin"
                            >
                              <Icons.TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {adm.role === 'super_admin' && (
                          <span className="text-xs text-slate-500 italic">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Admin Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">Create Administrator Account</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="admin@ecommerce.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Privilege Level</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="admin">Admin (Operational, products, read-only categories)</option>
                    <option value="super_admin">Super Admin (Full governance & category ownership)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition"
                  >
                    Create Account
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

