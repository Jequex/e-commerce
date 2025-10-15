import { pgTable, text, integer, decimal, boolean, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Payment methods
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // Reference to user service
  type: text('type').notNull(), // card, bank_account, digital_wallet
  provider: text('provider').notNull(), // stripe, paypal, apple_pay, google_pay, etc.
  
  // Card information (encrypted/tokenized)
  last4: text('last4'), // Last 4 digits for display
  brand: text('brand'), // visa, mastercard, amex, etc.
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  
  // Provider-specific data
  providerCustomerId: text('provider_customer_id'),
  providerPaymentMethodId: text('provider_payment_method_id'),
  
  // Billing address
  billingAddress: jsonb('billing_address').$type<{
    name?: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  }>(),
  
  // Status and metadata
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payment transactions
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id'), // Reference to order service
  userId: uuid('user_id').notNull(),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
  
  // Transaction details
  type: text('type').notNull(), // payment, refund, partial_refund, void, capture
  status: text('status').notNull(), // pending, processing, succeeded, failed, cancelled, requires_action
  
  // Amounts
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  applicationFee: decimal('application_fee', { precision: 10, scale: 2 }),
  
  // Provider details
  provider: text('provider').notNull(), // stripe, paypal, etc.
  providerTransactionId: text('provider_transaction_id'),
  providerCustomerId: text('provider_customer_id'),
  
  // Intent/session IDs for multi-step payments
  paymentIntentId: text('payment_intent_id'),
  clientSecret: text('client_secret'),
  
  // Error handling
  failureCode: text('failure_code'),
  failureMessage: text('failure_message'),
  
  // Metadata and receipt
  description: text('description'),
  receiptEmail: text('receipt_email'),
  receiptUrl: text('receipt_url'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  // Related transactions
  parentTransactionId: uuid('parent_transaction_id'),
  
  // Webhooks and confirmation
  webhookReceived: boolean('webhook_received').default(false),
  isTest: boolean('is_test').default(false),
  
  // Timestamps
  processingStartedAt: timestamp('processing_started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payment disputes/chargebacks
export const paymentDisputes = pgTable('payment_disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').references(() => paymentTransactions.id, { onDelete: 'cascade' }).notNull(),
  
  // Dispute details
  provider: text('provider').notNull(),
  providerDisputeId: text('provider_dispute_id').notNull(),
  reason: text('reason').notNull(), // duplicate, fraudulent, subscription_canceled, etc.
  status: text('status').notNull(), // warning_needs_response, warning_under_review, warning_closed, etc.
  
  // Amounts
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  
  // Evidence and documentation
  evidence: jsonb('evidence').$type<{
    customerCommunication?: string;
    receipt?: string;
    shippingDocumentation?: string;
    duplicateChargeDocumentation?: string;
    [key: string]: any;
  }>(),
  
  // Important dates
  evidenceDueBy: timestamp('evidence_due_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Webhooks from payment providers
export const paymentWebhooks = pgTable('payment_webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  eventType: text('event_type').notNull(),
  eventId: text('event_id').unique().notNull(),
  
  // Processing status
  status: text('status').default('pending'), // pending, processed, failed
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  
  // Webhook data
  payload: jsonb('payload').notNull(),
  signature: text('signature'),
  
  // Processing results
  processedAt: timestamp('processed_at'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Recurring billing/subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
  
  // Subscription details
  provider: text('provider').notNull(),
  providerSubscriptionId: text('provider_subscription_id'),
  status: text('status').notNull(), // active, past_due, canceled, unpaid, etc.
  
  // Billing cycle
  interval: text('interval').notNull(), // day, week, month, year
  intervalCount: integer('interval_count').default(1),
  
  // Pricing
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  
  // Trial period
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  
  // Billing dates
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  
  // Cancellation
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  cancelledAt: timestamp('cancelled_at'),
  
  // Metadata
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Subscription invoices
export const subscriptionInvoices = pgTable('subscription_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(),
  
  // Invoice details
  provider: text('provider').notNull(),
  providerInvoiceId: text('provider_invoice_id'),
  invoiceNumber: text('invoice_number'),
  
  // Status and amounts
  status: text('status').notNull(), // draft, open, paid, uncollectible, void
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).default('0.00'),
  currency: text('currency').default('USD'),
  
  // Dates
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  
  // URLs
  hostedInvoiceUrl: text('hosted_invoice_url'),
  invoicePdf: text('invoice_pdf'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payout records (for marketplace scenarios)
export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull(), // Seller/vendor ID
  
  // Payout details
  provider: text('provider').notNull(),
  providerPayoutId: text('provider_payout_id'),
  status: text('status').notNull(), // pending, in_transit, paid, failed, canceled
  
  // Amounts
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  
  // Banking info
  bankAccount: jsonb('bank_account').$type<{
    last4?: string;
    bankName?: string;
    routingNumber?: string;
  }>(),
  
  // Dates
  estimatedArrival: timestamp('estimated_arrival'),
  arrivalDate: timestamp('arrival_date'),
  
  // Failure details
  failureCode: text('failure_code'),
  failureMessage: text('failure_message'),
  
  // Metadata
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  transactions: many(paymentTransactions),
  subscriptions: many(subscriptions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one, many }) => ({
  paymentMethod: one(paymentMethods, {
    fields: [paymentTransactions.paymentMethodId],
    references: [paymentMethods.id],
  }),
  parent: one(paymentTransactions, {
    fields: [paymentTransactions.parentTransactionId],
    references: [paymentTransactions.id],
  }),
  disputes: many(paymentDisputes),
}));

export const paymentDisputesRelations = relations(paymentDisputes, ({ one }) => ({
  transaction: one(paymentTransactions, {
    fields: [paymentDisputes.transactionId],
    references: [paymentTransactions.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  paymentMethod: one(paymentMethods, {
    fields: [subscriptions.paymentMethodId],
    references: [paymentMethods.id],
  }),
  invoices: many(subscriptionInvoices),
}));

export const subscriptionInvoicesRelations = relations(subscriptionInvoices, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionInvoices.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// TypeScript types
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type PaymentDispute = typeof paymentDisputes.$inferSelect;
export type NewPaymentDispute = typeof paymentDisputes.$inferInsert;
export type PaymentWebhook = typeof paymentWebhooks.$inferSelect;
export type NewPaymentWebhook = typeof paymentWebhooks.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type SubscriptionInvoice = typeof subscriptionInvoices.$inferSelect;
export type NewSubscriptionInvoice = typeof subscriptionInvoices.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;

// Validation schemas
export const createPaymentMethodSchema = z.object({
  type: z.enum(['card', 'bank_account', 'digital_wallet']),
  provider: z.string().min(1),
  billingAddress: z.object({
    name: z.string().optional(),
    address1: z.string().min(1),
    address2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    country: z.string().min(2).max(2),
    postalCode: z.string().min(1),
  }),
  isDefault: z.boolean().default(false),
});

export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  paymentMethodId: z.string().uuid().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string().uuid().optional(),
});

export const refundPaymentSchema = z.object({
  transactionId: z.string().uuid(),
  amount: z.number().positive().optional(), // If not provided, refund full amount
  reason: z.string().optional(),
});

export const createSubscriptionSchema = z.object({
  paymentMethodId: z.string().uuid(),
  interval: z.enum(['day', 'week', 'month', 'year']),
  intervalCount: z.number().int().positive().default(1),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  trialDays: z.number().int().min(0).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Payment status enums
export const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REQUIRES_ACTION: 'requires_action',
} as const;

export const TransactionType = {
  PAYMENT: 'payment',
  REFUND: 'refund',
  PARTIAL_REFUND: 'partial_refund',
  VOID: 'void',
  CAPTURE: 'capture',
} as const;

export const SubscriptionStatus = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
  TRIALING: 'trialing',
} as const;