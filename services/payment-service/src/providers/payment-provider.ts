// Payment provider interface for abstraction
export interface PaymentProvider {
  name: string;
  
  // Customer management
  createCustomer(params: CreateCustomerParams): Promise<Customer>;
  getCustomer(customerId: string): Promise<Customer>;
  updateCustomer(customerId: string, params: Partial<CreateCustomerParams>): Promise<Customer>;
  
  // Payment methods
  createPaymentMethod(params: CreatePaymentMethodParams): Promise<PaymentMethodResult>;
  attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<PaymentMethodResult>;
  detachPaymentMethod(paymentMethodId: string): Promise<void>;
  
  // Payment processing
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  confirmPaymentIntent(paymentIntentId: string, params?: ConfirmPaymentIntentParams): Promise<PaymentIntentResult>;
  capturePaymentIntent(paymentIntentId: string, amount?: number): Promise<PaymentIntentResult>;
  
  // Refunds
  createRefund(params: CreateRefundParams): Promise<RefundResult>;
  
  // Subscriptions
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>;
  updateSubscription(subscriptionId: string, params: Partial<CreateSubscriptionParams>): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<SubscriptionResult>;
  
  // Webhooks
  verifyWebhook(payload: string, signature: string): Promise<WebhookEvent>;
  
  // Disputes
  getDispute(disputeId: string): Promise<DisputeResult>;
  submitEvidence(disputeId: string, evidence: DisputeEvidence): Promise<DisputeResult>;
}

// Common types
export interface CreateCustomerParams {
  email: string;
  name?: string;
  phone?: string;
  address?: Address;
  metadata?: Record<string, any>;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: Address;
  metadata?: Record<string, any>;
  created: Date;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export interface CreatePaymentMethodParams {
  type: 'card' | 'bank_account';
  card?: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: Address;
  };
}

export interface PaymentMethodResult {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: any;
}

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency: string;
  customer?: string;
  payment_method?: string;
  description?: string;
  metadata?: Record<string, any>;
  capture_method?: 'automatic' | 'manual';
}

export interface PaymentIntentResult {
  id: string;
  client_secret?: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  customer?: string;
  payment_method?: string;
  metadata?: Record<string, any>;
  charges?: any[];
}

export interface ConfirmPaymentIntentParams {
  payment_method?: string;
  return_url?: string;
}

export interface CreateRefundParams {
  payment_intent?: string;
  charge?: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, any>;
}

export interface RefundResult {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  reason?: string;
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionParams {
  customer: string;
  items: Array<{
    price_data?: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
      };
      recurring: {
        interval: 'day' | 'week' | 'month' | 'year';
        interval_count?: number;
      };
      unit_amount: number;
    };
  }>;
  default_payment_method?: string;
  trial_period_days?: number;
  metadata?: Record<string, any>;
}

export interface SubscriptionResult {
  id: string;
  customer: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: Date;
  current_period_end: Date;
  trial_start?: Date;
  trial_end?: Date;
  cancel_at_period_end: boolean;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: Date;
}

export interface DisputeResult {
  id: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  evidence: DisputeEvidence;
  evidence_due_by?: Date;
}

export interface DisputeEvidence {
  customer_communication?: string;
  receipt?: string;
  shipping_documentation?: string;
  duplicate_charge_documentation?: string;
  [key: string]: any;
}

// Mock provider for development/testing
export class MockPaymentProvider implements PaymentProvider {
  name = 'mock';

  async createCustomer(params: CreateCustomerParams): Promise<Customer> {
    return {
      id: `cust_${Math.random().toString(36).substr(2, 9)}`,
      email: params.email,
      name: params.name,
      phone: params.phone,
      address: params.address,
      metadata: params.metadata,
      created: new Date(),
    };
  }

  async getCustomer(customerId: string): Promise<Customer> {
    return {
      id: customerId,
      email: 'mock@example.com',
      created: new Date(),
    };
  }

  async updateCustomer(customerId: string, params: Partial<CreateCustomerParams>): Promise<Customer> {
    return {
      id: customerId,
      email: params.email || 'mock@example.com',
      name: params.name,
      phone: params.phone,
      address: params.address,
      metadata: params.metadata,
      created: new Date(),
    };
  }

  async createPaymentMethod(params: CreatePaymentMethodParams): Promise<PaymentMethodResult> {
    return {
      id: `pm_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      card: params.card ? {
        brand: 'visa',
        last4: params.card.number.slice(-4),
        exp_month: params.card.exp_month,
        exp_year: params.card.exp_year,
      } : undefined,
      billing_details: params.billing_details,
    };
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<PaymentMethodResult> {
    return {
      id: paymentMethodId,
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
      },
    };
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    // Mock implementation
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    return {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: params.amount,
      currency: params.currency,
      status: params.payment_method ? 'requires_confirmation' : 'requires_payment_method',
      customer: params.customer,
      payment_method: params.payment_method,
      metadata: params.metadata,
    };
  }

  async confirmPaymentIntent(paymentIntentId: string, params?: ConfirmPaymentIntentParams): Promise<PaymentIntentResult> {
    return {
      id: paymentIntentId,
      amount: 1000,
      currency: 'usd',
      status: 'succeeded',
      payment_method: params?.payment_method,
    };
  }

  async capturePaymentIntent(paymentIntentId: string, amount?: number): Promise<PaymentIntentResult> {
    return {
      id: paymentIntentId,
      amount: amount || 1000,
      currency: 'usd',
      status: 'succeeded',
    };
  }

  async createRefund(params: CreateRefundParams): Promise<RefundResult> {
    return {
      id: `re_${Math.random().toString(36).substr(2, 9)}`,
      amount: params.amount || 1000,
      currency: 'usd',
      status: 'succeeded',
      reason: params.reason,
      metadata: params.metadata,
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    const now = new Date();
    const monthLater = new Date(now);
    monthLater.setMonth(monthLater.getMonth() + 1);

    return {
      id: `sub_${Math.random().toString(36).substr(2, 9)}`,
      customer: params.customer,
      status: 'active',
      current_period_start: now,
      current_period_end: monthLater,
      cancel_at_period_end: false,
      metadata: params.metadata,
    };
  }

  async updateSubscription(subscriptionId: string, params: Partial<CreateSubscriptionParams>): Promise<SubscriptionResult> {
    const now = new Date();
    const monthLater = new Date(now);
    monthLater.setMonth(monthLater.getMonth() + 1);

    return {
      id: subscriptionId,
      customer: params.customer || 'cust_mock',
      status: 'active',
      current_period_start: now,
      current_period_end: monthLater,
      cancel_at_period_end: false,
      metadata: params.metadata,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    const now = new Date();
    
    return {
      id: subscriptionId,
      customer: 'cust_mock',
      status: 'canceled',
      current_period_start: now,
      current_period_end: now,
      cancel_at_period_end: false,
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<WebhookEvent> {
    return {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      type: 'payment_intent.succeeded',
      data: {
        object: JSON.parse(payload),
      },
      created: new Date(),
    };
  }

  async getDispute(disputeId: string): Promise<DisputeResult> {
    return {
      id: disputeId,
      amount: 1000,
      currency: 'usd',
      reason: 'fraudulent',
      status: 'warning_needs_response',
      evidence: {},
    };
  }

  async submitEvidence(disputeId: string, evidence: DisputeEvidence): Promise<DisputeResult> {
    return {
      id: disputeId,
      amount: 1000,
      currency: 'usd',
      reason: 'fraudulent',
      status: 'warning_under_review',
      evidence,
    };
  }
}