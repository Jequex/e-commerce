import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  products, 
  productVariants,
  categories,
  productReviews,
  adminCategoryMarkups,
  coupons,
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  createCouponSchema,
  updateCouponSchema,
  adminMarkupSchema
} from '../schema/products';
import { eq, and, desc, asc, ilike, sql, or, isNull, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { uploadFileToMinio } from '../config/minio';
import { AuthenticatedRequest } from '../middleware/auth';

export class ProductController {
  // Helper to verify if user owns a specific store
  private async isUserStoreOwner(userId: string, storeId?: string | null, role?: string): Promise<boolean> {
    if (role === 'super_admin') return true;
    if (!storeId || !userId) return false;
    try {
      const storeServiceUrl = process.env.STORE_SERVICE_URL || 'http://store-service:3007';
      const res = await fetch(`${storeServiceUrl}/api/v1/stores/${storeId}`);
      if (!res.ok) return false;
      const data = await res.json();
      const store = data.store || data;
      return store && store.ownerId === userId;
    } catch (e) {
      console.error('Error verifying store owner:', e);
      return false;
    }
  }

  // Helper to fetch all store IDs owned by user
  private async getUserStoreIds(userId: string): Promise<string[]> {
    try {
      const storeServiceUrl = process.env.STORE_SERVICE_URL || 'http://store-service:3007';
      const res = await fetch(`${storeServiceUrl}/api/v1/stores?ownerId=${userId}&limit=100`);
      if (!res.ok) return [];
      const data = await res.json();
      const storeList = data.stores || [];
      return storeList.map((s: any) => s.id);
    } catch (e) {
      console.error('Error getting user store IDs:', e);
      return [];
    }
  }

  // Upload images or demo videos directly to MinIO
  async uploadMedia(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;
      const singleFile = req.file;

      const fileList: Express.Multer.File[] = [];

      if (singleFile) {
        fileList.push(singleFile);
      } else if (Array.isArray(files)) {
        fileList.push(...files);
      } else if (files && typeof files === 'object') {
        Object.values(files).forEach((val) => {
          if (Array.isArray(val)) {
            fileList.push(...val);
          }
        });
      }

      if (fileList.length === 0) {
        return res.status(400).json({
          error: 'No files provided for upload',
          code: 'NO_FILES',
        });
      }

      const uploadResults = await Promise.all(
        fileList.map(async (file) => {
          const result = await uploadFileToMinio(file.buffer, file.originalname, file.mimetype);
          return {
            url: result.url,
            fileName: result.fileName,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: result.size,
          };
        })
      );

      return res.status(200).json({
        message: 'Files uploaded to MinIO successfully',
        files: uploadResults,
        urls: uploadResults.map((r) => r.url),
        url: uploadResults[0]?.url,
      });
    } catch (error) {
      console.error('Upload media to MinIO error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to upload media to MinIO',
        code: 'UPLOAD_ERROR',
      });
    }
  }

  // Product CRUD operations
  async createProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = createProductSchema.parse(req.body);

      // Verify that the user owns the target store (unless super_admin)
      if (req.user && req.user.role !== 'super_admin') {
        let storeId = validatedData.storeId;
        if (storeId) {
          const isOwner = await this.isUserStoreOwner(req.user.id, storeId, req.user.role);
          if (!isOwner) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'You can only create products in your own stores'
            });
          }
        } else {
          // If no storeId passed, resolve default store for user
          const userStoreIds = await this.getUserStoreIds(req.user.id);
          if (userStoreIds.length === 0) {
            return res.status(400).json({
              error: 'No store found',
              code: 'NO_STORE',
              message: 'Please create a store before adding products'
            });
          }
          storeId = userStoreIds[0];
          validatedData.storeId = storeId;
        }
      }

      // Check if SKU already exists
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.sku, validatedData.sku)
      });

      if (existingProduct) {
        return res.status(409).json({
          error: 'Product with this SKU already exists',
          code: 'SKU_EXISTS'
        });
      }

      // Create the product
      const productData = {
        id: uuidv4(),
        ...validatedData,
        price: validatedData.price.toString(),
        compareAtPrice: validatedData.compareAtPrice ? validatedData.compareAtPrice.toString() : null,
        costPrice: validatedData.costPrice ? validatedData.costPrice.toString() : null,
        weight: validatedData.weight ? validatedData.weight.toString() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [newProduct] = await db.insert(products).values(productData).returning();

      res.status(201).json({
        message: 'Product created successfully',
        product: newProduct
      });

    } catch (error) {
      console.error('Create product error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        categoryId,
        storeId,
        isActive,
        isFeatured,
        minPrice,
        maxPrice,
        tags
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      const conditions = [];
      
      if (search) {
        conditions.push(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.description, `%${search}%`),
            ilike(products.sku, `%${search}%`)
          )
        );
      }

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId as string));
      }

      if (storeId) {
        conditions.push(eq(products.storeId, storeId as string));
      } else if (req.query.storeIds) {
        const ids = (req.query.storeIds as string).split(',').map(s => s.trim()).filter(Boolean);
        if (ids.length > 0) {
          conditions.push(inArray(products.storeId, ids));
        }
      }

      if (isActive !== undefined) {
        conditions.push(eq(products.isActive, isActive === 'true'));
      }

      if (isFeatured !== undefined) {
        conditions.push(eq(products.isFeatured, isFeatured === 'true'));
      }

      if (minPrice) {
        conditions.push(sql`${products.price} >= ${minPrice}`);
      }

      if (maxPrice) {
        conditions.push(sql`${products.price} <= ${maxPrice}`);
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        conditions.push(sql`${products.tags} ?| array[${tagArray.join(',')}]`);
      }

      // Build order by
      let orderByClause;
      const sortField = sortBy as string;
      
      switch (sortField) {
        case 'id':
          orderByClause = sortOrder === 'asc' ? asc(products.id) : desc(products.id);
          break;
        case 'name':
          orderByClause = sortOrder === 'asc' ? asc(products.name) : desc(products.name);
          break;
        case 'sku':
          orderByClause = sortOrder === 'asc' ? asc(products.sku) : desc(products.sku);
          break;
        case 'price':
          orderByClause = sortOrder === 'asc' ? asc(products.price) : desc(products.price);
          break;
        case 'updatedAt':
          orderByClause = sortOrder === 'asc' ? asc(products.updatedAt) : desc(products.updatedAt);
          break;
        case 'isActive':
          orderByClause = sortOrder === 'asc' ? asc(products.isActive) : desc(products.isActive);
          break;
        case 'isFeatured':
          orderByClause = sortOrder === 'asc' ? asc(products.isFeatured) : desc(products.isFeatured);
          break;
        default:
          orderByClause = desc(products.createdAt);
          break;
      }

      // Get products with relations
      const productList = await db.query.products.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          category: true,
          variants: {
            where: eq(productVariants.isDefault, true),
            limit: 1
          }
        },
        orderBy: orderByClause,
        limit: limitNum,
        offset: offset
      });

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const totalPages = Math.ceil(count / limitNum);

      res.json({
        products: productList,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      });

    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await db.query.products.findFirst({
        where: eq(products.id, id),
        with: {
          category: true,
          variants: {
            orderBy: asc(productVariants.position)
          },
          reviews: {
            where: eq(productReviews.isApproved, true),
            orderBy: desc(productReviews.createdAt),
            limit: 10
          },
          attributes: true
        }
      });

      if (!product) {
        return res.status(404).json({
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Calculate average rating
      const reviewStats = await db
        .select({
          averageRating: sql<number>`AVG(${productReviews.rating})`,
          reviewCount: sql<number>`COUNT(${productReviews.id})`
        })
        .from(productReviews)
        .where(and(
          eq(productReviews.productId, id),
          eq(productReviews.isApproved, true)
        ));

      // Fetch store details if storeId exists
      let store = null;
      if (product.storeId) {
        try {
          const storeServiceUrl = process.env.STORE_SERVICE_URL || 'http://store-service:3007';
          const storeResponse = await fetch(`${storeServiceUrl}/api/v1/stores/${product.storeId}`);
          
          if (storeResponse.ok) {
            const storeData = await storeResponse.json();
            store = storeData.store || storeData;
          }
        } catch (storeError) {
          console.error('Error fetching store details:', storeError);
          // Continue without store details if fetch fails
        }
      }

      const productWithStats = {
        ...product,
        store,
        reviewStats: {
          averageRating: reviewStats[0]?.averageRating ? Number(reviewStats[0].averageRating.toFixed(2)) : 0,
          reviewCount: reviewStats[0]?.reviewCount || 0
        }
      };

      res.json({
        product: productWithStats
      });

    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async updateProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateProductSchema.parse(req.body);

      // Check if product exists
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.id, id)
      });

      if (!existingProduct) {
        return res.status(404).json({
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Check if user is allowed to modify this product (must be super_admin or owner of the product's store)
      if (req.user && req.user.role !== 'super_admin') {
        const isOwner = await this.isUserStoreOwner(req.user.id, existingProduct.storeId, req.user.role);
        if (!isOwner) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You can only modify products in your own stores'
          });
        }

        if (validatedData.storeId && validatedData.storeId !== existingProduct.storeId) {
          const isTargetStoreOwner = await this.isUserStoreOwner(req.user.id, validatedData.storeId, req.user.role);
          if (!isTargetStoreOwner) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'Target store does not belong to your account'
            });
          }
        }
      }

      // Check SKU uniqueness if updating SKU
      if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
        const skuExists = await db.query.products.findFirst({
          where: and(
            eq(products.sku, validatedData.sku),
            sql`${products.id} != ${id}`
          )
        });

        if (skuExists) {
          return res.status(409).json({
            error: 'Product with this SKU already exists',
            code: 'SKU_EXISTS'
          });
        }
      }

      // Prepare update data with proper type conversions
      const updateData: any = {
        ...validatedData,
        updatedAt: new Date()
      };

      // Convert numeric fields to strings if they exist
      if (validatedData.price !== undefined) {
        updateData.price = validatedData.price.toString();
      }
      if (validatedData.compareAtPrice !== undefined) {
        updateData.compareAtPrice = validatedData.compareAtPrice ? validatedData.compareAtPrice.toString() : null;
      }
      if (validatedData.costPrice !== undefined) {
        updateData.costPrice = validatedData.costPrice ? validatedData.costPrice.toString() : null;
      }
      if (validatedData.weight !== undefined) {
        updateData.weight = validatedData.weight ? validatedData.weight.toString() : null;
      }

      // Update the product
      const [updatedProduct] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();

      res.json({
        message: 'Product updated successfully',
        product: updatedProduct
      });

    } catch (error) {
      console.error('Update product error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async deleteProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.id, id)
      });

      if (!existingProduct) {
        return res.status(404).json({
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Check if user is allowed to delete this product (must be super_admin or owner of the product's store)
      if (req.user && req.user.role !== 'super_admin') {
        const isOwner = await this.isUserStoreOwner(req.user.id, existingProduct.storeId, req.user.role);
        if (!isOwner) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You can only delete products in your own stores'
          });
        }
      }

      // Soft delete by setting isActive to false
      await db
        .update(products)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(products.id, id));

      res.json({
        message: 'Product deleted successfully'
      });

    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Category CRUD operations
  async createCategory(req: Request, res: Response) {
    try {
      const validatedData = createCategorySchema.parse(req.body);

      // Check if slug already exists
      const existingCategory = await db.query.categories.findFirst({
        where: eq(categories.slug, validatedData.slug)
      });

      if (existingCategory) {
        return res.status(409).json({
          error: 'Category with this slug already exists',
          code: 'SLUG_EXISTS'
        });
      }

      const [newCategory] = await db.insert(categories).values({
        id: uuidv4(),
        ...validatedData,
        defaultMarkupPercentage: validatedData.defaultMarkupPercentage !== undefined ? String(validatedData.defaultMarkupPercentage) : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      res.status(201).json({
        message: 'Category created successfully',
        category: newCategory
      });

    } catch (error) {
      console.error('Create category error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const { includeProducts = false } = req.query;

      const categoryList = await db.query.categories.findMany({
        with: {
          parent: true,
          children: true,
          ...(includeProducts === 'true' && {
            products: {
              where: eq(products.isActive, true),
              limit: 5
            }
          })
        },
        orderBy: [asc(categories.sortOrder), asc(categories.name)]
      });

      res.json({
        categories: categoryList
      });

    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async getCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await db.query.categories.findFirst({
        where: eq(categories.id, id),
        with: {
          parent: true,
          children: true,
          products: {
            where: eq(products.isActive, true),
            with: {
            },
            orderBy: desc(products.createdAt),
            limit: 20
          }
        }
      });

      if (!category) {
        return res.status(404).json({
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      res.json({
        category
      });

    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = createCategorySchema.parse(req.body);

      // Check if category exists
      const existingCategory = await db.query.categories.findFirst({
        where: eq(categories.id, id)
      });

      if (!existingCategory) {
        return res.status(404).json({
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      // Check if slug is being changed and if it's already in use
      if (validatedData.slug !== existingCategory.slug) {
        const slugExists = await db.query.categories.findFirst({
          where: and(
            eq(categories.slug, validatedData.slug),
            sql`${categories.id} != ${id}`
          )
        });

        if (slugExists) {
          return res.status(409).json({
            error: 'Category with this slug already exists',
            code: 'SLUG_EXISTS'
          });
        }
      }

      const [updatedCategory] = await db
        .update(categories)
        .set({
          ...validatedData,
          defaultMarkupPercentage: validatedData.defaultMarkupPercentage !== undefined ? String(validatedData.defaultMarkupPercentage) : undefined,
          updatedAt: new Date()
        })
        .where(eq(categories.id, id))
        .returning();

      res.json({
        message: 'Category updated successfully',
        category: updatedCategory
      });

    } catch (error) {
      console.error('Update category error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if category exists
      const existingCategory = await db.query.categories.findFirst({
        where: eq(categories.id, id),
        with: {
          children: true
        }
      });

      if (!existingCategory) {
        return res.status(404).json({
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      // Check if category has products
      const productsInCategory = await db.query.products.findFirst({
        where: eq(products.categoryId, id)
      });

      if (productsInCategory) {
        return res.status(409).json({
          error: 'Cannot delete category with associated products',
          code: 'CATEGORY_HAS_PRODUCTS',
          message: 'Please remove or reassign products before deleting this category'
        });
      }

      // Check if category has subcategories
      if (existingCategory.children && existingCategory.children.length > 0) {
        return res.status(409).json({
          error: 'Cannot delete category with subcategories',
          code: 'CATEGORY_HAS_CHILDREN',
          message: 'Please delete subcategories first before deleting this category'
        });
      }

      // Delete the category
      await db
        .delete(categories)
        .where(eq(categories.id, id));

      res.json({
        message: 'Category deleted successfully'
      });

    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Product search
  async searchProducts(req: Request, res: Response) {
    try {
      const { 
        q: query,
        category,
        minPrice,
        maxPrice,
        rating,
        inStock,
        page = 1,
        limit = 20
      } = req.query;

      if (!query) {
        return res.status(400).json({
          error: 'Search query is required',
          code: 'QUERY_REQUIRED'
        });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build search conditions
      const searchConditions = [
        eq(products.isActive, true),
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.description, `%${query}%`),
          ilike(products.sku, `%${query}%`),
          sql`${products.tags} ?| array[${query}]`
        )
      ];

      if (category) {
        searchConditions.push(eq(products.categoryId, category as string));
      }

      if (minPrice) {
        searchConditions.push(sql`${products.price} >= ${minPrice}`);
      }

      if (maxPrice) {
        searchConditions.push(sql`${products.price} <= ${maxPrice}`);
      }

      if (inStock === 'true') {
        searchConditions.push(sql`${products.inventoryQuantity} > 0`);
      }

      const searchResults = await db.query.products.findMany({
        where: and(...searchConditions),
        with: {
          category: true,
          variants: {
            where: eq(productVariants.isDefault, true),
            limit: 1
          }
        },
        orderBy: [
          // Prioritize exact matches in name
          sql`CASE WHEN ${products.name} ILIKE ${query} THEN 1 ELSE 2 END`,
          desc(products.isFeatured),
          desc(products.createdAt)
        ],
        limit: limitNum,
        offset: offset
      });

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...searchConditions));

      const totalPages = Math.ceil(count / limitNum);

      res.json({
        products: searchResults,
        query,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      });

    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get featured products
  async getFeaturedProducts(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;
      const limitNum = parseInt(limit as string, 10);

      const featuredProducts = await db.query.products.findMany({
        where: and(
          eq(products.isActive, true),
          eq(products.isFeatured, true)
        ),
        with: {
          category: true,
        },
        orderBy: desc(products.createdAt),
        limit: limitNum
      });

      res.json({
        products: featuredProducts
      });

    } catch (error) {
      console.error('Get featured products error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get products owned by the authenticated admin across their stores
  async getMyProducts(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required', code: 'NO_AUTH' });
      }

      const { storeId, search, categoryId, isActive, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 50 } = req.query;

      let targetStoreIds: string[] = [];

      if (req.user.role === 'super_admin') {
        if (storeId) targetStoreIds = [storeId as string];
      } else {
        const userStoreIds = await this.getUserStoreIds(req.user.id);
        if (userStoreIds.length === 0) {
          return res.json({ products: [], total: 0, page: 1, totalPages: 0 });
        }
        if (storeId && typeof storeId === 'string') {
          if (!userStoreIds.includes(storeId)) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'You do not own this store'
            });
          }
          targetStoreIds = [storeId];
        } else {
          targetStoreIds = userStoreIds;
        }
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const offset = (pageNum - 1) * limitNum;

      const conditions = [];
      if (targetStoreIds.length > 0) {
        conditions.push(inArray(products.storeId, targetStoreIds));
      }

      if (search) {
        conditions.push(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.description, `%${search}%`),
            ilike(products.sku, `%${search}%`)
          )
        );
      }

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId as string));
      }

      if (isActive !== undefined) {
        conditions.push(eq(products.isActive, isActive === 'true'));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const orderDirection = sortOrder === 'asc' ? asc : desc;

      const [productList, totalCountResult] = await Promise.all([
        db.query.products.findMany({
          where: whereClause,
          orderBy: orderDirection(products.createdAt),
          limit: limitNum,
          offset: offset,
          with: {
            category: true,
            variants: true
          }
        }),
        db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause)
      ]);

      const total = Number(totalCountResult[0]?.count || 0);

      return res.json({
        products: productList,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (error) {
      console.error('Get my products error:', error);
      return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  // Get products by store ID
  async getProductsByStore(req: Request, res: Response) {
    try {
      const { storeId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        categoryId,
        isActive,
        isFeatured,
        minPrice,
        maxPrice
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      const conditions = [eq(products.storeId, storeId)];
      
      if (search) {
        const searchCondition = or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`),
          ilike(products.sku, `%${search}%`)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId as string));
      }


      if (isActive !== undefined) {
        conditions.push(eq(products.isActive, isActive === 'true'));
      }

      if (isFeatured !== undefined) {
        conditions.push(eq(products.isFeatured, isFeatured === 'true'));
      }

      if (minPrice) {
        conditions.push(sql`${products.price} >= ${minPrice}`);
      }

      if (maxPrice) {
        conditions.push(sql`${products.price} <= ${maxPrice}`);
      }

      // Build order by
      let orderByClause;
      const sortField = sortBy as string;
      
      switch (sortField) {
        case 'name':
          orderByClause = sortOrder === 'asc' ? asc(products.name) : desc(products.name);
          break;
        case 'price':
          orderByClause = sortOrder === 'asc' ? asc(products.price) : desc(products.price);
          break;
        case 'createdAt':
        default:
          orderByClause = sortOrder === 'asc' ? asc(products.createdAt) : desc(products.createdAt);
          break;
      }

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(and(...conditions));

      // Get products with relations
      const storeProducts = await db.query.products.findMany({
        where: and(...conditions),
        with: {
          category: true,
          variants: true
        },
        orderBy: orderByClause,
        limit: limitNum,
        offset
      });

      res.json({
        products: storeProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages: Math.ceil(count / limitNum)
        }
      });

    } catch (error) {
      console.error('Get products by store error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get store product statistics
  async getStoreProductStats(req: Request, res: Response) {
    try {
      const { storeId } = req.params;

      const [stats] = await db
        .select({
          totalProducts: sql<number>`count(*)::int`,
          activeProducts: sql<number>`count(*) filter (where ${products.isActive} = true)::int`,
          inactiveProducts: sql<number>`count(*) filter (where ${products.isActive} = false)::int`,
          featuredProducts: sql<number>`count(*) filter (where ${products.isFeatured} = true)::int`,
          totalInventory: sql<number>`sum(${products.inventoryQuantity})::int`,
          avgPrice: sql<string>`avg(${products.price})::numeric(10,2)`
        })
        .from(products)
        .where(eq(products.storeId, storeId));

      res.json({
        storeId,
        statistics: {
          totalProducts: stats.totalProducts || 0,
          activeProducts: stats.activeProducts || 0,
          inactiveProducts: stats.inactiveProducts || 0,
          featuredProducts: stats.featuredProducts || 0,
          totalInventory: stats.totalInventory || 0,
          averagePrice: stats.avgPrice || '0.00'
        }
      });

    } catch (error) {
      console.error('Get store product stats error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get store featured products
  async getStoreFeaturedProducts(req: Request, res: Response) {
    try {
      const { storeId } = req.params;
      const { limit = 10 } = req.query;
      const limitNum = parseInt(limit as string, 10);

      const featuredProducts = await db.query.products.findMany({
        where: and(
          eq(products.storeId, storeId),
          eq(products.isActive, true),
          eq(products.isFeatured, true)
        ),
        with: {
          category: true,
        },
        orderBy: desc(products.createdAt),
        limit: limitNum
      });

      res.json({
        storeId,
        products: featuredProducts,
        count: featuredProducts.length
      });

    } catch (error) {
      console.error('Get store featured products error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // ==================== COUPONS & PROMOTIONS ====================

  async getCoupons(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      let queryConditions = [];

      // If user is a merchant admin, scope to their stores and coupons they created
      if (user?.role === 'admin') {
        const userStoreIds = await this.getUserStoreIds(user.id);
        if (userStoreIds.length === 0) {
          queryConditions.push(eq(coupons.createdById, user.id));
        } else {
          queryConditions.push(
            or(
              inArray(coupons.storeId, userStoreIds),
              eq(coupons.createdById, user.id)
            )
          );
        }
      }

      const allCoupons = await db
        .select()
        .from(coupons)
        .where(queryConditions.length > 0 ? and(...queryConditions) : undefined)
        .orderBy(desc(coupons.createdAt));

      res.json({
        coupons: allCoupons
      });
    } catch (error) {
      console.error('Get coupons error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async createCoupon(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const validatedData = createCouponSchema.parse(req.body);
      const normalizedCode = validatedData.code.trim().toUpperCase();

      let targetStoreId = validatedData.storeId || user?.storeId || null;

      // Merchant admin store & product scoping
      if (user?.role === 'admin') {
        const userStoreIds = await this.getUserStoreIds(user.id);
        if (userStoreIds.length === 0) {
          return res.status(400).json({
            error: 'No store found. Please create a store first before creating coupons.',
            code: 'NO_STORE'
          });
        }

        if (targetStoreId && !userStoreIds.includes(targetStoreId)) {
          return res.status(403).json({
            error: 'You do not have permission to create a coupon for this store',
            code: 'FORBIDDEN_STORE'
          });
        }

        if (!targetStoreId) {
          targetStoreId = userStoreIds[0];
        }

        // Verify products belong to merchant's stores
        if (validatedData.appliesTo === 'specific_products' && validatedData.productIds && validatedData.productIds.length > 0) {
          const prods = await db
            .select({ id: products.id, storeId: products.storeId })
            .from(products)
            .where(inArray(products.id, validatedData.productIds));

          const unownedProds = prods.filter(p => !p.storeId || !userStoreIds.includes(p.storeId));
          if (unownedProds.length > 0 || prods.length !== validatedData.productIds.length) {
            return res.status(403).json({
              error: 'You can only assign coupons to products in your stores',
              code: 'UNAUTHORIZED_PRODUCT_COUPON'
            });
          }
        }
      }

      // Check if code exists
      const existing = await db.query.coupons.findFirst({
        where: eq(coupons.code, normalizedCode)
      });

      if (existing) {
        return res.status(409).json({
          error: 'Coupon code already exists',
          code: 'CODE_EXISTS'
        });
      }

      const [newCoupon] = await db.insert(coupons).values({
        id: uuidv4(),
        code: normalizedCode,
        description: validatedData.description,
        discountType: validatedData.discountType,
        discountValue: String(validatedData.discountValue),
        appliesTo: validatedData.appliesTo,
        productIds: validatedData.productIds,
        minPurchaseAmount: String(validatedData.minPurchaseAmount || 0),
        maxDiscountAmount: validatedData.maxDiscountAmount ? String(validatedData.maxDiscountAmount) : null,
        usageLimit: validatedData.usageLimit || null,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        isActive: validatedData.isActive !== false,
        storeId: targetStoreId,
        createdById: user?.id || null,
        createdByName: user?.email || null,
        createdByRole: user?.role || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      res.status(201).json({
        message: 'Coupon created successfully',
        coupon: newCoupon
      });
    } catch (error) {
      console.error('Create coupon error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async updateCoupon(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user;
      const validatedData = updateCouponSchema.parse(req.body);

      const existing = await db.query.coupons.findFirst({
        where: eq(coupons.id, id)
      });

      if (!existing) {
        return res.status(404).json({
          error: 'Coupon not found',
          code: 'NOT_FOUND'
        });
      }

      // Check merchant permissions & product scope
      if (user?.role === 'admin') {
        const userStoreIds = await this.getUserStoreIds(user.id);
        const isOwner = existing.createdById === user.id || (existing.storeId && userStoreIds.includes(existing.storeId));
        if (!isOwner) {
          return res.status(403).json({
            error: 'You do not have permission to modify this coupon',
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }

        if (validatedData.appliesTo === 'specific_products' && validatedData.productIds && validatedData.productIds.length > 0) {
          const prods = await db
            .select({ id: products.id, storeId: products.storeId })
            .from(products)
            .where(inArray(products.id, validatedData.productIds));

          const unownedProds = prods.filter(p => !p.storeId || !userStoreIds.includes(p.storeId));
          if (unownedProds.length > 0 || prods.length !== validatedData.productIds.length) {
            return res.status(403).json({
              error: 'You can only assign coupons to products in your stores',
              code: 'UNAUTHORIZED_PRODUCT_COUPON'
            });
          }
        }
      }

      let normalizedCode = existing.code;
      if (validatedData.code) {
        normalizedCode = validatedData.code.trim().toUpperCase();
        if (normalizedCode !== existing.code) {
          const codeTaken = await db.query.coupons.findFirst({
            where: and(eq(coupons.code, normalizedCode), sql`${coupons.id} != ${id}`)
          });
          if (codeTaken) {
            return res.status(409).json({
              error: 'Coupon code already in use',
              code: 'CODE_EXISTS'
            });
          }
        }
      }

      const updatePayload: Record<string, any> = {
        updatedAt: new Date()
      };

      if (validatedData.code) updatePayload.code = normalizedCode;
      if (validatedData.description !== undefined) updatePayload.description = validatedData.description;
      if (validatedData.discountType !== undefined) updatePayload.discountType = validatedData.discountType;
      if (validatedData.discountValue !== undefined) updatePayload.discountValue = String(validatedData.discountValue);
      if (validatedData.appliesTo !== undefined) updatePayload.appliesTo = validatedData.appliesTo;
      if (validatedData.productIds !== undefined) updatePayload.productIds = validatedData.productIds;
      if (validatedData.minPurchaseAmount !== undefined) updatePayload.minPurchaseAmount = String(validatedData.minPurchaseAmount);
      if (validatedData.maxDiscountAmount !== undefined) {
        updatePayload.maxDiscountAmount = validatedData.maxDiscountAmount ? String(validatedData.maxDiscountAmount) : null;
      }
      if (validatedData.usageLimit !== undefined) updatePayload.usageLimit = validatedData.usageLimit;
      if (validatedData.startDate !== undefined) {
        updatePayload.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
      }
      if (validatedData.endDate !== undefined) {
        updatePayload.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
      }
      if (validatedData.isActive !== undefined) updatePayload.isActive = validatedData.isActive;

      const [updated] = await db
        .update(coupons)
        .set(updatePayload)
        .where(eq(coupons.id, id))
        .returning();

      res.json({
        message: 'Coupon updated successfully',
        coupon: updated
      });
    } catch (error) {
      console.error('Update coupon error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async deleteCoupon(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user;

      const existing = await db.query.coupons.findFirst({
        where: eq(coupons.id, id)
      });

      if (!existing) {
        return res.status(404).json({
          error: 'Coupon not found',
          code: 'NOT_FOUND'
        });
      }

      if (user?.role === 'admin') {
        const userStoreIds = await this.getUserStoreIds(user.id);
        const isOwner = existing.createdById === user.id || (existing.storeId && userStoreIds.includes(existing.storeId));
        if (!isOwner) {
          return res.status(403).json({
            error: 'You do not have permission to delete this coupon',
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }
      }

      const [deleted] = await db.delete(coupons).where(eq(coupons.id, id)).returning();
      res.json({
        message: 'Coupon deleted successfully'
      });
    } catch (error) {
      console.error('Delete coupon error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async validateCoupon(req: Request, res: Response) {
    try {
      const { code, cartTotal = 0, productIds = [] } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          valid: false,
          message: 'Coupon code is required'
        });
      }

      const normalizedCode = code.trim().toUpperCase();
      const coupon = await db.query.coupons.findFirst({
        where: eq(coupons.code, normalizedCode)
      });

      if (!coupon || !coupon.isActive) {
        return res.status(404).json({
          valid: false,
          message: 'Invalid or expired coupon code'
        });
      }

      const now = new Date();
      if (coupon.startDate && new Date(coupon.startDate) > now) {
        return res.status(400).json({
          valid: false,
          message: 'This coupon is not active yet'
        });
      }

      if (coupon.endDate && new Date(coupon.endDate) < now) {
        return res.status(400).json({
          valid: false,
          message: 'This coupon has expired'
        });
      }

      if (coupon.usageLimit && (coupon.timesUsed || 0) >= coupon.usageLimit) {
        return res.status(400).json({
          valid: false,
          message: 'This coupon has reached its maximum usage limit'
        });
      }

      const total = Number(cartTotal);
      const minPurchase = Number(coupon.minPurchaseAmount || 0);
      if (total < minPurchase) {
        return res.status(400).json({
          valid: false,
          message: `Minimum order amount of $${minPurchase.toFixed(2)} required for this coupon`
        });
      }

      if (coupon.appliesTo === 'specific_products') {
        const couponProducts = Array.isArray(coupon.productIds) ? coupon.productIds : [];
        const hasMatchingProduct = Array.isArray(productIds) && productIds.some(pId => couponProducts.includes(pId));
        if (!hasMatchingProduct) {
          return res.status(400).json({
            valid: false,
            message: 'Coupon does not apply to any products in your cart'
          });
        }
      }

      let discountAmount = 0;
      const discountVal = Number(coupon.discountValue);

      if (coupon.discountType === 'percentage') {
        discountAmount = (total * discountVal) / 100;
        if (coupon.maxDiscountAmount) {
          const maxDisc = Number(coupon.maxDiscountAmount);
          if (discountAmount > maxDisc) {
            discountAmount = maxDisc;
          }
        }
      } else {
        discountAmount = discountVal;
      }

      if (discountAmount > total) {
        discountAmount = total;
      }

      discountAmount = Math.round(discountAmount * 100) / 100;
      const finalTotal = Math.max(0, Math.round((total - discountAmount) * 100) / 100);

      res.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        discountAmount,
        finalTotal
      });
    } catch (error) {
      console.error('Validate coupon error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // ==================== PROFIT MARKUPS ====================

  async getCategoryMarkups(req: AuthenticatedRequest, res: Response) {
    try {
      const allCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          defaultMarkupPercentage: categories.defaultMarkupPercentage,
          sortOrder: categories.sortOrder,
          isActive: categories.isActive
        })
        .from(categories)
        .orderBy(asc(categories.name));

      const adminMarkups = await db
        .select()
        .from(adminCategoryMarkups)
        .orderBy(desc(adminCategoryMarkups.updatedAt));

      res.json({
        categories: allCategories,
        adminMarkups
      });
    } catch (error) {
      console.error('Get category markups error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async updateCategoryDefaultMarkup(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { defaultMarkupPercentage } = req.body;

      if (defaultMarkupPercentage === undefined || isNaN(Number(defaultMarkupPercentage))) {
        return res.status(400).json({
          error: 'Valid defaultMarkupPercentage number is required',
          code: 'INVALID_MARKUP'
        });
      }

      const markupVal = Math.max(0, Math.min(1000, Number(defaultMarkupPercentage)));

      const [updated] = await db
        .update(categories)
        .set({
          defaultMarkupPercentage: markupVal.toFixed(2),
          updatedAt: new Date()
        })
        .where(eq(categories.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({
          error: 'Category not found',
          code: 'NOT_FOUND'
        });
      }

      res.json({
        message: 'Default category markup updated successfully',
        category: updated
      });
    } catch (error) {
      console.error('Update category default markup error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async setAdminCategoryMarkup(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = adminMarkupSchema.parse(req.body);

      // Check if override already exists for this (adminId, categoryId)
      const existing = await db.query.adminCategoryMarkups.findFirst({
        where: and(
          eq(adminCategoryMarkups.adminId, validatedData.adminId),
          eq(adminCategoryMarkups.categoryId, validatedData.categoryId)
        )
      });

      let result;
      if (existing) {
        const [updated] = await db
          .update(adminCategoryMarkups)
          .set({
            markupPercentage: validatedData.markupPercentage.toFixed(2),
            adminName: validatedData.adminName || existing.adminName,
            adminEmail: validatedData.adminEmail || existing.adminEmail,
            updatedAt: new Date()
          })
          .where(eq(adminCategoryMarkups.id, existing.id))
          .returning();
        result = updated;
      } else {
        const [inserted] = await db
          .insert(adminCategoryMarkups)
          .values({
            id: uuidv4(),
            adminId: validatedData.adminId,
            adminName: validatedData.adminName || null,
            adminEmail: validatedData.adminEmail || null,
            categoryId: validatedData.categoryId,
            markupPercentage: validatedData.markupPercentage.toFixed(2),
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        result = inserted;
      }

      res.json({
        message: 'Admin category markup saved successfully',
        markup: result
      });
    } catch (error) {
      console.error('Set admin category markup error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async deleteAdminCategoryMarkup(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const [deleted] = await db.delete(adminCategoryMarkups).where(eq(adminCategoryMarkups.id, id)).returning();
      if (!deleted) {
        return res.status(404).json({
          error: 'Admin markup override not found',
          code: 'NOT_FOUND'
        });
      }
      res.json({
        message: 'Admin markup override removed successfully'
      });
    } catch (error) {
      console.error('Delete admin category markup error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async updateAdminCategoryMarkupById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { markupPercentage, adminId, categoryId, adminName, adminEmail } = req.body;

      if (markupPercentage === undefined || isNaN(Number(markupPercentage))) {
        return res.status(400).json({
          error: 'Valid markup percentage is required',
          code: 'INVALID_MARKUP'
        });
      }

      const updateFields: any = {
        markupPercentage: Number(markupPercentage).toFixed(2),
        updatedAt: new Date()
      };
      if (adminId) updateFields.adminId = adminId;
      if (categoryId) updateFields.categoryId = categoryId;
      if (adminName !== undefined) updateFields.adminName = adminName;
      if (adminEmail !== undefined) updateFields.adminEmail = adminEmail;

      const [updated] = await db
        .update(adminCategoryMarkups)
        .set(updateFields)
        .where(eq(adminCategoryMarkups.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({
          error: 'Admin markup override not found',
          code: 'NOT_FOUND'
        });
      }

      res.json({
        message: 'Admin markup override updated successfully',
        markup: updated
      });
    } catch (error) {
      console.error('Update admin markup override error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}
