'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import * as Icons from '@radix-ui/react-icons';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  title: string;
  sku?: string;
  quantity: number;
  price: string | number;
  total: string | number;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  email: string;
  status: string;
  financialStatus: string;
  fulfillmentStatus: string;
  currency: string;
  totalPrice: string | number;
  subtotalPrice: string | number;
  createdAt: string;
  lineItems?: OrderItem[];
}

export default function CustomersPurchasesPage() {
  const { token } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  async function fetchData() {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch customers
      const usersRes = await fetch('/api/auth/users?role=customer', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      const custList = (usersData.users || []).filter((u: any) => u.role === 'customer' || !u.role);
      setCustomers(custList);

      // 2. Fetch all orders with line items
      const ordersRes = await fetch('/api/orders/admin/all?limit=500', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders || []);
    } catch (err: any) {
      toast.error('Failed to load customers and purchases data');
    } finally {
      setLoading(false);
    }
  }

  // Calculate metrics per customer
  const customerStats = customers.map((c) => {
    const customerOrders = orders.filter((o) => o.userId === c.id || o.email?.toLowerCase() === c.email.toLowerCase());
    const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    const lastOrder = customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return {
      ...c,
      ordersCount: customerOrders.length,
      totalSpent,
      lastOrderDate: lastOrder?.createdAt || null,
      orders: customerOrders,
    };
  });

  const filteredCustomers = customerStats.filter((c) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term))
    );
  });

  const totalPlatformRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  const activeSelected = selectedCustomer ? customerStats.find((c) => c.id === selectedCustomer.id) : null;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Customers & Purchase History</h1>
            <p className="text-sm text-slate-400 mt-1">
              Super Admin audit view of all registered buyers and their complete transaction records.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            <Icons.ReloadIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Customers</span>
            <p className="text-2xl font-bold text-white mt-1">{customers.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders Placed</span>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{orders.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Gross Revenue</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">${totalPlatformRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg. Spend Per Buyer</span>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              ${customers.length > 0 ? (totalPlatformRevenue / customers.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="relative">
            <Icons.MagnifyingGlassIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Contact</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Orders</th>
                  <th className="py-3.5 px-4 font-semibold">Total Spent</th>
                  <th className="py-3.5 px-4 font-semibold">Last Purchase</th>
                  <th className="py-3.5 px-4 font-semibold">Member Since</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Purchases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mb-2"></div>
                      <p>Loading customers & purchases...</p>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      No customer accounts found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {c.firstName || c.lastName ? `${c.firstName || ''} ${c.lastName || ''}` : 'Unnamed User'}
                        </div>
                        <div className="text-xs text-slate-400">{c.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div>{c.phone || 'No phone'}</div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] mt-0.5 font-medium ${
                          c.status === 'active' ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                          {c.ordersCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">
                        ${c.totalSpent.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition"
                        >
                          View ({c.ordersCount})
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Purchases Modal / Drawer */}
        {activeSelected && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white">
                    Purchase History: {activeSelected.firstName || activeSelected.lastName ? `${activeSelected.firstName || ''} ${activeSelected.lastName || ''}` : activeSelected.email}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeSelected.email} • {activeSelected.ordersCount} total orders • ${activeSelected.totalSpent.toFixed(2)} lifetime spend
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {activeSelected.orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Icons.CubeIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm">This customer hasn't placed any purchases yet.</p>
                  </div>
                ) : (
                  activeSelected.orders.map((ord) => (
                    <div key={ord.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-400 text-sm">{ord.orderNumber}</span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-400">{new Date(ord.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-slate-800 text-slate-300">
                            {ord.status}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            ord.financialStatus === 'paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400'
                          }`}>
                            {ord.financialStatus}
                          </span>
                          <span className="font-bold text-white text-sm ml-2">
                            ${Number(ord.totalPrice || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Line Items */}
                      <div>
                        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Items Purchased ({ord.lineItems?.length || 0})
                        </h4>
                        <div className="divide-y divide-slate-800/40">
                          {ord.lineItems && ord.lineItems.length > 0 ? (
                            ord.lineItems.map((item) => (
                              <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-medium text-slate-200">{item.title}</span>
                                  {item.sku && <span className="text-slate-500 font-mono ml-2">SKU: {item.sku}</span>}
                                  <div className="text-slate-400 text-[11px] mt-0.5">
                                    Qty: {item.quantity} × ${Number(item.price || 0).toFixed(2)}
                                  </div>
                                </div>
                                <span className="font-semibold text-slate-200">
                                  ${Number(item.total || Number(item.price || 0) * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500 italic">No line items detailed</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

