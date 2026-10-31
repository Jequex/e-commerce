import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authMiddleware, requireAdmin, requireSuperAdmin, requireCustomer } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const paymentController = new PaymentController();

// Rate limiting for payment operations
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    error: 'Too many payment attempts, please try again later',
    code: 'TOO_MANY_PAYMENTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many webhook requests',
    code: 'TOO_MANY_WEBHOOKS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint (no auth)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoints (no auth required)
router.post('/webhook/stripe', webhookLimiter, paymentController.handleWebhook.bind(paymentController));
router.post('/webhook/paystack', webhookLimiter, (req, res) => {
  // Paystack event webhook acknowledgment
  res.status(200).json({ received: true });
});

// Public Paystack customer endpoints
router.get('/paystack/banks', paymentController.getBankList.bind(paymentController));
router.get('/paystack/resolve-account', paymentController.resolveBankAccount.bind(paymentController));
router.post('/paystack/initialize', paymentLimiter, paymentController.initializePaystackPayment.bind(paymentController));
router.get('/paystack/verify/:reference', paymentController.verifyPaystackPayment.bind(paymentController));

// Payout and Bank Details Routes (Authenticated)
router.get('/payouts/bank-details', authMiddleware, paymentController.getStoreBankDetails.bind(paymentController));
router.post('/payouts/bank-details', authMiddleware, paymentController.saveStoreBankDetails.bind(paymentController));
router.get('/payouts/overview', authMiddleware, paymentController.getStorePayoutOverview.bind(paymentController));
router.post('/payouts/process-weekly', authMiddleware, paymentController.processWeeklyPayouts.bind(paymentController));
router.get('/payouts/batches', authMiddleware, paymentController.getAllPayoutBatches.bind(paymentController));

// Protected customer payment methods & intents
router.get('/methods', authMiddleware, requireCustomer, paymentController.getPaymentMethods.bind(paymentController));
router.post('/methods', authMiddleware, requireCustomer, paymentController.addPaymentMethod.bind(paymentController));
router.delete('/methods/:id', authMiddleware, requireCustomer, paymentController.deletePaymentMethod.bind(paymentController));
router.post('/intents', authMiddleware, paymentLimiter, paymentController.createPaymentIntent.bind(paymentController));
router.post('/confirm', authMiddleware, paymentLimiter, paymentController.confirmPayment.bind(paymentController));
router.get('/history', authMiddleware, paymentController.getPaymentHistory.bind(paymentController));

// Admin-only refunds
router.post('/refunds', authMiddleware, requireAdmin, paymentController.createRefund.bind(paymentController));

export default router;
