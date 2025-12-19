import { Router } from 'express';
import { StoreController } from '../controllers/storeController';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { generalLimiter, strictLimiter, createLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  insertStoreSchema, 
  insertStoreAddressSchema,
  insertStoreHoursSchema,
  insertStoreStaffSchema,
  insertStoreReviewSchema,
  updateStoreSchema,
  storeSearchSchema,
  updateStoreStaffSchema
} from '../schema/store';
import { z } from 'zod';

const router = Router();
const storeController = new StoreController();

// Validation schemas for route parameters
const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid store ID format')
});

const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional()
});

// Public routes (no authentication required)

// Get all stores with filtering and pagination
router.get('/',
  generalLimiter,
  validateQuery(storeSearchSchema),
  asyncHandler(storeController.getStores)
);

// Get store by ID
router.get('/:id',
  generalLimiter,
  validateParams(uuidParamSchema),
  asyncHandler(storeController.getStore)
);

// Get store categories
router.get('/categories/list',
  generalLimiter,
  asyncHandler(storeController.getStoreCategories)
);

// Get store reviews
router.get('/:id/reviews',
  generalLimiter,
  validateParams(uuidParamSchema),
  validateQuery(paginationSchema),
  asyncHandler(storeController.getStoreReviews)
);

// Protected routes (authentication required)

// Create new store
router.post('/',
  createLimiter,
  authenticateToken,
  requireAuth,
  validateBody(insertStoreSchema),
  asyncHandler(storeController.createStore)
);

// Update store
router.put('/:id',
  strictLimiter,
  authenticateToken,
  requireAuth,
  validateParams(uuidParamSchema),
  validateBody(updateStoreSchema),
  asyncHandler(storeController.updateStore)
);

// Delete store (soft delete)
router.delete('/:id',
  strictLimiter,
  authenticateToken,
  requireAuth,
  validateParams(uuidParamSchema),
  asyncHandler(storeController.deleteStore)
);

// Store Address Management

// Add store address
router.post('/:id/addresses',
  strictLimiter,
  authenticateToken,
  requireAuth,
  validateParams(uuidParamSchema),
  validateBody(insertStoreAddressSchema),
  asyncHandler(storeController.addStoreAddress)
);

// Store Hours Management

// Update store business hours
router.put('/:id/hours',
  strictLimiter,
  authenticateToken,
  requireAuth,
  validateParams(uuidParamSchema),
  validateBody(z.object({
    hours: z.array(insertStoreHoursSchema)
  })),
  asyncHandler(storeController.updateStoreHours)
);

// Staff Management

// Add store staff
router.post('/:id/staff',
  strictLimiter,
  authenticateToken,
  requireAuth,
  validateParams(uuidParamSchema),
  validateBody(insertStoreStaffSchema),
  asyncHandler(storeController.addStoreStaff)
);

// Get store staff
router.get('/:id/staff',
  generalLimiter,
  authenticateToken,
  requireAuth,
  validateParams(uuidParamSchema),
  asyncHandler(storeController.getStoreStaff)
);

// Update store staff member
router.put('/:storeId/staff/:staffId',
  strictLimiter,
  authenticateToken,
  requireAuth,
  validateParams(z.object({
    storeId: z.string().uuid('Invalid store ID format'),
    staffId: z.string().uuid('Invalid staff ID format')
  })),
  validateBody(updateStoreStaffSchema),
  asyncHandler(storeController.updateStoreStaff)
);

// Remove store staff
router.delete('/:storeId/staff/:staffId',
  strictLimiter,
  authenticateToken,
  requireAuth,
  validateParams(z.object({
    storeId: z.string().uuid('Invalid store ID format'),
    staffId: z.string().uuid('Invalid staff ID format')
  })),
  asyncHandler(storeController.removeStoreStaff)
);

// Review Management

// Add store review
router.post('/:id/reviews',
  generalLimiter,
  authenticateToken,
  requireAuth,
  validateParams(uuidParamSchema),
  validateBody(insertStoreReviewSchema),
  asyncHandler(storeController.addStoreReview)
);

// Analytics (store owner and admin only)

// Get store analytics
router.get('/:id/analytics',
  generalLimiter,
  authenticateToken,
  requireAuth,
  validateParams(uuidParamSchema),
  validateQuery(z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    period: z.enum(['24h', '7d', '30d', '90d']).optional()
  })),
  asyncHandler(storeController.getStoreAnalytics)
);

// User Store Management - Get authenticated user's store information

// Get all stores where user is staff
router.get('/user/stores',
  generalLimiter,
  authenticateToken,
  requireAuth,
  asyncHandler(storeController.getUserStores)
);

// Get user's role in a specific store
router.get('/user/stores/:storeId/role',
  generalLimiter,
  authenticateToken,
  requireAuth,
  validateParams(z.object({ storeId: z.string().uuid() })),
  asyncHandler(storeController.getUserStoreRole)
);

// Get user's permissions in a specific store
router.get('/user/stores/:storeId/permissions',
  generalLimiter,
  authenticateToken,
  requireAuth,
  validateParams(z.object({ storeId: z.string().uuid() })),
  asyncHandler(storeController.getUserStorePermissions)
);

// Get complete user store info (store + role + permissions)
router.get('/user/stores/:storeId/complete',
  generalLimiter,
  authenticateToken,
  requireAuth,
  validateParams(z.object({ storeId: z.string().uuid() })),
  asyncHandler(storeController.getUserCompleteStoreInfo)
);

export { router as storeRoutes };