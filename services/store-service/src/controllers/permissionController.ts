import { Request, Response } from 'express';
import { db } from '../config/database';
import { permissions } from '../schema/store';
import { eq, like, or } from 'drizzle-orm';
import { insertPermissionSchema, updatePermissionSchema } from '../schema/store';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export class PermissionController {
  // Create a new permission
  async createPermission(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const validatedData = insertPermissionSchema.parse(req.body);

      // Check if permission with same name or slug already exists
      const existingPermission = await db.select().from(permissions)
        .where(or(
          eq(permissions.name, validatedData.name),
          eq(permissions.slug, validatedData.slug)
        ))
        .limit(1);

      if (existingPermission.length > 0) {
        return res.status(409).json({
          error: 'Permission with this name or slug already exists',
          code: 'PERMISSION_EXISTS'
        });
      }

      const [newPermission] = await db.insert(permissions).values({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        resource: validatedData.resource,
        action: validatedData.action,
        isActive: validatedData.isActive ?? true
      }).returning();

      return res.status(201).json({
        message: 'Permission created successfully',
        permission: newPermission
      });

    } catch (error) {
      console.error('Create permission error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get all permissions
  async getPermissions(req: Request, res: Response): Promise<Response> {
    try {
      const { resource, action, search } = req.query;

      // Build conditions array
      const conditions = [];
      
      if (resource) {
        conditions.push(eq(permissions.resource, resource as string));
      }
      
      if (action) {
        conditions.push(eq(permissions.action, action as string));
      }
      
      if (search) {
        conditions.push(
          or(
            like(permissions.name, `%${search}%`),
            like(permissions.description, `%${search}%`)
          )
        );
      }

      // Execute query with or without conditions
      let allPermissions;
      if (conditions.length > 0) {
        allPermissions = await db.select().from(permissions)
          .where(or(...conditions));
      } else {
        allPermissions = await db.select().from(permissions);
      }

      return res.json({
        permissions: allPermissions,
        count: allPermissions.length
      });

    } catch (error) {
      console.error('Get permissions error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get permission by ID
  async getPermission(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const [permission] = await db.select().from(permissions)
        .where(eq(permissions.id, id))
        .limit(1);

      if (!permission) {
        return res.status(404).json({
          error: 'Permission not found',
          code: 'PERMISSION_NOT_FOUND'
        });
      }

      return res.json({ permission });

    } catch (error) {
      console.error('Get permission error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Update permission
  async updatePermission(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const validatedData = updatePermissionSchema.parse(req.body);

      const [existingPermission] = await db.select().from(permissions)
        .where(eq(permissions.id, id))
        .limit(1);

      if (!existingPermission) {
        return res.status(404).json({
          error: 'Permission not found',
          code: 'PERMISSION_NOT_FOUND'
        });
      }

      const [updatedPermission] = await db.update(permissions)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(permissions.id, id))
        .returning();

      return res.json({
        message: 'Permission updated successfully',
        permission: updatedPermission
      });

    } catch (error) {
      console.error('Update permission error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Delete permission
  async deletePermission(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const [existingPermission] = await db.select().from(permissions)
        .where(eq(permissions.id, id))
        .limit(1);

      if (!existingPermission) {
        return res.status(404).json({
          error: 'Permission not found',
          code: 'PERMISSION_NOT_FOUND'
        });
      }

      await db.delete(permissions)
        .where(eq(permissions.id, id));

      return res.json({
        message: 'Permission deleted successfully'
      });

    } catch (error) {
      console.error('Delete permission error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get permissions grouped by resource
  async getPermissionsByResource(req: Request, res: Response): Promise<Response> {
    try {
      const allPermissions = await db.select().from(permissions);

      // Group permissions by resource
      const grouped = allPermissions.reduce((acc, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = [];
        }
        acc[permission.resource].push(permission);
        return acc;
      }, {} as Record<string, typeof allPermissions>);

      return res.json({
        permissions: grouped,
        resources: Object.keys(grouped)
      });

    } catch (error) {
      console.error('Get permissions by resource error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

export const permissionController = new PermissionController();
