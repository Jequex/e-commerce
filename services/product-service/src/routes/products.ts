import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authMiddleware, requireStoreOwnerOrAdmin, requireCustomer } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const productController = new ProductController();

// Rate limiting for product endpoints
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    error: 'Too many search requests, please try again later',
    code: 'TOO_MANY_SEARCHES'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.get('/search', searchLimiter, productController.searchProducts.bind(productController));
router.get('/featured', productController.getFeaturedProducts.bind(productController));
router.get('/categories', productController.getCategories.bind(productController));
router.get('/categories/:id', productController.getCategory.bind(productController));

// Store-specific routes (public)
router.get('/store/:storeId', productController.getProductsByStore.bind(productController));
router.get('/store/:storeId/stats', productController.getStoreProductStats.bind(productController));
router.get('/store/:storeId/featured', productController.getStoreFeaturedProducts.bind(productController));

router.get('/', productController.getProducts.bind(productController));
router.get('/:id', productController.getProduct.bind(productController));

// Protected routes - Customer access
router.use(authMiddleware);
router.use(requireCustomer);

// Admin-only routes
router.use(requireStoreOwnerOrAdmin);
router.post('/', productController.createProduct.bind(productController));
router.put('/:id', productController.updateProduct.bind(productController));
router.delete('/:id', productController.deleteProduct.bind(productController));
router.post('/categories', productController.createCategory.bind(productController));

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString()
  });
});

export default router;