import { apiClient } from './api-client';
import { ApiResponse } from './api-types';

// Product Types (Public API)
export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  fullUrl: string; // Full URL from Laravel accessor
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ProductCategory {
  id: number;
  name: string;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
  pivot?: {
    productId: number;
    categoryId: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ProductColor {
  id: number;
  name: string;
  hexCode?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  pivot?: {
    productId: number;
    colorId: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface Size {
  id: number;
  nameSize: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sizeId: number;
  price: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  size: Size;
}

export interface ReviewUser {
  id: number;
  name: string;
  userName: string;
  imageUrl: string;
  email: string;
  isActive: boolean;
  roleId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  fullImageUrl: string;
}

export interface ProductReview {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  user?: ReviewUser;
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
  categories: ProductCategory[];
  colors?: ProductColor[];
  variants: ProductVariant[];
  reviews: ProductReview[];
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

  // Get single product (public endpoint)
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`${this.baseUrl}/${id}`);
  }

  // Get single product from admin endpoint (includes more details)
  async getProductDetail(id: number): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/admin/products/${id}`);
  }
}

export const productApi = new ProductApi();
