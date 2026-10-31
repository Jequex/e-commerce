import { Router } from 'express';
import multer from 'multer';
import { ProductController } from '../controllers/productController';
import { authMiddleware, requireStoreOwnerOrAdmin, requireCustomer, requireSuperAdmin } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const productController = new ProductController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for demo videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are permitted'));
    }
  },
});

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

// Public routes - Coupons validation
router.post('/coupons/validate', productController.validateCoupon.bind(productController));

// Coupons management (Admin & Super Admin)
router.get('/coupons', authMiddleware, requireStoreOwnerOrAdmin, productController.getCoupons.bind(productController));
router.post('/coupons', authMiddleware, requireStoreOwnerOrAdmin, productController.createCoupon.bind(productController));
router.put('/coupons/:id', authMiddleware, requireStoreOwnerOrAdmin, productController.updateCoupon.bind(productController));
router.delete('/coupons/:id', authMiddleware, requireStoreOwnerOrAdmin, productController.deleteCoupon.bind(productController));

// Markups management (Super Admin)
router.get('/markups', authMiddleware, requireSuperAdmin, productController.getCategoryMarkups.bind(productController));
router.put('/markups/category/:id', authMiddleware, requireSuperAdmin, productController.updateCategoryDefaultMarkup.bind(productController));
router.post('/markups/admin', authMiddleware, requireSuperAdmin, productController.setAdminCategoryMarkup.bind(productController));
router.put('/markups/admin/:id', authMiddleware, requireSuperAdmin, productController.updateAdminCategoryMarkupById.bind(productController));
router.delete('/markups/admin/:id', authMiddleware, requireSuperAdmin, productController.deleteAdminCategoryMarkup.bind(productController));

// General product routes (public)
router.get('/', productController.getProducts.bind(productController));
router.get('/:id', productController.getProduct.bind(productController));

// Protected routes - Require authentication
router.use(authMiddleware);

// Admin-only routes for products
router.post('/upload', requireStoreOwnerOrAdmin, upload.any(), productController.uploadMedia.bind(productController));
router.post('/', requireStoreOwnerOrAdmin, productController.createProduct.bind(productController));
router.put('/:id', requireStoreOwnerOrAdmin, productController.updateProduct.bind(productController));
router.delete('/:id', requireStoreOwnerOrAdmin, productController.deleteProduct.bind(productController));

// Super Admin only routes for categories
router.post('/categories', requireSuperAdmin, productController.createCategory.bind(productController));
router.put('/categories/:id', requireSuperAdmin, productController.updateCategory.bind(productController));
router.delete('/categories/:id', requireSuperAdmin, productController.deleteCategory.bind(productController));

export default router;