import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authMiddleware, requireAdmin, requireCustomer } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const orderController = new OrderController();

// Rate limiting
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 orders per 15 minutes
  message: {
    error: 'Too many order attempts, please try again later',
    code: 'TOO_MANY_ORDERS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 cart operations per minute
  message: {
    error: 'Too many cart operations, please try again later',
    code: 'TOO_MANY_CART_OPERATIONS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Protected routes - require authentication
router.use(authMiddleware);

// Customer routes
router.use(requireCustomer);

// Shopping cart routes (must come before /:id route)
router.post('/cart/add', cartLimiter, orderController.addToCart.bind(orderController));
router.get('/cart', orderController.getCart.bind(orderController));
router.put('/cart/update/:itemId', cartLimiter, orderController.updateCartItem.bind(orderController));
router.delete('/cart/remove/:itemId', cartLimiter, orderController.removeCartItem.bind(orderController));
router.delete('/cart/clear', orderController.clearCart.bind(orderController));

// Order management
router.post('/', orderLimiter, orderController.createOrder.bind(orderController));
router.get('/my-orders', orderController.getUserOrders.bind(orderController));
router.get('/:id', orderController.getOrder.bind(orderController));
router.put('/:id/cancel', orderController.cancelOrder.bind(orderController));

// Admin-only routes
router.get('/admin/all', requireAdmin, orderController.getAllOrders.bind(orderController));
router.put('/admin/:id', requireAdmin, orderController.updateOrder.bind(orderController));

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
});

export default router;