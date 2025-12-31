import callApi from './callApi';
import urls from './urls.json';
import { Product, ProductsResponse, ProductFilters } from '@/types/products';

/**
 * Get all products with optional filters
 */
export const getProducts = async (filters?: ProductFilters): Promise<ProductsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }

  const queryString = queryParams.toString();
  const url = `http://${urls.products.getAll}${queryString ? `?${queryString}` : ''}`;

  return callApi(url, {
    method: 'GET',
  });
};

/**
 * Get products by store ID
 */
export const getProductsByStore = async (
  storeId: string,
  filters?: ProductFilters
): Promise<ProductsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }

  const queryString = queryParams.toString();
  const url = `http://${urls.products.getByStore}/${storeId}${queryString ? `?${queryString}` : ''}`;

  return callApi(url, {
    method: 'GET',
  });
};

/**
 * Get a single product by ID
 */
export const getProductById = async (productId: string): Promise<{ product: Product }> => {
  const url = `http://${urls.products.getOne.replace(':id', productId)}`;

  return callApi(url, {
    method: 'GET',
  });
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (limit?: number): Promise<ProductsResponse> => {
  return getProducts({ isFeatured: true, limit, isActive: true });
};

/**
 * Search products
 */
export const searchProducts = async (
  searchQuery: string,
  filters?: Omit<ProductFilters, 'search'>
): Promise<ProductsResponse> => {
  return getProducts({ ...filters, search: searchQuery });
};

/**
 * Get product categories
 */
export const getProductCategories = async (): Promise<{ categories: any[] }> => {
  const url = `http://${urls.products.getCategories}`;

  return callApi(url, {
    method: 'GET',
  });
};

/**
 * Get store product stats
 */
export const getStoreProductStats = async (storeId: string): Promise<{
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}> => {
  const url = `http://${urls.products.getStoreStats.replace(':storeId', storeId)}`;

  return callApi(url, {
    method: 'GET',
  });
};

/**
 * Get products by category ID
 */
export const getProductsByCategory = async (
  categoryId: string,
  filters?: ProductFilters
): Promise<ProductsResponse> => {
  return getProducts({ ...filters, categoryId });
};
