import { apiClient } from './api-client';
import {
  ApiResponse,
  Product,
  ProductsData,
  ProductSearchParams,
} from './api-types';

/**
 * Public Product API for Client
 * Only read-only operations (GET)
 * Admin operations are in admin/lib/admin-api.ts
 */
export class ProductApi {
  // Get all products with pagination (public)
  async getProducts(params?: { per_page?: number; page?: number }): Promise<ApiResponse<ProductsData>> {
    return apiClient.get<ProductsData>('/products', params);
  }

  // Get product by ID (public)
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/products/${id}`);
  }

  // Search products with filters (public)
  async searchProducts(params: ProductSearchParams): Promise<ApiResponse<ProductsData>> {
    return apiClient.get<ProductsData>('/products/search', params);
  }

  // Helper method to get product image URL
  getImageUrl(imagePath: string): string {
    const baseUrl = apiClient['baseURL'].replace('/api', '');
    return `${baseUrl}/${imagePath}`;
  }
}

export const productApi = new ProductApi();
