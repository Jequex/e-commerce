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

// Health check endpoint (must be first, no auth required)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString()
  });
});

// Public routes - Categories (more specific routes first)
router.get('/categories', productController.getCategories.bind(productController));
router.get('/categories/:id', productController.getCategory.bind(productController));

// Public routes - Products
router.get('/search', searchLimiter, productController.searchProducts.bind(productController));
router.get('/featured', productController.getFeaturedProducts.bind(productController));

// Store-specific routes (public)
router.get('/store/:storeId', productController.getProductsByStore.bind(productController));
router.get('/store/:storeId/stats', productController.getStoreProductStats.bind(productController));
router.get('/store/:storeId/featured', productController.getStoreFeaturedProducts.bind(productController));

// General product routes (public)
router.get('/', productController.getProducts.bind(productController));
router.get('/:id', productController.getProduct.bind(productController));

// Protected routes - Require authentication
router.use(authMiddleware);

// Admin-only routes for products
router.post('/', requireStoreOwnerOrAdmin, productController.createProduct.bind(productController));
router.put('/:id', requireStoreOwnerOrAdmin, productController.updateProduct.bind(productController));
router.delete('/:id', requireStoreOwnerOrAdmin, productController.deleteProduct.bind(productController));

// Admin-only routes for categories
router.post('/categories', requireStoreOwnerOrAdmin, productController.createCategory.bind(productController));
router.put('/categories/:id', requireStoreOwnerOrAdmin, productController.updateCategory.bind(productController));
router.delete('/categories/:id', requireStoreOwnerOrAdmin, productController.deleteCategory.bind(productController));

export default router;