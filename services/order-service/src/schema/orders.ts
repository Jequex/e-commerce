import { pgTable, text, integer, decimal, boolean, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Orders table
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').unique().notNull(),
  userId: uuid('user_id').notNull(), // Reference to user service
  email: text('email').notNull(),
  status: text('status').notNull().default('pending'), // pending, confirmed, processing, shipped, delivered, cancelled, refunded
  financialStatus: text('financial_status').default('pending'), // pending, authorized, partially_paid, paid, partially_refunded, refunded, voided
  fulfillmentStatus: text('fulfillment_status').default('unfulfilled'), // unfulfilled, partial, fulfilled
  
  // Pricing
  subtotalPrice: decimal('subtotal_price', { precision: 10, scale: 2 }).notNull(),
  totalTax: decimal('total_tax', { precision: 10, scale: 2 }).default('0.00'),
  totalShipping: decimal('total_shipping', { precision: 10, scale: 2 }).default('0.00'),
  totalDiscounts: decimal('total_discounts', { precision: 10, scale: 2 }).default('0.00'),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  
  // Currency and locale
  currency: text('currency').default('USD'),
  locale: text('locale').default('en'),
  
  // Customer information
  customerInfo: jsonb('customer_info').$type<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
  }>(),
  
  // Addresses
  billingAddress: jsonb('billing_address').$type<Address>(),
  shippingAddress: jsonb('shipping_address').$type<Address>(),
  
  // Notes and attributes
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>().default([]),
  attributes: jsonb('attributes').$type<Record<string, any>>(),
  
  // Tracking
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  carrier: text('carrier'),
  
  // Timestamps
  processedAt: timestamp('processed_at'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Order line items
export const orderLineItems = pgTable('order_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').notNull(), // Reference to product service
  variantId: uuid('variant_id'), // Reference to product variant
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  
  // Product info (snapshot at time of order)
  productTitle: text('product_title').notNull(),
  variantTitle: text('variant_title'),
  sku: text('sku'),
  barcode: text('barcode'),
  weight: decimal('weight', { precision: 8, scale: 3 }),
  
  // Fulfillment
  fulfillmentStatus: text('fulfillment_status').default('unfulfilled'),
  fulfillableQuantity: integer('fulfillable_quantity'),
  
  // Properties and customization
  properties: jsonb('properties').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Order transactions (payments, refunds, etc.)
export const orderTransactions = pgTable('order_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  kind: text('kind').notNull(), // sale, refund, capture, void, authorization
  gateway: text('gateway').notNull(), // stripe, paypal, etc.
  status: text('status').notNull(), // pending, success, failure, error, cancelled
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  
  // Gateway-specific data
  gatewayTransactionId: text('gateway_transaction_id'),
  parentId: uuid('parent_id'), // Reference to parent transaction for refunds
  
  // Additional info
  message: text('message'),
  errorCode: text('error_code'),
  receipt: jsonb('receipt').$type<Record<string, any>>(),
  
  // Test mode flag
  isTest: boolean('is_test').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Order fulfillments
export const orderFulfillments = pgTable('order_fulfillments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').default('pending'), // pending, open, success, cancelled, error, failure
  
  // Tracking info
  trackingNumber: text('tracking_number'),
  trackingUrls: jsonb('tracking_urls').$type<string[]>(),
  carrier: text('carrier'),
  service: text('service'),
  
  // Shipping info
  shipmentStatus: text('shipment_status'), // label_printed, in_transit, out_for_delivery, delivered, exception
  estimatedDelivery: timestamp('estimated_delivery'),
  actualDelivery: timestamp('actual_delivery'),
  
  // Location info
  originAddress: jsonb('origin_address').$type<Address>(),
  destinationAddress: jsonb('destination_address').$type<Address>(),
  
  // Notification settings
  notifyCustomer: boolean('notify_customer').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Fulfillment line items
export const fulfillmentLineItems = pgTable('fulfillment_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  fulfillmentId: uuid('fulfillment_id').references(() => orderFulfillments.id, { onDelete: 'cascade' }).notNull(),
  lineItemId: uuid('line_item_id').references(() => orderLineItems.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Order discounts
export const orderDiscounts = pgTable('order_discounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  
  code: text('code'),
  type: text('type').notNull(), // percentage, fixed_amount, shipping
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  
  title: text('title').notNull(),
  description: text('description'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Order history/events
export const orderEvents = pgTable('order_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  
  eventType: text('event_type').notNull(), // created, updated, paid, shipped, delivered, cancelled, etc.
  description: text('description'),
  
  // Actor information
  actorId: uuid('actor_id'), // User who performed the action
  actorType: text('actor_type'), // user, admin, system
  
  // Previous and new values for updates
  previousValues: jsonb('previous_values').$type<Record<string, any>>(),
  newValues: jsonb('new_values').$type<Record<string, any>>(),
  
  // Additional metadata
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Shopping cart (for order creation)
export const shoppingCarts = pgTable('shopping_carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'), // Can be null for guest carts
  sessionId: text('session_id'), // For guest users
  
  // Cart metadata
  currency: text('currency').default('USD'),
  locale: text('locale').default('en'),
  
  // Totals
  itemCount: integer('item_count').default(0),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0.00'),
  
  // Timestamps
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Cart line items
export const cartLineItems = pgTable('cart_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').references(() => shoppingCarts.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').notNull(),
  variantId: uuid('variant_id'),
  
  quantity: integer('quantity').notNull(),
  
  // Properties for customization
  properties: jsonb('properties').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const ordersRelations = relations(orders, ({ many }) => ({
  lineItems: many(orderLineItems),
  transactions: many(orderTransactions),
  fulfillments: many(orderFulfillments),
  discounts: many(orderDiscounts),
  events: many(orderEvents),
}));

export const orderLineItemsRelations = relations(orderLineItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderLineItems.orderId],
    references: [orders.id],
  }),
  fulfillmentItems: many(fulfillmentLineItems),
}));

export const orderTransactionsRelations = relations(orderTransactions, ({ one }) => ({
  order: one(orders, {
    fields: [orderTransactions.orderId],
    references: [orders.id],
  }),
  parent: one(orderTransactions, {
    fields: [orderTransactions.parentId],
    references: [orderTransactions.id],
  }),
}));

export const orderFulfillmentsRelations = relations(orderFulfillments, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderFulfillments.orderId],
    references: [orders.id],
  }),
  lineItems: many(fulfillmentLineItems),
}));

export const fulfillmentLineItemsRelations = relations(fulfillmentLineItems, ({ one }) => ({
  fulfillment: one(orderFulfillments, {
    fields: [fulfillmentLineItems.fulfillmentId],
    references: [orderFulfillments.id],
  }),
  lineItem: one(orderLineItems, {
    fields: [fulfillmentLineItems.lineItemId],
    references: [orderLineItems.id],
  }),
}));

export const orderDiscountsRelations = relations(orderDiscounts, ({ one }) => ({
  order: one(orders, {
    fields: [orderDiscounts.orderId],
    references: [orders.id],
  }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
}));

export const shoppingCartsRelations = relations(shoppingCarts, ({ many }) => ({
  lineItems: many(cartLineItems),
}));

export const cartLineItemsRelations = relations(cartLineItems, ({ one }) => ({
  cart: one(shoppingCarts, {
    fields: [cartLineItems.cartId],
    references: [shoppingCarts.id],
  }),
}));

// TypeScript types
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderLineItem = typeof orderLineItems.$inferSelect;
export type NewOrderLineItem = typeof orderLineItems.$inferInsert;
export type OrderTransaction = typeof orderTransactions.$inferSelect;
export type NewOrderTransaction = typeof orderTransactions.$inferInsert;
export type OrderFulfillment = typeof orderFulfillments.$inferSelect;
export type NewOrderFulfillment = typeof orderFulfillments.$inferInsert;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type NewOrderEvent = typeof orderEvents.$inferInsert;
export type ShoppingCart = typeof shoppingCarts.$inferSelect;
export type NewShoppingCart = typeof shoppingCarts.$inferInsert;
export type CartLineItem = typeof cartLineItems.$inferSelect;
export type NewCartLineItem = typeof cartLineItems.$inferInsert;

// Address interface
export interface Address {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip: string;
  phone?: string;
}

// Validation schemas
export const addressSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  company: z.string().optional(),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  province: z.string().optional(),
  country: z.string().min(2).max(2), // Country code
  zip: z.string().min(1),
  phone: z.string().optional(),
});

export const createOrderSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  lineItems: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    properties: z.record(z.string()).optional(),
  })).min(1),
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  customerInfo: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
  }).optional(),
  discounts: z.array(z.object({
    code: z.string().optional(),
    type: z.enum(['percentage', 'fixed_amount', 'shipping']),
    value: z.number(),
    title: z.string(),
    description: z.string().optional(),
  })).default([]),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  carrier: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  properties: z.record(z.string()).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0), // 0 to remove item
  properties: z.record(z.string()).optional(),
});

// Order status enums
export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const FinancialStatus = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  PARTIALLY_REFUNDED: 'partially_refunded',
  REFUNDED: 'refunded',
  VOIDED: 'voided',
} as const;

export const FulfillmentStatus = {
  UNFULFILLED: 'unfulfilled',
  PARTIAL: 'partial',
  FULFILLED: 'fulfilled',
} as const;