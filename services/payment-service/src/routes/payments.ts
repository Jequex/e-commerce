import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authMiddleware, requireAdmin, requireCustomer } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const paymentController = new PaymentController();

// Rate limiting for payment operations
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment attempts per 15 minutes
  message: {
    error: 'Too many payment attempts, please try again later',
    code: 'TOO_MANY_PAYMENTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow more webhooks
  message: {
    error: 'Too many webhook requests',
    code: 'TOO_MANY_WEBHOOKS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook endpoints (no auth required)
router.post('/webhook/stripe', webhookLimiter, paymentController.handleWebhook.bind(paymentController));

// Protected routes - require authentication
router.use(authMiddleware);
router.use(requireCustomer);

// Payment methods
router.get('/methods', paymentController.getPaymentMethods.bind(paymentController));
router.post('/methods', paymentController.addPaymentMethod.bind(paymentController));
router.delete('/methods/:id', paymentController.deletePaymentMethod.bind(paymentController));

// Payment processing
router.post('/intents', paymentLimiter, paymentController.createPaymentIntent.bind(paymentController));
router.post('/confirm', paymentLimiter, paymentController.confirmPayment.bind(paymentController));

// Payment history
router.get('/history', paymentController.getPaymentHistory.bind(paymentController));

// Admin-only routes
router.post('/refunds', requireAdmin, paymentController.createRefund.bind(paymentController));

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString()
  });
});

export default router;