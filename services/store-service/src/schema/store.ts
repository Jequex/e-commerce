import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  decimal, 
  integer,
  jsonb,
  time,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Enums
export const storeStatusEnum = pgEnum('store_status', ['active', 'inactive', 'pending_approval', 'suspended', 'closed']);
export const storeTypeEnum = pgEnum('store_type', ['physical', 'online', 'hybrid']);
export const dayOfWeekEnum = pgEnum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

// Store Categories
export const storeCategories = pgTable('store_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  image: varchar('image', { length: 500 }),
  parentId: uuid('parent_id'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Permissions
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  resource: varchar('resource', { length: 50 }).notNull(), // e.g., 'stores', 'products', 'orders'
  action: varchar('action', { length: 50 }).notNull(), // e.g., 'create', 'read', 'update', 'delete'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Roles
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  level: integer('level').notNull().default(1), // Hierarchy level for role comparison
  isSystemRole: boolean('is_system_role').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Role Permissions (Many-to-Many relationship)
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Stores
export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(), // Reference to users table in auth service
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  description: text('description'),
  type: storeTypeEnum('type').notNull().default('physical'),
  status: storeStatusEnum('status').notNull().default('pending_approval'),
  
  // Contact Information
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 500 }),
  
  // Business Information
  businessLicense: varchar('business_license', { length: 100 }),
  taxId: varchar('tax_id', { length: 100 }),
  
  // Store Settings
  categoryId: uuid('category_id').references(() => storeCategories.id),
  allowOnlineOrders: boolean('allow_online_orders').default(true),
  allowPickup: boolean('allow_pickup').default(true),
  allowDelivery: boolean('allow_delivery').default(false),
  deliveryRadius: decimal('delivery_radius', { precision: 10, scale: 2 }),
  minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
  
  // Media
  logo: varchar('logo', { length: 500 }),
  banner: varchar('banner', { length: 500 }),
  images: jsonb('images'), // Array of image URLs
  
  // Analytics
  totalOrders: integer('total_orders').default(0),
  totalRevenue: decimal('total_revenue', { precision: 15, scale: 2 }).default('0'),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  totalReviews: integer('total_reviews').default(0),
  
  // Verification
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  
  // Metadata
  metadata: jsonb('metadata'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Store Addresses
export const storeAddresses = pgTable('store_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Address Information
  type: varchar('type', { length: 50 }).notNull().default('primary'), // primary, warehouse, pickup_point
  streetAddress: varchar('street_address', { length: 500 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  
  // Geolocation
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  
  // Address Settings
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Store Business Hours
export const storeHours = pgTable('store_hours', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
  openTime: time('open_time'),
  closeTime: time('close_time'),
  isClosed: boolean('is_closed').default(false),
  isHoliday: boolean('is_holiday').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Store Staff
export const storeStaff = pgTable('store_staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(), // Reference to users table in auth service
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  salary: decimal('salary', { precision: 12, scale: 2 }),
  commission: decimal('commission', { precision: 5, scale: 2 }), // Percentage
  isActive: boolean('is_active').default(true),
  hiredAt: timestamp('hired_at').defaultNow(),
  terminatedAt: timestamp('terminated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Store Reviews
export const storeReviews = pgTable('store_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(), // Reference to users table in auth service
  orderId: uuid('order_id'), // Reference to orders table in order service
  rating: integer('rating').notNull(), // 1-5 stars
  title: varchar('title', { length: 200 }),
  comment: text('comment'),
  images: jsonb('images'), // Array of image URLs
  isVerified: boolean('is_verified').default(false),
  isApproved: boolean('is_approved').default(true),
  adminResponse: text('admin_response'),
  adminResponseAt: timestamp('admin_response_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Store Analytics
export const storeAnalytics = pgTable('store_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  
  // Sales Metrics
  totalSales: decimal('total_sales', { precision: 15, scale: 2 }).default('0'),
  totalOrders: integer('total_orders').default(0),
  averageOrderValue: decimal('average_order_value', { precision: 10, scale: 2 }),
  
  // Traffic Metrics
  pageViews: integer('page_views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 4 }),
  
  // Product Metrics
  productsViewed: integer('products_viewed').default(0),
  productsAddedToCart: integer('products_added_to_cart').default(0),
  
  // Customer Metrics
  newCustomers: integer('new_customers').default(0),
  returningCustomers: integer('returning_customers').default(0),
  
  // Metadata
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const storeCategoriesRelations = relations(storeCategories, ({ one, many }) => ({
  parent: one(storeCategories, {
    fields: [storeCategories.parentId],
    references: [storeCategories.id]
  }),
  children: many(storeCategories),
  stores: many(stores)
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  category: one(storeCategories, {
    fields: [stores.categoryId],
    references: [storeCategories.id]
  }),
  addresses: many(storeAddresses),
  hours: many(storeHours),
  staff: many(storeStaff),
  reviews: many(storeReviews),
  analytics: many(storeAnalytics)
}));

export const storeAddressesRelations = relations(storeAddresses, ({ one }) => ({
  store: one(stores, {
    fields: [storeAddresses.storeId],
    references: [stores.id]
  })
}));

export const storeHoursRelations = relations(storeHours, ({ one }) => ({
  store: one(stores, {
    fields: [storeHours.storeId],
    references: [stores.id]
  })
}));

export const storeStaffRelations = relations(storeStaff, ({ one, many }) => ({
  store: one(stores, {
    fields: [storeStaff.storeId],
    references: [stores.id]
  }),
  role: one(roles, {
    fields: [storeStaff.roleId],
    references: [roles.id]
  }),
}));

export const storeReviewsRelations = relations(storeReviews, ({ one }) => ({
  store: one(stores, {
    fields: [storeReviews.storeId],
    references: [stores.id]
  })
}));

export const storeAnalyticsRelations = relations(storeAnalytics, ({ one }) => ({
  store: one(stores, {
    fields: [storeAnalytics.storeId],
    references: [stores.id]
  })
}));

// New table relations
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  staff: many(storeStaff)
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id]
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id]
  })
}));

// Validation Schemas
export const insertStoreCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.any().optional()
});

export const insertStoreSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['physical', 'online', 'hybrid']).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(50).optional(),
  website: z.string().url().optional(),
  businessLicense: z.string().optional(),
  taxId: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  allowOnlineOrders: z.boolean().optional(),
  allowPickup: z.boolean().optional(),
  allowDelivery: z.boolean().optional(),
  deliveryRadius: z.string().optional(),
  minOrderAmount: z.string().optional(),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  images: z.any().optional(),
  metadata: z.any().optional()
});

export const insertStoreAddressSchema = z.object({
  type: z.string().min(1).max(50).optional(),
  streetAddress: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const insertStoreHoursSchema = z.object({
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  isClosed: z.boolean().optional(),
  isHoliday: z.boolean().optional(),
  notes: z.string().optional()
});

export const insertStoreStaffSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  customPermissions: z.array(z.string()).optional(),
  salary: z.string().optional(),
  commission: z.string().optional(),
  isActive: z.boolean().optional()
});

// New validation schemas for roles and permissions
export const insertPermissionSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  isActive: z.boolean().optional()
});

export const insertRoleSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  level: z.number().int().min(1).optional(),
  isSystemRole: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const insertRolePermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid()
});

export const insertStaffPermissionSchema = z.object({
  staffId: z.string().uuid(),
  permissionId: z.string().uuid(),
  grantedBy: z.string().uuid(),
  expiresAt: z.string().datetime().optional()
});

export const insertStoreReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200).optional(),
  comment: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  orderId: z.string().uuid().optional()
});

// Update schemas
export const updateStoreSchema = insertStoreSchema.partial();
export const updateStoreAddressSchema = insertStoreAddressSchema.partial();
export const updateStoreHoursSchema = insertStoreHoursSchema.partial();
export const updateStoreStaffSchema = insertStoreStaffSchema.partial();
export const updatePermissionSchema = insertPermissionSchema.partial();
export const updateRoleSchema = insertRoleSchema.partial();

// Search and filter schemas
export const storeSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['physical', 'online', 'hybrid']).optional(),
  status: z.enum(['active', 'inactive', 'pending_approval', 'suspended', 'closed']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  minRating: z.number().min(1).max(5).optional(),
  allowDelivery: z.boolean().optional(),
  allowPickup: z.boolean().optional(),
  sortBy: z.enum(['name', 'rating', 'totalOrders', 'totalRevenue', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional()
});

export type StoreCategory = typeof storeCategories.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type StoreAddress = typeof storeAddresses.$inferSelect;
export type StoreHours = typeof storeHours.$inferSelect;
export type StoreStaff = typeof storeStaff.$inferSelect;
export type StoreReview = typeof storeReviews.$inferSelect;
export type StoreAnalytics = typeof storeAnalytics.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;