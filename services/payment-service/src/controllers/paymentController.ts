import { Request, Response } from 'express';
import { db } from '../config/database';
import { ordersClient } from '../config/orders-db';
import { 
  paymentMethods,
  paymentTransactions,
  paymentWebhooks,
  subscriptions,
  subscriptionInvoices,
  storePayoutSettings,
  payoutBatches,
  storePayouts,
  saveBankDetailsSchema,
  type PaymentMethod,
  type PaymentTransaction,
  createPaymentMethodSchema,
  createPaymentIntentSchema,
  confirmPaymentSchema,
  refundPaymentSchema,
  createSubscriptionSchema,
  PaymentStatus,
  TransactionType
} from '../schema/payments';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { PaymentProvider, MockPaymentProvider } from '../providers/payment-provider';
import { paystackProvider } from '../providers/paystack-provider';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    storeId?: string;
  };
}

export class PaymentController {
  private paymentProvider: PaymentProvider;

  constructor() {
    // In production, you would initialize different providers based on configuration
    // For now, using mock provider
    this.paymentProvider = new MockPaymentProvider();
  }

  // Get or create customer in payment provider
  private async getOrCreateCustomer(userId: string, email: string) {
    // Check if we have a customer ID stored for this user
    // In a real implementation, you'd store this in a user_payment_profiles table
    
    // For now, create a new customer each time (in production, cache this)
    const customer = await this.paymentProvider.createCustomer({
      email,
      metadata: { userId }
    });

    return customer;
  }

  // Add payment method
  async addPaymentMethod(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = createPaymentMethodSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // Create customer in payment provider if needed
      const customer = await this.getOrCreateCustomer(req.user.id, req.user.email);

      // Create payment method with provider
      // Note: In a real implementation, you'd handle the secure tokenization
      // This is just a mock for demonstration
      const paymentMethod = await this.paymentProvider.createPaymentMethod({
        type: validatedData.type as any,
        billing_details: {
          address: {
            line1: validatedData.billingAddress.address1,
            line2: validatedData.billingAddress.address2,
            city: validatedData.billingAddress.city,
            state: validatedData.billingAddress.state,
            postal_code: validatedData.billingAddress.postalCode,
            country: validatedData.billingAddress.country,
          }
        }
      });

      // Attach to customer
      await this.paymentProvider.attachPaymentMethod(paymentMethod.id, customer.id);

      // If this is the default payment method, update others
      if (validatedData.isDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false })
          .where(eq(paymentMethods.userId, req.user.id));
      }

      // Store in our database
      const [savedPaymentMethod] = await db.insert(paymentMethods).values({
        id: uuidv4(),
        userId: req.user.id,
        type: validatedData.type,
        provider: this.paymentProvider.name,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year,
        providerCustomerId: customer.id,
        providerPaymentMethodId: paymentMethod.id,
        billingAddress: validatedData.billingAddress,
        isDefault: validatedData.isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      res.status(201).json({
        message: 'Payment method added successfully',
        paymentMethod: {
          ...savedPaymentMethod,
          // Don't return sensitive data
          providerPaymentMethodId: undefined,
          providerCustomerId: undefined,
        }
      });

    } catch (error) {
      console.error('Add payment method error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get user's payment methods
  async getPaymentMethods(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const userPaymentMethods = await db.query.paymentMethods.findMany({
        where: and(
          eq(paymentMethods.userId, req.user.id),
          eq(paymentMethods.isActive, true)
        ),
        orderBy: [desc(paymentMethods.isDefault), desc(paymentMethods.createdAt)]
      });

      // Remove sensitive data
      const sanitizedPaymentMethods = userPaymentMethods.map(pm => ({
        ...pm,
        providerPaymentMethodId: undefined,
        providerCustomerId: undefined,
      }));

      res.json({
        paymentMethods: sanitizedPaymentMethods
      });

    } catch (error) {
      console.error('Get payment methods error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Delete payment method
  async deletePaymentMethod(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // Get payment method and verify ownership
      const paymentMethod = await db.query.paymentMethods.findFirst({
        where: and(
          eq(paymentMethods.id, id),
          eq(paymentMethods.userId, req.user.id),
          eq(paymentMethods.isActive, true)
        )
      });

      if (!paymentMethod) {
        return res.status(404).json({
          error: 'Payment method not found',
          code: 'PAYMENT_METHOD_NOT_FOUND'
        });
      }

      // Detach from payment provider
      if (paymentMethod.providerPaymentMethodId) {
        await this.paymentProvider.detachPaymentMethod(paymentMethod.providerPaymentMethodId);
      }

      // Soft delete in our database
      await db
        .update(paymentMethods)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(paymentMethods.id, id));

      res.json({
        message: 'Payment method deleted successfully'
      });

    } catch (error) {
      console.error('Delete payment method error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Create payment intent
  async createPaymentIntent(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = createPaymentIntentSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // Get customer
      const customer = await this.getOrCreateCustomer(req.user.id, req.user.email);

      // Get payment method if provided
      let paymentMethodId: string | undefined;
      if (validatedData.paymentMethodId) {
        const paymentMethod = await db.query.paymentMethods.findFirst({
          where: and(
            eq(paymentMethods.id, validatedData.paymentMethodId),
            eq(paymentMethods.userId, req.user.id),
            eq(paymentMethods.isActive, true)
          )
        });

        if (!paymentMethod) {
          return res.status(404).json({
            error: 'Payment method not found',
            code: 'PAYMENT_METHOD_NOT_FOUND'
          });
        }

        paymentMethodId = paymentMethod.providerPaymentMethodId;
      }

      // Create payment intent with provider
      const paymentIntent = await this.paymentProvider.createPaymentIntent({
        amount: Math.round(validatedData.amount * 100), // Convert to cents
        currency: validatedData.currency,
        customer: customer.id,
        payment_method: paymentMethodId,
        description: validatedData.description,
        metadata: {
          orderId: validatedData.orderId,
          userId: req.user.id,
          ...validatedData.metadata
        }
      });

      // Store transaction record
      const [transaction] = await db.insert(paymentTransactions).values({
        id: uuidv4(),
        orderId: validatedData.orderId,
        userId: req.user.id,
        paymentMethodId: validatedData.paymentMethodId,
        type: TransactionType.PAYMENT,
        status: PaymentStatus.PENDING,
        amount: validatedData.amount.toFixed(2),
        currency: validatedData.currency,
        provider: this.paymentProvider.name,
        providerCustomerId: customer.id,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        description: validatedData.description,
        metadata: validatedData.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      res.status(201).json({
        message: 'Payment intent created successfully',
        transaction: {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          clientSecret: transaction.clientSecret,
        }
      });

    } catch (error) {
      console.error('Create payment intent error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Confirm payment
  async confirmPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = confirmPaymentSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // Get transaction
      const transaction = await db.query.paymentTransactions.findFirst({
        where: and(
          eq(paymentTransactions.paymentIntentId, validatedData.paymentIntentId),
          eq(paymentTransactions.userId, req.user.id)
        )
      });

      if (!transaction) {
        return res.status(404).json({
          error: 'Payment intent not found',
          code: 'PAYMENT_INTENT_NOT_FOUND'
        });
      }

      // Get payment method ID if provided
      let paymentMethodId: string | undefined;
      if (validatedData.paymentMethodId) {
        const paymentMethod = await db.query.paymentMethods.findFirst({
          where: and(
            eq(paymentMethods.id, validatedData.paymentMethodId),
            eq(paymentMethods.userId, req.user.id)
          )
        });

        if (paymentMethod) {
          paymentMethodId = paymentMethod.providerPaymentMethodId;
        }
      }

      // Confirm with payment provider
      const confirmedPayment = await this.paymentProvider.confirmPaymentIntent(
        validatedData.paymentIntentId,
        { payment_method: paymentMethodId }
      );

      // Update transaction status
      const [updatedTransaction] = await db
        .update(paymentTransactions)
        .set({
          status: confirmedPayment.status as any,
          completedAt: confirmedPayment.status === 'succeeded' ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, transaction.id))
        .returning();

      res.json({
        message: 'Payment confirmed successfully',
        transaction: {
          id: updatedTransaction.id,
          status: updatedTransaction.status,
          amount: updatedTransaction.amount,
          currency: updatedTransaction.currency,
        }
      });

    } catch (error) {
      console.error('Confirm payment error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Create refund
  async createRefund(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = refundPaymentSchema.parse(req.body);

      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      // Get original transaction
      const originalTransaction = await db.query.paymentTransactions.findFirst({
        where: eq(paymentTransactions.id, validatedData.transactionId)
      });

      if (!originalTransaction || originalTransaction.type !== TransactionType.PAYMENT) {
        return res.status(404).json({
          error: 'Payment transaction not found',
          code: 'TRANSACTION_NOT_FOUND'
        });
      }

      if (originalTransaction.status !== PaymentStatus.SUCCEEDED) {
        return res.status(400).json({
          error: 'Can only refund successful payments',
          code: 'INVALID_TRANSACTION_STATUS'
        });
      }

      const refundAmount = validatedData.amount || parseFloat(originalTransaction.amount);

      // Create refund with provider
      const refund = await this.paymentProvider.createRefund({
        payment_intent: originalTransaction.paymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: validatedData.reason as any,
        metadata: {
          originalTransactionId: originalTransaction.id,
          adminId: req.user?.id,
        }
      });

      // Create refund transaction record
      const [refundTransaction] = await db.insert(paymentTransactions).values({
        id: uuidv4(),
        orderId: originalTransaction.orderId,
        userId: originalTransaction.userId,
        type: refundAmount < parseFloat(originalTransaction.amount) ? TransactionType.PARTIAL_REFUND : TransactionType.REFUND,
        status: refund.status as any,
        amount: refundAmount.toFixed(2),
        currency: originalTransaction.currency,
        provider: originalTransaction.provider,
        providerTransactionId: refund.id,
        parentTransactionId: originalTransaction.id,
        description: `Refund for transaction ${originalTransaction.id}`,
        completedAt: refund.status === 'succeeded' ? new Date() : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      res.status(201).json({
        message: 'Refund created successfully',
        refund: {
          id: refundTransaction.id,
          amount: refundTransaction.amount,
          status: refundTransaction.status,
          originalTransactionId: originalTransaction.id,
        }
      });

    } catch (error) {
      console.error('Create refund error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get user's payment history
  async getPaymentHistory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const transactions = await db.query.paymentTransactions.findMany({
        where: eq(paymentTransactions.userId, req.user.id),
        orderBy: desc(paymentTransactions.createdAt),
        limit: limitNum,
        offset: offset,
      });

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.userId, req.user.id));

      const totalPages = Math.ceil(count / limitNum);

      // Sanitize transactions (remove sensitive data)
      const sanitizedTransactions = transactions.map(tx => ({
        id: tx.id,
        orderId: tx.orderId,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description,
        createdAt: tx.createdAt,
        completedAt: tx.completedAt,
      }));

      res.json({
        transactions: sanitizedTransactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      });

    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Handle webhooks from payment providers
  async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      // Verify webhook with payment provider
      const event = await this.paymentProvider.verifyWebhook(
        typeof payload === 'string' ? payload : JSON.stringify(payload),
        signature
      );

      // Store webhook event
      await db.insert(paymentWebhooks).values({
        id: uuidv4(),
        provider: this.paymentProvider.name,
        eventType: event.type,
        eventId: event.id,
        payload: event.data.object,
        signature,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Process the event
      await this.processWebhookEvent(event);

      res.json({ received: true });

    } catch (error) {
      console.error('Webhook error:', error);
      
      // Log failed webhook for retry
      await db.insert(paymentWebhooks).values({
        id: uuidv4(),
        provider: this.paymentProvider.name,
        eventType: 'unknown',
        eventId: `failed_${Date.now()}`,
        status: 'failed',
        payload: req.body,
        signature: req.headers['stripe-signature'] as string,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(400).json({
        error: 'Webhook processing failed',
        code: 'WEBHOOK_ERROR'
      });
    }
  }

  // Process webhook events
  private async processWebhookEvent(event: any) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handleSubscriptionPayment(event.data.object);
        break;
      // Add more event types as needed
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    // Update transaction status
    await db
      .update(paymentTransactions)
      .set({
        status: PaymentStatus.SUCCEEDED,
        webhookReceived: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.paymentIntentId, paymentIntent.id));
  }

  private async handlePaymentFailure(paymentIntent: any) {
    // Update transaction status
    await db
      .update(paymentTransactions)
      .set({
        status: PaymentStatus.FAILED,
        webhookReceived: true,
        failureCode: paymentIntent.last_payment_error?.code,
        failureMessage: paymentIntent.last_payment_error?.message,
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.paymentIntentId, paymentIntent.id));
  }

  private async handleSubscriptionPayment(invoice: any) {
    // Handle subscription payment success
    // This would update subscription status, create invoice records, etc.
    console.log('Subscription payment succeeded:', invoice.id);
  }

  // ==========================================
  // PAYSTACK & AUTOMATIC WEEKLY PAYOUT METHODS
  // ==========================================

  /**
   * Get supported banks list
   */
  async getBankList(req: Request, res: Response) {
    try {
      const banks = await paystackProvider.getBankList();
      res.json({
        success: true,
        data: banks,
      });
    } catch (error: any) {
      console.error('Error fetching bank list:', error);
      res.status(500).json({
        error: 'Failed to retrieve bank list',
        details: error.message,
      });
    }
  }

  /**
   * Resolve bank account number and bank code via Paystack
   */
  async resolveBankAccount(req: Request, res: Response) {
    try {
      const accountNumber = req.query.accountNumber as string;
      const bankCode = req.query.bankCode as string;

      if (!accountNumber || !bankCode) {
        return res.status(400).json({
          error: 'accountNumber and bankCode are required',
        });
      }

      const result = await paystackProvider.resolveAccountNumber(accountNumber, bankCode);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Account resolution error:', error);
      res.status(400).json({
        error: error.message || 'Failed to verify account details',
      });
    }
  }

  /**
   * Get store payout / bank settings
   */
  async getStoreBankDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const storeId = (req.query.storeId as string) || req.user?.storeId;

      if (!storeId) {
        return res.status(400).json({
          error: 'Store ID is required',
        });
      }

      const [settings] = await db
        .select()
        .from(storePayoutSettings)
        .where(eq(storePayoutSettings.storeId, storeId));

      res.json({
        success: true,
        data: settings || null,
      });
    } catch (error: any) {
      console.error('Error fetching store bank details:', error);
      res.status(500).json({
        error: 'Failed to retrieve store bank settings',
        details: error.message,
      });
    }
  }

  /**
   * Save store bank details and create Paystack transfer recipient
   */
  async saveStoreBankDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const storeId = req.body.storeId || req.user?.storeId;
      const isValidUuid = (val?: string) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const adminId = isValidUuid(req.user?.id) ? req.user!.id : '00000000-0000-0000-0000-000000000001';

      if (!storeId || !isValidUuid(storeId)) {
        return res.status(400).json({
          error: 'Valid Store UUID is required',
        });
      }

      const { bankCode, bankName, accountNumber, accountName } = saveBankDetailsSchema.parse(req.body);

      // Create Paystack recipient
      const recipientRes = await paystackProvider.createTransferRecipient(
        accountName,
        accountNumber,
        bankCode,
        'NGN'
      );

      // Check if store settings already exist
      const [existing] = await db
        .select()
        .from(storePayoutSettings)
        .where(eq(storePayoutSettings.storeId, storeId));

      let result;
      if (existing) {
        [result] = await db
          .update(storePayoutSettings)
          .set({
            adminId,
            bankCode,
            bankName,
            accountNumber,
            accountName,
            paystackRecipientCode: recipientRes.recipient_code,
            isVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(storePayoutSettings.id, existing.id))
          .returning();
      } else {
        [result] = await db
          .insert(storePayoutSettings)
          .values({
            storeId,
            adminId,
            bankCode,
            bankName,
            accountNumber,
            accountName,
            paystackRecipientCode: recipientRes.recipient_code,
            isVerified: true,
            currency: 'NGN',
          })
          .returning();
      }

      res.json({
        success: true,
        message: 'Bank details saved and verified successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error saving store bank details:', error);
      res.status(400).json({
        error: error.message || 'Failed to save bank details',
      });
    }
  }

  /**
   * Get store payout overview (pending balance, pending orders count, next payout date, history)
   */
  async getStorePayoutOverview(req: AuthenticatedRequest, res: Response) {
    try {
      const storeId = (req.query.storeId as string) || req.user?.storeId;

      if (!storeId) {
        return res.status(400).json({
          error: 'Store ID is required',
        });
      }

      // 1. Fetch store bank settings
      const [bankSettings] = await db
        .select()
        .from(storePayoutSettings)
        .where(eq(storePayoutSettings.storeId, storeId));

      // 2. Fetch fulfilled orders pending payout from orders database
      let pendingOrders: any[] = [];
      try {
        pendingOrders = await ordersClient`
          SELECT 
            id, 
            order_number, 
            subtotal_price, 
            total_price, 
            platform_markup_amount, 
            super_admin_discount_amount, 
            admin_discount_amount, 
            platform_net_profit, 
            store_net_payout, 
            status, 
            financial_status, 
            fulfillment_status, 
            created_at
          FROM orders
          WHERE store_id = ${storeId}
            AND (payout_status = 'pending' OR payout_status IS NULL)
            AND (fulfillment_status IN ('fulfilled', 'shipped', 'delivered') OR status = 'confirmed')
          ORDER BY created_at DESC
        `;
      } catch (err: any) {
        console.warn('Could not query orders database directly:', err.message);
      }

      const pendingBalance = pendingOrders.reduce((sum, o) => {
        const payout = Number(o.store_net_payout !== null ? o.store_net_payout : (o.subtotal_price || 0));
        return sum + (payout > 0 ? payout : 0);
      }, 0);

      // 3. Calculate next Monday
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
      const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7;
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
      nextMonday.setHours(9, 0, 0, 0);

      // 4. Fetch recent payout history
      const recentPayouts = await db
        .select()
        .from(storePayouts)
        .where(eq(storePayouts.storeId, storeId))
        .orderBy(desc(storePayouts.createdAt))
        .limit(20);

      res.json({
        success: true,
        data: {
          storeId,
          bankDetailsConfigured: !!(bankSettings && bankSettings.isVerified),
          bankSettings: bankSettings || null,
          pendingBalance: Number(pendingBalance.toFixed(2)),
          pendingOrdersCount: pendingOrders.length,
          pendingOrders,
          nextPayoutDate: nextMonday.toISOString(),
          recentPayouts,
        },
      });
    } catch (error: any) {
      console.error('Error fetching store payout overview:', error);
      res.status(500).json({
        error: 'Failed to retrieve payout overview',
        details: error.message,
      });
    }
  }

  /**
   * Process weekly payouts (Triggered on Mondays automatically, or manually by Super Admin)
   */
  async processWeeklyPayouts(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('⚡ Starting Weekly Payout Execution...');

      // 1. Query all fulfilled orders pending payout across all stores
      let eligibleOrders: any[] = [];
      try {
        eligibleOrders = await ordersClient`
          SELECT 
            id, 
            order_number, 
            store_id, 
            subtotal_price, 
            platform_markup_amount, 
            admin_discount_amount, 
            store_net_payout, 
            fulfillment_status, 
            financial_status
          FROM orders
          WHERE (payout_status = 'pending' OR payout_status IS NULL)
            AND (fulfillment_status IN ('fulfilled', 'shipped', 'delivered') OR status = 'confirmed')
            AND store_id IS NOT NULL
        `;
      } catch (err: any) {
        console.error('Failed to query orders for weekly payout:', err);
        return res.status(500).json({
          error: 'Failed to query orders database for payout calculation',
          details: err.message,
        });
      }

      if (eligibleOrders.length === 0) {
        return res.json({
          success: true,
          message: 'No eligible orders found for weekly payout run.',
          batch: null,
          payouts: [],
        });
      }

      // 2. Group orders by store_id
      const ordersByStore = new Map<string, any[]>();
      for (const order of eligibleOrders) {
        const storeId = order.store_id;
        if (!ordersByStore.has(storeId)) {
          ordersByStore.set(storeId, []);
        }
        ordersByStore.get(storeId)!.push(order);
      }

      // 3. Create Payout Batch
      const batchNumber = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const [batch] = await db
        .insert(payoutBatches)
        .values({
          batchNumber,
          scheduledDate: new Date().toISOString().slice(0, 10),
          status: 'processing',
          totalPayoutAmount: '0.00',
          totalStoresCount: ordersByStore.size,
        })
        .returning();

      let totalBatchAmount = 0;
      let successfulPayoutsCount = 0;
      const createdPayouts: any[] = [];

      // 4. Process payout for each store
      for (const [storeId, storeOrders] of ordersByStore.entries()) {
        const storeTotal = storeOrders.reduce((sum, o) => {
          const val = Number(o.store_net_payout !== null ? o.store_net_payout : (o.subtotal_price || 0));
          return sum + (val > 0 ? val : 0);
        }, 0);

        if (storeTotal <= 0) {
          continue;
        }

        // Fetch store bank details
        const [bankSettings] = await db
          .select()
          .from(storePayoutSettings)
          .where(eq(storePayoutSettings.storeId, storeId));

        const orderIds = storeOrders.map(o => o.id);
        const payoutRef = `PAY-${storeId.slice(0, 8)}-${Date.now()}`;

        if (!bankSettings || !bankSettings.paystackRecipientCode) {
          // Store has no verified bank details - record failed / withheld payout
          const [failedPayout] = await db
            .insert(storePayouts)
            .values({
              batchId: batch.id,
              storeId,
              adminId: bankSettings?.adminId || null,
              amount: storeTotal.toFixed(2),
              currency: 'NGN',
              orderIds,
              paystackReference: payoutRef,
              status: 'failed',
              failureReason: 'Store has not configured bank details for payouts',
              bankName: bankSettings?.bankName || 'Not configured',
              accountNumber: bankSettings?.accountNumber || 'Not configured',
              accountName: bankSettings?.accountName || 'Not configured',
            })
            .returning();

          createdPayouts.push(failedPayout);
          continue;
        }

        try {
          // Execute transfer via Paystack
          const transferRes = await paystackProvider.initiateTransfer(
            bankSettings.paystackRecipientCode,
            storeTotal,
            payoutRef,
            `Jequex Weekly Payout for Store ${storeId.slice(0, 8)}`,
            bankSettings.currency || 'NGN'
          );

          const isSuccess = transferRes.status !== 'failed';

          const [payoutRecord] = await db
            .insert(storePayouts)
            .values({
              batchId: batch.id,
              storeId,
              adminId: bankSettings.adminId,
              amount: storeTotal.toFixed(2),
              currency: bankSettings.currency || 'NGN',
              orderIds,
              paystackTransferCode: transferRes.transfer_code,
              paystackReference: payoutRef,
              status: isSuccess ? 'successful' : 'failed',
              bankName: bankSettings.bankName,
              accountNumber: bankSettings.accountNumber,
              accountName: bankSettings.accountName,
            })
            .returning();

          createdPayouts.push(payoutRecord);

          if (isSuccess) {
            totalBatchAmount += storeTotal;
            successfulPayoutsCount++;

            // Update order payout status in orders database
            await ordersClient`
              UPDATE orders
              SET 
                payout_status = 'paid',
                payout_id = ${payoutRecord.id},
                payout_batch_id = ${batch.id},
                paid_out_at = NOW()
              WHERE id IN ${ordersClient(orderIds)}
            `;
          }
        } catch (transferErr: any) {
          console.error(`Transfer failed for store ${storeId}:`, transferErr);
          const [failedRecord] = await db
            .insert(storePayouts)
            .values({
              batchId: batch.id,
              storeId,
              adminId: bankSettings.adminId,
              amount: storeTotal.toFixed(2),
              currency: 'NGN',
              orderIds,
              paystackReference: payoutRef,
              status: 'failed',
              failureReason: transferErr.message,
              bankName: bankSettings.bankName,
              accountNumber: bankSettings.accountNumber,
              accountName: bankSettings.accountName,
            })
            .returning();

          createdPayouts.push(failedRecord);
        }
      }

      // 5. Update batch completion
      const [updatedBatch] = await db
        .update(payoutBatches)
        .set({
          status: 'completed',
          totalPayoutAmount: totalBatchAmount.toFixed(2),
          totalStoresCount: successfulPayoutsCount,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payoutBatches.id, batch.id))
        .returning();

      res.json({
        success: true,
        message: `Weekly payout run processed. ${successfulPayoutsCount} stores paid totaling ₦${totalBatchAmount.toLocaleString()}.`,
        batch: updatedBatch,
        payouts: createdPayouts,
      });
    } catch (error: any) {
      console.error('Error in processWeeklyPayouts:', error);
      res.status(500).json({
        error: 'Failed to process weekly payouts',
        details: error.message,
      });
    }
  }

  /**
   * Super Admin: Get all payout batches and summaries
   */
  async getAllPayoutBatches(req: Request, res: Response) {
    try {
      const batches = await db
        .select()
        .from(payoutBatches)
        .orderBy(desc(payoutBatches.createdAt))
        .limit(50);

      const allPayouts = await db
        .select()
        .from(storePayouts)
        .orderBy(desc(storePayouts.createdAt))
        .limit(100);

      // Also get current pending liabilities (fulfilled orders not yet paid)
      let pendingLiabilities: any = { totalPendingAmount: 0, pendingStoresCount: 0 };
      try {
        const pendingSummary = await ordersClient`
          SELECT 
            COUNT(DISTINCT store_id) as stores_count,
            COALESCE(SUM(COALESCE(store_net_payout, subtotal_price, 0)), 0) as total_pending
          FROM orders
          WHERE (payout_status = 'pending' OR payout_status IS NULL)
            AND (fulfillment_status IN ('fulfilled', 'shipped', 'delivered') OR status = 'confirmed')
            AND store_id IS NOT NULL
        `;
        if (pendingSummary && pendingSummary[0]) {
          pendingLiabilities = {
            totalPendingAmount: Number(pendingSummary[0].total_pending || 0),
            pendingStoresCount: Number(pendingSummary[0].stores_count || 0),
          };
        }
      } catch (err: any) {
        console.warn('Pending liabilities query error:', err.message);
      }

      res.json({
        success: true,
        data: {
          batches,
          payouts: allPayouts,
          pendingLiabilities,
        },
      });
    } catch (error: any) {
      console.error('Error fetching all payout batches:', error);
      res.status(500).json({
        error: 'Failed to retrieve payout batches',
        details: error.message,
      });
    }
  }

  /**
   * Initialize Paystack customer payment
   */
  async initializePaystackPayment(req: Request, res: Response) {
    try {
      const { email, amount, orderId, callbackUrl, storeId } = req.body;

      if (!email || !amount) {
        return res.status(400).json({
          error: 'email and amount are required',
        });
      }

      const reference = `ORD-${orderId ? orderId.slice(0, 8) : Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const paystackRes = await paystackProvider.initializePayment(
        email,
        Number(amount),
        reference,
        callbackUrl,
        { orderId, storeId }
      );

      // Record transaction
      await db.insert(paymentTransactions).values({
        id: uuidv4(),
        orderId: orderId || null,
        userId: 'anonymous-customer',
        storeId: storeId || null,
        type: 'payment',
        status: 'pending',
        amount: Number(amount).toFixed(2),
        currency: 'NGN',
        provider: 'paystack',
        providerReference: reference,
        customerEmail: email,
        metadata: { callbackUrl, orderId, storeId },
      });

      res.json({
        success: true,
        data: paystackRes,
      });
    } catch (error: any) {
      console.error('Error initializing Paystack payment:', error);
      res.status(500).json({
        error: 'Failed to initialize payment',
        details: error.message,
      });
    }
  }

  /**
   * Verify Paystack payment transaction and mark order as paid
   */
  async verifyPaystackPayment(req: Request, res: Response) {
    try {
      const reference = (req.params.reference || req.query.reference) as string;

      if (!reference) {
        return res.status(400).json({
          error: 'Transaction reference is required',
        });
      }

      const verification = await paystackProvider.verifyPayment(reference);

      if (verification.status === 'success') {
        // Update transaction in payments database
        await db
          .update(paymentTransactions)
          .set({
            status: 'succeeded',
            updatedAt: new Date(),
          })
          .where(eq(paymentTransactions.providerReference, reference));

        // If orderId is available in metadata or transaction, update order status
        const [tx] = await db
          .select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.providerReference, reference));

        if (tx && tx.orderId) {
          try {
            await ordersClient`
              UPDATE orders
              SET 
                financial_status = 'paid',
                status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
                updated_at = NOW()
              WHERE id = ${tx.orderId}
            `;
          } catch (err: any) {
            console.warn('Could not update order financial status:', err.message);
          }
        }
      }

      res.json({
        success: true,
        data: verification,
      });
    } catch (error: any) {
      console.error('Error verifying Paystack payment:', error);
      res.status(500).json({
        error: 'Failed to verify payment',
        details: error.message,
      });
    }
  }
}
