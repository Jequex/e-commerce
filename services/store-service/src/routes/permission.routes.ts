import { Router } from 'express';
import { permissionController } from '../controllers/permissionController';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Validation schemas
const createPermissionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    description: z.string().optional(),
    resource: z.string().min(1).max(100),
    action: z.string().min(1).max(100),
    isActive: z.boolean().optional()
  })
});

const updatePermissionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    resource: z.string().min(1).max(100).optional(),
    action: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional()
  }),
  params: z.object({
    id: z.string().uuid()
  })
});

const permissionIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

// Routes
router.post(
  '/',
  authenticateToken,
  validateRequest(createPermissionSchema),
  permissionController.createPermission.bind(permissionController)
);

router.get(
  '/',
  authenticateToken,
  permissionController.getPermissions.bind(permissionController)
);

router.get(
  '/by-resource',
  authenticateToken,
  permissionController.getPermissionsByResource.bind(permissionController)
);

router.get(
  '/:id',
  authenticateToken,
  validateRequest(permissionIdSchema),
  permissionController.getPermission.bind(permissionController)
);

router.put(
  '/:id',
  authenticateToken,
  validateRequest(updatePermissionSchema),
  permissionController.updatePermission.bind(permissionController)
);

router.delete(
  '/:id',
  authenticateToken,
  validateRequest(permissionIdSchema),
  permissionController.deletePermission.bind(permissionController)
);

export default router;
