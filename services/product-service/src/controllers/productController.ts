import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  products, 
  productVariants,
  categories,
  productReviews,
  createProductSchema,
  updateProductSchema,
  createCategorySchema
} from '../schema/products';
import { eq, and, desc, asc, ilike, sql, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class ProductController {
  // Product CRUD operations
  async createProduct(req: Request, res: Response) {
    try {
      const validatedData = createProductSchema.parse(req.body);

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

      const productWithStats = {
        ...product,
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

  async updateProduct(req: Request, res: Response) {
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

  async deleteProduct(req: Request, res: Response) {
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
}
