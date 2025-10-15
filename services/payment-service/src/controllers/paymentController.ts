import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  paymentMethods,
  paymentTransactions,
  paymentWebhooks,
  subscriptions,
  subscriptionInvoices,
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
import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { PaymentProvider, MockPaymentProvider } from '../providers/payment-provider';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
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
}