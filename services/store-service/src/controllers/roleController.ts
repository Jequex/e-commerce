import { Request, Response } from 'express';
import { db } from '../config/database';
import { roles, permissions, rolePermissions } from '../schema/store';
import { eq, and } from 'drizzle-orm';
import { insertRoleSchema, insertRolePermissionSchema, updateRoleSchema } from '../schema/store';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export class RoleController {
  // Create a new role
  async createRole(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const validatedData = insertRoleSchema.parse(req.body);

      // Check if role with same name or slug already exists
      const existingRole = await db.select().from(roles)
        .where(eq(roles.name, validatedData.name))
        .limit(1);

      if (existingRole.length > 0) {
        return res.status(409).json({
          error: 'Role with this name already exists',
          code: 'ROLE_EXISTS'
        });
      }

      const [newRole] = await db.insert(roles).values({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        level: validatedData.level || 1,
        isSystemRole: validatedData.isSystemRole || false,
        isActive: validatedData.isActive ?? true
      }).returning();

      return res.status(201).json({
        message: 'Role created successfully',
        role: newRole
      });

    } catch (error) {
      console.error('Create role error:', error);
      
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

  // Get all roles
  async getRoles(req: Request, res: Response): Promise<Response> {
    try {
      const allRoles = await db.select().from(roles);

      return res.json({
        roles: allRoles,
        count: allRoles.length
      });

    } catch (error) {
      console.error('Get roles error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get role by ID with permissions
  async getRole(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const [role] = await db.select().from(roles)
        .where(eq(roles.id, id))
        .limit(1);

      if (!role) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      // Get role permissions
      const rolePerms = await db.select({
        permission: permissions
      })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, id));

      return res.json({
        role,
        permissions: rolePerms.map(rp => rp.permission)
      });

    } catch (error) {
      console.error('Get role error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Update role
  async updateRole(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const validatedData = updateRoleSchema.parse(req.body);

      const [existingRole] = await db.select().from(roles)
        .where(eq(roles.id, id))
        .limit(1);

      if (!existingRole) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      // Prevent modification of system roles
      if (existingRole.isSystemRole) {
        return res.status(403).json({
          error: 'Cannot modify system roles',
          code: 'SYSTEM_ROLE_PROTECTED'
        });
      }

      const [updatedRole] = await db.update(roles)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(roles.id, id))
        .returning();

      return res.json({
        message: 'Role updated successfully',
        role: updatedRole
      });

    } catch (error) {
      console.error('Update role error:', error);
      
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

  // Delete role
  async deleteRole(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const [existingRole] = await db.select().from(roles)
        .where(eq(roles.id, id))
        .limit(1);

      if (!existingRole) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      // Prevent deletion of system roles
      if (existingRole.isSystemRole) {
        return res.status(403).json({
          error: 'Cannot delete system roles',
          code: 'SYSTEM_ROLE_PROTECTED'
        });
      }

      await db.delete(roles)
        .where(eq(roles.id, id));

      return res.json({
        message: 'Role deleted successfully'
      });

    } catch (error) {
      console.error('Delete role error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Assign permission to role
  async assignPermission(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const validatedData = insertRolePermissionSchema.parse({
        roleId: id,
        permissionId: req.body.permissionId
      });

      // Check if role exists
      const [role] = await db.select().from(roles)
        .where(eq(roles.id, id))
        .limit(1);

      if (!role) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      // Check if permission exists
      const [permission] = await db.select().from(permissions)
        .where(eq(permissions.id, validatedData.permissionId))
        .limit(1);

      if (!permission) {
        return res.status(404).json({
          error: 'Permission not found',
          code: 'PERMISSION_NOT_FOUND'
        });
      }

      // Check if already assigned
      const existing = await db.select().from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, id),
          eq(rolePermissions.permissionId, validatedData.permissionId)
        ))
        .limit(1);

      if (existing.length > 0) {
        return res.status(409).json({
          error: 'Permission already assigned to this role',
          code: 'PERMISSION_ALREADY_ASSIGNED'
        });
      }

      const [assignment] = await db.insert(rolePermissions).values({
        roleId: id,
        permissionId: validatedData.permissionId
      }).returning();

      return res.status(201).json({
        message: 'Permission assigned to role successfully',
        assignment
      });

    } catch (error) {
      console.error('Assign permission error:', error);
      
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

  // Remove permission from role
  async removePermission(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id, permissionId } = req.params;

      const result = await db.delete(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, id),
          eq(rolePermissions.permissionId, permissionId)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          error: 'Permission assignment not found',
          code: 'ASSIGNMENT_NOT_FOUND'
        });
      }

      return res.json({
        message: 'Permission removed from role successfully'
      });

    } catch (error) {
      console.error('Remove permission error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

export const roleController = new RoleController();
