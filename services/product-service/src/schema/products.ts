import { pgTable, text, integer, decimal, boolean, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  shortDescription: text('short_description'),
  sku: text('sku').unique().notNull(),
  barcode: text('barcode'),
  categoryId: uuid('category_id').references(() => categories.id),
  brandId: uuid('brand_id').references(() => brands.id),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  weight: decimal('weight', { precision: 8, scale: 3 }),
  weightUnit: text('weight_unit').default('kg'),
  dimensions: jsonb('dimensions').$type<{
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  }>(),
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  isDigital: boolean('is_digital').default(false),
  requiresShipping: boolean('requires_shipping').default(true),
  taxable: boolean('taxable').default(true),
  trackQuantity: boolean('track_quantity').default(true),
  continueSellingWhenOutOfStock: boolean('continue_selling_when_out_of_stock').default(false),
  inventoryQuantity: integer('inventory_quantity').default(0),
  inventoryPolicy: text('inventory_policy').default('deny'), // deny, continue
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  seoUrl: text('seo_url'),
  tags: jsonb('tags').$type<string[]>(),
  options: jsonb('options').$type<ProductOption[]>(),
  images: jsonb('images').$type<ProductImage[]>(),
  vendor: text('vendor'),
  productType: text('product_type'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Product variants table
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  sku: text('sku').unique(),
  barcode: text('barcode'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  weight: decimal('weight', { precision: 8, scale: 3 }),
  inventoryQuantity: integer('inventory_quantity').default(0),
  inventoryItemId: uuid('inventory_item_id'),
  isDefault: boolean('is_default').default(false),
  position: integer('position').default(0),
  option1: text('option1'),
  option2: text('option2'),
  option3: text('option3'),
  image: jsonb('image').$type<ProductImage>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  parentId: uuid('parent_id').references(() => categories.id),
  image: text('image'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Brands table
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  logo: text('logo'),
  website: text('website'),
  isActive: boolean('is_active').default(true),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Product reviews table
export const productReviews = pgTable('product_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(), // Reference to user service
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  content: text('content'),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false),
  isApproved: boolean('is_approved').default(false),
  helpfulCount: integer('helpful_count').default(0),
  reportCount: integer('report_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Product collections/sets table
export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  image: text('image'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  conditions: jsonb('conditions').$type<CollectionCondition[]>(),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Many-to-many relationship between products and collections
export const productCollections = pgTable('product_collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Product attributes (for flexible product properties)
export const productAttributes = pgTable('product_attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  value: text('value').notNull(),
  type: text('type').default('text'), // text, number, boolean, date
  isFilterable: boolean('is_filterable').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  variants: many(productVariants),
  reviews: many(productReviews),
  collections: many(productCollections),
  attributes: many(productAttributes),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(productCollections),
}));

export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
  product: one(products, {
    fields: [productCollections.productId],
    references: [products.id],
  }),
  collection: one(collections, {
    fields: [productCollections.collectionId],
    references: [collections.id],
  }),
}));

export const productAttributesRelations = relations(productAttributes, ({ one }) => ({
  product: one(products, {
    fields: [productAttributes.productId],
    references: [products.id],
  }),
}));

// TypeScript types
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type ProductAttribute = typeof productAttributes.$inferSelect;
export type NewProductAttribute = typeof productAttributes.$inferInsert;

// Validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().min(1).max(100),
  barcode: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['kg', 'g', 'lb', 'oz']).default('kg'),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    unit: z.string().optional(),
  }).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  taxable: z.boolean().default(true),
  trackQuantity: z.boolean().default(true),
  continueSellingWhenOutOfStock: z.boolean().default(false),
  inventoryQuantity: z.number().int().min(0).default(0),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  seoUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  options: z.array(z.object({
    name: z.string(),
    values: z.array(z.string()),
  })).default([]),
  images: z.array(z.object({
    id: z.string().optional(),
    src: z.string().url(),
    alt: z.string().optional(),
    position: z.number().int().optional(),
  })).default([]),
  vendor: z.string().optional(),
  productType: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  slug: z.string().min(1).max(255),
  parentId: z.string().uuid().optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createBrandSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  slug: z.string().min(1).max(255),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  content: z.string().max(2000).optional(),
  isVerifiedPurchase: z.boolean().default(false),
});

// Helper types
export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductImage {
  id?: string;
  src: string;
  alt?: string;
  position?: number;
}

export interface CollectionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}