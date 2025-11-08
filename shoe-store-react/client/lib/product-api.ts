import { apiClient } from './api-client';
import { ApiResponse } from './api-types';

// Product Types (Public API)
export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  fullUrl?: string; // From Laravel accessor
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  parentId?: number | null;
}

export interface Product {
  id: number;
  skuId: string;
  name: string;
  status: 'SOLD_OUT' | 'IN_STOCK' | 'PRE_SALE';
  description?: string;
  basePrice: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  categories?: ProductCategory[];
  variants?: any[];
}

export interface ProductSearchParams {
  keyword?: string;
  status?: 'SOLD_OUT' | 'IN_STOCK' | 'PRE_SALE';
  category_id?: number;
  min_price?: number;
  max_price?: number;
  page?: number;
  per_page?: number;
  sort_by?: 'createdAt' | 'basePrice' | 'name';
  sort_order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface ProductListResponse {
  products: Product[];
  pagination: PaginationMeta;
}

class ProductApi {
  private baseUrl = '/products';

  // Get all products (with pagination)
  async getProducts(params?: ProductSearchParams): Promise<ApiResponse<ProductListResponse>> {
    return apiClient.get<ProductListResponse>(this.baseUrl, params as any);
  }

  // Search products
  async searchProducts(params: ProductSearchParams): Promise<ApiResponse<ProductListResponse>> {
    return apiClient.get<ProductListResponse>(`${this.baseUrl}/search`, params as any);
  }

  // Get single product
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`${this.baseUrl}/${id}`);
  }
}

export const productApi = new ProductApi();
