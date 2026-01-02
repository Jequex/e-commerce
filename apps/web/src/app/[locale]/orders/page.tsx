'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/providers';
import { getUserOrders, Order, OrderItem } from '@/api-calls';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const { isAuthenticated, openAuthModal } = useAuth();
  const router = useRouter();
  const t = useTranslations('orders');

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal();
      router.push('/');
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await getUserOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'text-yellow-700 bg-yellow-100',
      confirmed: 'text-blue-700 bg-blue-100',
      processing: 'text-indigo-700 bg-indigo-100',
      shipped: 'text-purple-700 bg-purple-100',
      delivered: 'text-green-700 bg-green-100',
      cancelled: 'text-red-700 bg-red-100',
      refunded: 'text-gray-700 bg-gray-100',
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels: Record<Order['status'], string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navbar activeRoute="/orders" />
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/orders" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My Orders
          </h1>
          <p className="text-lg text-gray-600">
            View and track your order history
          </p>
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm p-12 text-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                No orders yet
              </h3>
              <p className="text-gray-600 max-w-md">
                When you place orders, they will appear here. Start shopping to see your order history!
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          </motion.div>
        )}

        {/* Orders List */}
        {orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleOrderClick(order)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-sm text-gray-600 mt-1">
                          Tracking: {order.trackingNumber}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(order.totalPrice, order.currency)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(order.lineItems || order.items || []).length} item(s)
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Items:</span>
                      <span className="font-medium text-gray-900">
                        {(order.lineItems || order.items || [])
                          .slice(0, 3)
                          .map((item) => item.productTitle)
                          .join(', ')}
                        {(order.lineItems || order.items || []).length > 3 &&
                          ` +${(order.lineItems || order.items || []).length - 3} more`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Details Button */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View Details →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showDetails && selectedOrder && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetails}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-3xl bg-white rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Order Details
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Order #{selectedOrder.orderNumber}
                  </p>
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Status and Date */}
                <div className="flex items-center gap-4 mb-6">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {(selectedOrder.lineItems || selectedOrder.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.productTitle}
                          </p>
                          {item.variantTitle && (
                            <p className="text-sm text-gray-600">
                              {item.variantTitle}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(item.totalPrice, selectedOrder.currency)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.price, selectedOrder.currency)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Order Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">
                        {formatCurrency(selectedOrder.subtotalPrice, selectedOrder.currency)}
                      </span>
                    </div>
                    {selectedOrder.totalShipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-900">
                          {formatCurrency(selectedOrder.totalShipping, selectedOrder.currency)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.totalTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">
                          {formatCurrency(selectedOrder.totalTax, selectedOrder.currency)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.totalDiscounts > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(selectedOrder.totalDiscounts, selectedOrder.currency)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-lg">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">
                        {formatCurrency(selectedOrder.totalPrice, selectedOrder.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Shipping Address
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                      {selectedOrder.shippingAddress.firstName && (
                        <p className="font-medium">
                          {selectedOrder.shippingAddress.firstName}{' '}
                          {selectedOrder.shippingAddress.lastName}
                        </p>
                      )}
                      <p>{selectedOrder.shippingAddress.address1}</p>
                      {selectedOrder.shippingAddress.address2 && (
                        <p>{selectedOrder.shippingAddress.address2}</p>
                      )}
                      <p>
                        {selectedOrder.shippingAddress.city}
                        {selectedOrder.shippingAddress.province &&
                          `, ${selectedOrder.shippingAddress.province}`}{' '}
                        {selectedOrder.shippingAddress.zip}
                      </p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                      {selectedOrder.shippingAddress.phone && (
                        <p className="mt-2">{selectedOrder.shippingAddress.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tracking Information */}
                {selectedOrder.trackingNumber && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Tracking Information
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      {selectedOrder.carrier && (
                        <p className="text-sm text-gray-600 mb-1">
                          Carrier: {selectedOrder.carrier}
                        </p>
                      )}
                      <p className="text-sm font-medium text-gray-900">
                        Tracking Number: {selectedOrder.trackingNumber}
                      </p>
                      {selectedOrder.trackingUrl && (
                        <a
                          href={selectedOrder.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          Track Shipment →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Order Notes
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleCloseDetails}
                  className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
