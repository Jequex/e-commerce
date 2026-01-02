import callApi from './callApi';
import urls from './urls.json';

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  variantTitle?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  sku?: string;
  properties?: Record<string, string>;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  email: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  financialStatus: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
  fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled';
  subtotalPrice: number;
  totalTax: number;
  totalShipping: number;
  totalDiscounts: number;
  totalPrice: number;
  currency: string;
  items?: OrderItem[];
  lineItems?: OrderItem[];
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    zip: string;
    phone?: string;
  };
  billingAddress?: {
    firstName?: string;
    lastName?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    zip: string;
    phone?: string;
  };
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Fetch user's orders
 */
export const getUserOrders = async (): Promise<OrdersResponse> => {
  const url = `http://${urls.orders.getUserOrders}`;
  return await callApi(url, {
    method: 'GET',
  });
};

/**
 * Fetch a specific order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order> => {
  const url = `http://${urls.orders.getOne.replace(':id', orderId)}`;
  return await callApi(url, {
    method: 'GET',
  });
};
