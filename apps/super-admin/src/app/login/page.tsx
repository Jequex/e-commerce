'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/useAuthStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('superadmin@ecommerce.com');
  const [password, setPassword] = useState('SuperAdmin123!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.user?.role !== 'super_admin' && data.admin?.role !== 'super_admin') {
        throw new Error('Access denied. This portal is strictly for Super Administrators.');
      }

      const adminUser = data.user || data.admin;
      setAuth(data.token, adminUser);
      toast.success('Super Admin authenticated successfully');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 items-center justify-center font-black text-xl text-white shadow-xl shadow-indigo-500/20 mb-4">
            SA
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Portal</h1>
          <p className="text-sm text-slate-400 mt-1">Platform Governance, Legal, & Categories</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Super Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="superadmin@ecommerce.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="••••••••••••"
            />
          </div>

          <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-xl text-xs text-slate-400">
            Default credentials pre-filled: <br />
            <span className="text-amber-400 font-mono">superadmin@ecommerce.com</span> / <span className="text-amber-400 font-mono">SuperAdmin123!</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In as Super Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

