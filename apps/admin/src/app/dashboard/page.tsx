'use client';

import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome to your e-commerce admin dashboard
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold text-gray-900">1,234</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
              <p className="text-3xl font-bold text-gray-900">567</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900">890</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
              <p className="text-3xl font-bold text-gray-900">$12,345</p>
            </div>
          </div>

          {/* Service Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Service Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Auth Service', port: '3001', status: 'healthy' },
                { name: 'Product Service', port: '3002', status: 'healthy' },
                { name: 'Order Service', port: '3003', status: 'healthy' },
                { name: 'Payment Service', port: '3004', status: 'healthy' },
              ].map((service) => (
                <div key={service.name} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600">Port: {service.port}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                <h3 className="font-medium text-gray-900">Manage Products</h3>
                <p className="text-sm text-gray-600">Add, edit, or remove products</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                <h3 className="font-medium text-gray-900">View Orders</h3>
                <p className="text-sm text-gray-600">Process and manage orders</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                <h3 className="font-medium text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">Manage user accounts</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}