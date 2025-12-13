import { Router } from 'express';
import { roleController } from '../controllers/roleController';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Validation schemas
const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    description: z.string().optional(),
    isSystemRole: z.boolean().optional()
  })
});

const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional()
  }),
  params: z.object({
    id: z.string().uuid()
  })
});

const roleIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

const assignPermissionSchema = z.object({
  body: z.object({
    permissionId: z.string().uuid()
  }),
  params: z.object({
    id: z.string().uuid()
  })
});

// Routes
router.post(
  '/',
  authenticateToken,
  validateRequest(createRoleSchema),
  roleController.createRole.bind(roleController)
);

router.get(
  '/',
  authenticateToken,
  roleController.getRoles.bind(roleController)
);

router.get(
  '/:id',
  authenticateToken,
  validateRequest(roleIdSchema),
  roleController.getRole.bind(roleController)
);

router.put(
  '/:id',
  authenticateToken,
  validateRequest(updateRoleSchema),
  roleController.updateRole.bind(roleController)
);

router.delete(
  '/:id',
  authenticateToken,
  validateRequest(roleIdSchema),
  roleController.deleteRole.bind(roleController)
);

router.post(
  '/:id/permissions',
  authenticateToken,
  validateRequest(assignPermissionSchema),
  roleController.assignPermission.bind(roleController)
);

router.delete(
  '/:id/permissions/:permissionId',
  authenticateToken,
  roleController.removePermission.bind(roleController)
);

export default router;
