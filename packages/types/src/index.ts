// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  addresses: Address[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  VENDOR = 'vendor',
  SUPPORT = 'support',
}

export interface Address {
  id: string;
  userId: string;
  type: AddressType;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export enum AddressType {
  BILLING = 'billing',
  SHIPPING = 'shipping',
  BOTH = 'both',
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  marketing: boolean;
  orderUpdates: boolean;
}

// Product Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  shortDescription?: string;
  slug: string;
  brand: string;
  categoryId: string;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  tags: string[];
  status: ProductStatus;
  isFeatured: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  inventory: InventoryItem;
  options: VariantOption[];
  image?: string;
  weight?: number;
  dimensions?: ProductDimensions;
}

export interface VariantOption {
  name: string;
  value: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: AttributeType;
}

export enum AttributeType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  COLOR = 'color',
  SIZE = 'size',
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  productVariantId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  location?: string;
  lastRestocked?: Date;
}

export interface Warehouse {
  id: string;
  name: string;
  address: Address;
  isActive: boolean;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: User;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  notes?: string;
  trackingNumbers: string[];
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum FulfillmentStatus {
  UNFULFILLED = 'unfulfilled',
  PARTIAL = 'partial',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  price: number;
  total: number;
}

// Payment Types
export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionId?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square',
  ADYEN = 'adyen',
}

// Cart Types
export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  discountCodes: DiscountCode[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  price: number;
  total: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

// Review Types
export interface Review {
  id: string;
  productId: string;
  userId: string;
  user: User;
  rating: number;
  title?: string;
  content?: string;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export enum NotificationType {
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  PAYMENT_FAILED = 'payment_failed',
  PRICE_DROP = 'price_drop',
  BACK_IN_STOCK = 'back_in_stock',
  REVIEW_REQUEST = 'review_request',
  PROMOTION = 'promotion',
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ResponseMetadata {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search Types
export interface SearchParams {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  tags?: string[];
  filters?: SearchFilter[];
}

export interface SearchFilter {
  key: string;
  values: string[];
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  facets?: SearchFacet[];
  suggestions?: string[];
}

export interface SearchFacet {
  key: string;
  label: string;
  values: SearchFacetValue[];
}

export interface SearchFacetValue {
  value: string;
  label: string;
  count: number;
}

// Shipping Types
export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  provider: string;
  estimatedDays: number;
  price: number;
  isActive: boolean;
}

export interface ShippingRate {
  id: string;
  method: ShippingMethod;
  price: number;
  estimatedDelivery: Date;
}

// Analytics Types
export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface ProductAnalytics {
  productId: string;
  views: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
}

export interface UserAnalytics {
  userId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  lifetimeValue: number;
}