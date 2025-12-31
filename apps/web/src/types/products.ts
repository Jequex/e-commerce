export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  sku: string;
  barcode?: string;
  trackQuantity: boolean;
  inventoryQuantity?: number;
  lowStockThreshold?: number;
  images: string[];
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: string[];
  variants?: ProductVariant[];
  isActive: 'active' | 'draft' | 'archived';
  isFeatured: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  storeId: string;
  store?: {
    id: string;
    name: string;
    slug: string;
    type?: string;
    status?: string;
    email?: string;
    phone?: string;
    logo?: string;
    isVerified?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  quantity?: number;
  options: Record<string, string>;
}

export interface ProductsResponse {
  products: Product[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}