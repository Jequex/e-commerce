import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  stores, 
  storeCategories,
  storeAddresses, 
  storeHours,
  storeStaff,
  storeReviews,
  storeAnalytics,
  roles,
  permissions,
  rolePermissions,
  insertStoreSchema,
  insertStoreAddressSchema,
  insertStoreHoursSchema,
  insertStoreStaffSchema,
  insertStoreReviewSchema,
  updateStoreSchema,
  updateStoreAddressSchema,
  updateStoreHoursSchema,
  updateStoreStaffSchema,
  storeSearchSchema
} from '../schema/store';
import axios from 'axios';
import { eq, and, desc, asc, like, gte, lte, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class StoreController {
  
  // Create new store
  async createStore(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const validatedData = insertStoreSchema.parse(req.body);
      
      // Check if slug already exists
      const existingStore = await db.select().from(stores)
        .where(eq(stores.slug, validatedData.slug))
        .limit(1);

      if (existingStore.length > 0) {
        return res.status(409).json({
          error: 'Store slug already exists',
          code: 'STORE_SLUG_EXISTS'
        });
      }

      // Create store
      const [newStore] = await db.insert(stores).values({
        id: uuidv4(),
        ownerId: req.user.id,
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        type: validatedData.type || 'physical',
        status: 'pending_approval',
        email: validatedData.email,
        phone: validatedData.phone,
        website: validatedData.website,
        categoryId: validatedData.categoryId,
        allowOnlineOrders: validatedData.allowOnlineOrders ?? true,
        allowPickup: validatedData.allowPickup ?? true,
        allowDelivery: validatedData.allowDelivery ?? true,
        deliveryRadius: validatedData.deliveryRadius,
        minOrderAmount: validatedData.minOrderAmount,
        logo: validatedData.logo,
        banner: validatedData.banner,
        images: validatedData.images,
        metadata: validatedData.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return res.status(201).json({
        message: 'Store created successfully',
        store: newStore
      });

    } catch (error) {
      console.error('Create store error:', error);
      
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

  // Get store by ID
  async getStore(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const [store] = await db.select().from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (!store) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }

      return res.json({ store });

    } catch (error) {
      console.error('Get store error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get stores with filtering and pagination
  async getStores(req: Request, res: Response): Promise<Response> {
    try {
      const {
        query: searchQuery,
        category,
        type,
        status,
        city,
        state,
        country,
        minRating,
        allowDelivery,
        allowPickup,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = storeSearchSchema.parse(req.query);

      // Build where conditions
      const conditions = [];
      
      if (searchQuery) {
        conditions.push(
          like(stores.name, `%${searchQuery}%`)
        );
      }
      
      if (category) {
        conditions.push(eq(stores.categoryId, category));
      }
      
      if (type) {
        conditions.push(eq(stores.type, type));
      }
      
      if (status) {
        conditions.push(eq(stores.status, status));
      }
      
      if (minRating) {
        conditions.push(gte(stores.averageRating, minRating.toString()));
      }
      
      if (allowDelivery !== undefined) {
        conditions.push(eq(stores.allowDelivery, allowDelivery));
      }
      
      if (allowPickup !== undefined) {
        conditions.push(eq(stores.allowPickup, allowPickup));
      }

      // Build order by
      const getOrderColumn = () => {
        switch (sortBy) {
          case 'name': return stores.name;
          case 'rating': return stores.averageRating;
          case 'totalOrders': return stores.totalOrders;
          case 'totalRevenue': return stores.totalRevenue;
          default: return stores.createdAt;
        }
      };
      const orderColumn = getOrderColumn();
      const orderDirection = sortOrder === 'asc' ? asc : desc;

      // Calculate offset
      const offset = (page - 1) * limit;

      // Build base query
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      // Get stores with count
      const [storeList, totalCountResult] = await Promise.all([
        db.select().from(stores)
          .where(whereClause)
          .orderBy(orderDirection(orderColumn))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(stores)
          .where(whereClause)
      ]);
      
      const totalCount = Number(totalCountResult[0].count);

      const totalPages = Math.ceil(totalCount / limit);

      return res.json({
        stores: storeList,
        pagination: {
          page,
          limit,
          totalCount: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get stores error:', error);
      
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

  // Update store
  async updateStore(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { id } = req.params;
      const validatedData = updateStoreSchema.parse(req.body);

      // Check if store exists and user has permission
      const existingStoreResult = await db.select().from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (existingStoreResult.length === 0) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }
      
      const existingStore = existingStoreResult[0];

      // Check ownership or admin permission
      if (existingStore.ownerId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Check slug uniqueness if being updated
      if (validatedData.slug && validatedData.slug !== existingStore.slug) {
        const slugExistsResult = await db.select().from(stores)
          .where(eq(stores.slug, validatedData.slug))
          .limit(1);

        if (slugExistsResult.length > 0) {
          return res.status(409).json({
            error: 'Store slug already exists',
            code: 'STORE_SLUG_EXISTS'
          });
        }
      }

      // Update store
      const [updatedStore] = await db
        .update(stores)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(stores.id, id))
        .returning();

      return res.json({
        message: 'Store updated successfully',
        store: updatedStore
      });

    } catch (error) {
      console.error('Update store error:', error);
      
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

  // Delete store
  async deleteStore(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { id } = req.params;

      // Check if store exists and user has permission
      const existingStoreResult = await db.select().from(stores)
        .where(eq(stores.id, id))
        .limit(1);
        
      if (existingStoreResult.length === 0) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }
      
      const existingStore = existingStoreResult[0];

      if (!existingStore) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }

      // Check ownership or admin permission
      if (existingStore.ownerId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Soft delete by updating status
      await db
        .update(stores)
        .set({
          status: 'closed',
          updatedAt: new Date()
        })
        .where(eq(stores.id, id));

      return res.json({
        message: 'Store deleted successfully'
      });

    } catch (error) {
      console.error('Delete store error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Store Address Management
  async addStoreAddress(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { id } = req.params;
      const validatedData = insertStoreAddressSchema.parse(req.body);

      // Check store ownership
      const storeResult = await db.select().from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (storeResult.length === 0) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }
      
      const store = storeResult[0];

      if (store.ownerId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // If this is set as default, unset other default addresses
      if (validatedData.isDefault) {
        await db
          .update(storeAddresses)
          .set({ isDefault: false })
          .where(eq(storeAddresses.storeId, id));
      }

      const [newAddress] = await db.insert(storeAddresses).values({
        id: uuidv4(),
        storeId: id,
        type: validatedData.type || 'primary',
        streetAddress: validatedData.streetAddress,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        isDefault: validatedData.isDefault ?? false,
        isActive: validatedData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return res.status(201).json({
        message: 'Address added successfully',
        address: newAddress
      });

    } catch (error) {
      console.error('Add store address error:', error);
      
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

  // Store Hours Management
  async updateStoreHours(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { id } = req.params;
      const hoursData = req.body.hours; // Array of hour objects

      // Check store ownership
      const storeResult = await db.select().from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (storeResult.length === 0) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }
      
      const store = storeResult[0];

      if (store.ownerId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Delete existing hours
      await db
        .delete(storeHours)
        .where(eq(storeHours.storeId, id));

      // Insert new hours
      const newHours = [];
      for (const hour of hoursData) {
        const validatedHour = insertStoreHoursSchema.parse(hour);
        const [newHour] = await db.insert(storeHours).values({
          id: uuidv4(),
          storeId: id,
          dayOfWeek: validatedHour.dayOfWeek,
          openTime: validatedHour.openTime,
          closeTime: validatedHour.closeTime,
          isClosed: validatedHour.isClosed ?? false,
          isHoliday: validatedHour.isHoliday ?? false,
          notes: validatedHour.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        newHours.push(newHour);
      }

      return res.json({
        message: 'Store hours updated successfully',
        hours: newHours
      });

    } catch (error) {
      console.error('Update store hours error:', error);
      
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

  // Staff Management
  async addStoreStaff(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { id } = req.params;
      const validatedData = insertStoreStaffSchema.parse(req.body);

      // Check store ownership
      const storeResult = await db.select().from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (storeResult.length === 0) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }
      
      const store = storeResult[0];

      if (store.ownerId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // call auth service to create user
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
      const userResponse = await axios.post(
        `${authServiceUrl}/api/auth/register`,
        {
          email: validatedData.email,
          password: validatedData.password,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.userRole
        },
        { timeout: 5000 } // 5 second timeout
      );

      if (!userResponse.data || !userResponse.data.user) {
        return res.status(500).json({
          error: 'Failed to create user in auth service',
          code: 'AUTH_SERVICE_ERROR'
        });
      }

      const userId = userResponse.data.user.id;

      validatedData.userId = userId;

      // Check if user is already staff
      const existingStaffResult = await db.select().from(storeStaff)
        .where(and(
          eq(storeStaff.storeId, id),
          eq(storeStaff.userId, validatedData.userId)
        ))
        .limit(1);

      const existingStaff = existingStaffResult.length > 0 ? existingStaffResult[0] : null;

      if (existingStaff) {
        return res.status(409).json({
          error: 'User is already a staff member',
          code: 'STAFF_EXISTS'
        });
      }

      const [newStaff] = await db.insert(storeStaff).values({
        storeId: id,
        userId: validatedData.userId,
        roleId: validatedData.roleId,
        salary: validatedData.salary,
        commission: validatedData.commission,
        isActive: validatedData.isActive ?? true,
        hiredAt: new Date()
      }).returning();

      return res.status(201).json({
        message: 'Staff member added successfully',
        staff: {
          ...newStaff,
          role: newStaff.roleId,  // For backward compatibility
        }
      });

    } catch (error) {
      console.error('Add store staff error:', error);
      
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

  // Get store staff
  async getStoreStaff(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { id } = req.params;

      // Check if store exists
      const storeResult = await db.select().from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (storeResult.length === 0) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }
      
      const store = storeResult[0];

      // Check if user has permission to view staff
      // (store owner, admin, or staff member of the store)
      const isStaffMember = await db.select().from(storeStaff)
        .where(and(
          eq(storeStaff.storeId, id),
          eq(storeStaff.userId, req.user.id),
          eq(storeStaff.isActive, true)
        ))
        .limit(1);

      if (store.ownerId !== req.user.id && !req.user.isAdmin && isStaffMember.length === 0) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Get all staff members with their role information
      const staffMembers = await db
        .select({
          id: storeStaff.id,
          userId: storeStaff.userId,
          storeId: storeStaff.storeId,
          roleId: storeStaff.roleId,
          roleName: roles.name,
          roleSlug: roles.slug,
          salary: storeStaff.salary,
          commission: storeStaff.commission,
          isActive: storeStaff.isActive,
          hiredAt: storeStaff.hiredAt
        })
        .from(storeStaff)
        .innerJoin(roles, eq(storeStaff.roleId, roles.id))
        .where(eq(storeStaff.storeId, id))
        .orderBy(desc(storeStaff.hiredAt));

      // Fetch user details from auth service for each staff member
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
      
      const staffWithUserDetails = await Promise.all(
        staffMembers.map(async (staff) => {
          let userDetails = {
            email: null,
            firstName: null,
            lastName: null
          };

          try {
            // Try to fetch user details from auth service
            const userResponse = await axios.get(
              `${authServiceUrl}/api/auth/user/${staff.userId}`,
              { 
                headers: { Authorization: req.headers.authorization },
                timeout: 2000 // 2 second timeout
              }
            );
            
            if (userResponse.data && userResponse.data.user) {
              userDetails = {
                email: userResponse.data.user.email,
                firstName: userResponse.data.user.firstName,
                lastName: userResponse.data.user.lastName
              };
            }
          } catch (error) {
            // Silently fail and return null values for user details
            console.log(`Could not fetch user details for userId: ${staff.userId}`);
          }

          return {
            ...staff,
            user: userDetails
          };
        })
      );

      return res.json({
        staff: staffWithUserDetails,
        count: staffWithUserDetails.length
      });

    } catch (error) {
      console.error('Get store staff error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Remove store staff
  async removeStoreStaff(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { storeId, staffId } = req.params;

      // Check if store exists
      const storeResult = await db.select().from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);

      if (storeResult.length === 0) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }
      
      const store = storeResult[0];

      // Check ownership or admin permission
      if (store.ownerId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Check if staff member exists
      const staffResult = await db.select().from(storeStaff)
        .where(and(
          eq(storeStaff.id, staffId),
          eq(storeStaff.storeId, storeId)
        ))
        .limit(1);

      if (staffResult.length === 0) {
        return res.status(404).json({
          error: 'Staff member not found',
          code: 'STAFF_NOT_FOUND'
        });
      }

      // Delete the staff member
      await db
        .delete(storeStaff)
        .where(and(
          eq(storeStaff.id, staffId),
          eq(storeStaff.storeId, storeId)
        ));

      return res.json({
        message: 'Staff member removed successfully'
      });

    } catch (error) {
      console.error('Remove store staff error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Review Management
  async addStoreReview(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { id } = req.params;
      const validatedData = insertStoreReviewSchema.parse(req.body);

      // Check if store exists
      const storeResult = await db.select().from(stores)
        .where(eq(stores.id, id))
        .limit(1);

      if (storeResult.length === 0) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }

      // Check if user already reviewed this store
      const existingReviewResult = await db.select().from(storeReviews)
        .where(and(
          eq(storeReviews.storeId, id),
          eq(storeReviews.userId, req.user.id)
        ))
        .limit(1);

      const existingReview = existingReviewResult.length > 0 ? existingReviewResult[0] : null;

      if (existingReview) {
        return res.status(409).json({
          error: 'You have already reviewed this store',
          code: 'REVIEW_EXISTS'
        });
      }

      const [newReview] = await db.insert(storeReviews).values({
        id: uuidv4(),
        storeId: id,
        userId: req.user.id,
        rating: validatedData.rating,
        title: validatedData.title,
        comment: validatedData.comment,
        images: validatedData.images,
        orderId: validatedData.orderId,
        isVerified: false,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Update store rating
      await this.updateStoreRating(id);

      return res.status(201).json({
        message: 'Review added successfully',
        review: newReview
      });

    } catch (error) {
      console.error('Add store review error:', error);
      
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

  // Get store reviews
  async getStoreReviews(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const [reviews, totalCountResult] = await Promise.all([
        db.select().from(storeReviews)
          .where(and(
            eq(storeReviews.storeId, id),
            eq(storeReviews.isApproved, true)
          ))
          .orderBy(desc(storeReviews.createdAt))
          .limit(limitNum)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(storeReviews)
          .where(and(
            eq(storeReviews.storeId, id),
            eq(storeReviews.isApproved, true)
          ))
      ]);
      
      const totalCount = totalCountResult[0].count;

      const totalPages = Math.ceil(totalCount / limitNum);

      return res.json({
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount: totalCount,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      });

    } catch (error) {
      console.error('Get store reviews error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Store Analytics
  async getStoreAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { id } = req.params;
      const { startDate, endDate, period = '7d' } = req.query;

      // Check store ownership
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, id)
      });

      if (!store) {
        return res.status(404).json({
          error: 'Store not found',
          code: 'STORE_NOT_FOUND'
        });
      }

      if (store.ownerId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Calculate date range
      let start = new Date();
      let end = new Date();

      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      } else {
        switch (period) {
          case '24h':
            start.setDate(start.getDate() - 1);
            break;
          case '7d':
            start.setDate(start.getDate() - 7);
            break;
          case '30d':
            start.setDate(start.getDate() - 30);
            break;
          case '90d':
            start.setDate(start.getDate() - 90);
            break;
          default:
            start.setDate(start.getDate() - 7);
        }
      }

      const analytics = await db.select().from(storeAnalytics)
        .where(and(
          eq(storeAnalytics.storeId, id),
          gte(storeAnalytics.date, start),
          lte(storeAnalytics.date, end)
        ))
        .orderBy(asc(storeAnalytics.date));

      // Calculate totals
      const totals = analytics.reduce((acc, day) => ({
        totalSales: acc.totalSales + parseFloat(day.totalSales || '0'),
        totalOrders: acc.totalOrders + (day.totalOrders || 0),
        pageViews: acc.pageViews + (day.pageViews || 0),
        uniqueVisitors: acc.uniqueVisitors + (day.uniqueVisitors || 0),
        newCustomers: acc.newCustomers + (day.newCustomers || 0),
        returningCustomers: acc.returningCustomers + (day.returningCustomers || 0)
      }), {
        totalSales: 0,
        totalOrders: 0,
        pageViews: 0,
        uniqueVisitors: 0,
        newCustomers: 0,
        returningCustomers: 0
      });

      return res.json({
        analytics,
        totals,
        period: {
          startDate: start,
          endDate: end,
          period
        }
      });

    } catch (error) {
      console.error('Get store analytics error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Store Categories
  async getStoreCategories(req: Request, res: Response): Promise<Response> {
    try {
      const categories = await db.select().from(storeCategories)
        .where(eq(storeCategories.isActive, true))
        .orderBy(asc(storeCategories.sortOrder), asc(storeCategories.name));

      return res.json({ categories });

    } catch (error) {
      console.error('Get store categories error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Helper method to update store rating
  private async updateStoreRating(storeId: string) {
    try {
      const reviews = await db.select().from(storeReviews)
        .where(and(
          eq(storeReviews.storeId, storeId),
          eq(storeReviews.isApproved, true)
        ));

      if (reviews.length === 0) return;

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = (totalRating / reviews.length).toFixed(2);

      await db
        .update(stores)
        .set({
          averageRating,
          totalReviews: reviews.length,
          updatedAt: new Date()
        })
        .where(eq(stores.id, storeId));

    } catch (error) {
      console.error('Update store rating error:', error);
    }
  }

  // Get user's stores (where user is staff)
  async getUserStores(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const userId = req.user.id;

      // Get all stores where user is staff
      const userStores = await db
        .select({
          staffId: storeStaff.id,
          storeId: stores.id,
          storeName: stores.name,
          storeSlug: stores.slug,
          storeDescription: stores.description,
          storeType: stores.type,
          storeStatus: stores.status,
          storeLogo: stores.logo,
          storeBanner: stores.banner,
          roleId: storeStaff.roleId,
          roleName: roles.name,
          roleSlug: roles.slug,
          isActive: storeStaff.isActive,
          hiredAt: storeStaff.hiredAt,
          createdAt: stores.createdAt
        })
        .from(storeStaff)
        .innerJoin(stores, eq(storeStaff.storeId, stores.id))
        .innerJoin(roles, eq(storeStaff.roleId, roles.id))
        .where(
          and(
            eq(storeStaff.userId, userId),
            eq(storeStaff.isActive, true)
          )
        )
        .orderBy(desc(storeStaff.hiredAt));

      return res.json({
        stores: userStores,
        count: userStores.length
      });

    } catch (error) {
      console.error('Get user stores error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get user's role in a specific store
  async getUserStoreRole(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { storeId } = req.params;
      const userId = req.user.id;

      // Get user's staff record and role for this store
      const [staffRecord] = await db
        .select({
          staffId: storeStaff.id,
          storeId: stores.id,
          storeName: stores.name,
          storeSlug: stores.slug,
          roleId: roles.id,
          roleName: roles.name,
          roleSlug: roles.slug,
          roleDescription: roles.description,
          isSystemRole: roles.isSystemRole,
          salary: storeStaff.salary,
          commission: storeStaff.commission,
          isActive: storeStaff.isActive,
          hiredAt: storeStaff.hiredAt
        })
        .from(storeStaff)
        .innerJoin(stores, eq(storeStaff.storeId, stores.id))
        .innerJoin(roles, eq(storeStaff.roleId, roles.id))
        .where(
          and(
            eq(storeStaff.userId, userId),
            eq(storeStaff.storeId, storeId),
            eq(storeStaff.isActive, true)
          )
        )
        .limit(1);

      if (!staffRecord) {
        return res.status(404).json({
          error: 'User is not staff in this store',
          code: 'NOT_STORE_STAFF'
        });
      }

      return res.json({
        staff: staffRecord
      });

    } catch (error) {
      console.error('Get user store role error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get user's permissions in a specific store
  async getUserStorePermissions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { storeId } = req.params;
      const userId = req.user.id;

      // First, get the user's role in this store
      const [staffRecord] = await db
        .select({
          roleId: storeStaff.roleId,
          roleName: roles.name,
          roleSlug: roles.slug
        })
        .from(storeStaff)
        .innerJoin(roles, eq(storeStaff.roleId, roles.id))
        .where(
          and(
            eq(storeStaff.userId, userId),
            eq(storeStaff.storeId, storeId),
            eq(storeStaff.isActive, true)
          )
        )
        .limit(1);

      if (!staffRecord) {
        return res.status(404).json({
          error: 'User is not staff in this store',
          code: 'NOT_STORE_STAFF'
        });
      }

      // Get all permissions for this role
      const rolePerms = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          slug: permissions.slug,
          description: permissions.description,
          resource: permissions.resource,
          action: permissions.action,
          isActive: permissions.isActive
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            eq(rolePermissions.roleId, staffRecord.roleId),
            eq(permissions.isActive, true)
          )
        )
        .orderBy(asc(permissions.resource), asc(permissions.action));

      // Group permissions by resource
      const permissionsByResource = rolePerms.reduce((acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = [];
        }
        acc[perm.resource].push(perm);
        return acc;
      }, {} as Record<string, typeof rolePerms>);

      return res.json({
        role: {
          id: staffRecord.roleId,
          name: staffRecord.roleName,
          slug: staffRecord.roleSlug
        },
        permissions: rolePerms,
        permissionsByResource,
        permissionSlugs: rolePerms.map(p => p.slug),
        count: rolePerms.length
      });

    } catch (error) {
      console.error('Get user store permissions error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get complete user store info (store + role + permissions)
  async getUserCompleteStoreInfo(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { storeId } = req.params;
      const userId = req.user.id;

      // Get staff record with store and role info
      const [staffRecord] = await db
        .select({
          staffId: storeStaff.id,
          storeId: stores.id,
          storeName: stores.name,
          storeSlug: stores.slug,
          storeDescription: stores.description,
          storeType: stores.type,
          storeStatus: stores.status,
          storeLogo: stores.logo,
          storeBanner: stores.banner,
          storeEmail: stores.email,
          storePhone: stores.phone,
          roleId: roles.id,
          roleName: roles.name,
          roleSlug: roles.slug,
          roleDescription: roles.description,
          isSystemRole: roles.isSystemRole,
          salary: storeStaff.salary,
          commission: storeStaff.commission,
          isActive: storeStaff.isActive,
          hiredAt: storeStaff.hiredAt
        })
        .from(storeStaff)
        .innerJoin(stores, eq(storeStaff.storeId, stores.id))
        .innerJoin(roles, eq(storeStaff.roleId, roles.id))
        .where(
          and(
            eq(storeStaff.userId, userId),
            eq(storeStaff.storeId, storeId),
            eq(storeStaff.isActive, true)
          )
        )
        .limit(1);

      if (!staffRecord) {
        return res.status(404).json({
          error: 'User is not staff in this store',
          code: 'NOT_STORE_STAFF'
        });
      }

      // Get permissions for this role
      const rolePerms = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          slug: permissions.slug,
          description: permissions.description,
          resource: permissions.resource,
          action: permissions.action
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            eq(rolePermissions.roleId, staffRecord.roleId),
            eq(permissions.isActive, true)
          )
        )
        .orderBy(asc(permissions.resource), asc(permissions.action));

      // Group permissions by resource
      const permissionsByResource = rolePerms.reduce((acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = [];
        }
        acc[perm.resource].push(perm);
        return acc;
      }, {} as Record<string, typeof rolePerms>);

      return res.json({
        staff: {
          id: staffRecord.staffId,
          isActive: staffRecord.isActive,
          hiredAt: staffRecord.hiredAt,
          salary: staffRecord.salary,
          commission: staffRecord.commission
        },
        store: {
          id: staffRecord.storeId,
          name: staffRecord.storeName,
          slug: staffRecord.storeSlug,
          description: staffRecord.storeDescription,
          type: staffRecord.storeType,
          status: staffRecord.storeStatus,
          logo: staffRecord.storeLogo,
          banner: staffRecord.storeBanner,
          email: staffRecord.storeEmail,
          phone: staffRecord.storePhone
        },
        role: {
          id: staffRecord.roleId,
          name: staffRecord.roleName,
          slug: staffRecord.roleSlug,
          description: staffRecord.roleDescription,
          isSystemRole: staffRecord.isSystemRole
        },
        permissions: rolePerms,
        permissionsByResource,
        permissionSlugs: rolePerms.map(p => p.slug)
      });

    } catch (error) {
      console.error('Get user complete store info error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}
