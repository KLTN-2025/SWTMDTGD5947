import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/lib/api-types';

// Admin Product Types (Match Laravel backend)
export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProduct {
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
  categories?: any[];
  variants?: any[];
}

export interface CreateProductRequest {
  skuId: string;
  name: string;
  status: 'SOLD_OUT' | 'IN_STOCK' | 'PRE_SALE';
  description?: string;
  basePrice: number;
  quantity: number;
  category_ids?: number[];
  images?: File[];
}

export interface UpdateProductRequest {
  skuId?: string;
  name?: string;
  status?: 'SOLD_OUT' | 'IN_STOCK' | 'PRE_SALE';
  description?: string;
  basePrice?: number;
  quantity?: number;
  category_ids?: number[];
  images?: File[];
}

export class AdminProductApi {
  private baseUrl = '/admin/products';

  // Get all products
  async getProducts(): Promise<ApiResponse<AdminProduct[]>> {
    return apiClient.get<AdminProduct[]>(this.baseUrl);
  }

  // Search products
  async searchProducts(query: string): Promise<ApiResponse<AdminProduct[]>> {
    return apiClient.get<AdminProduct[]>(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
  }

  // Get single product
  async getProduct(id: number): Promise<ApiResponse<AdminProduct>> {
    return apiClient.get<AdminProduct>(`${this.baseUrl}/${id}`);
  }

  // Create product
  async createProduct(data: CreateProductRequest): Promise<ApiResponse<AdminProduct>> {
    const formData = new FormData();
    
    formData.append('skuId', data.skuId);
    formData.append('name', data.name);
    formData.append('status', data.status);
    formData.append('basePrice', data.basePrice.toString());
    formData.append('quantity', data.quantity.toString());
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.category_ids && data.category_ids.length > 0) {
      data.category_ids.forEach((id, index) => {
        formData.append(`category_ids[${index}]`, id.toString());
      });
    }
    
    if (data.images && data.images.length > 0) {
      data.images.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });
    }

    return apiClient.postFormData<AdminProduct>(this.baseUrl, formData);
  }

  // Update product
  async updateProduct(id: number, data: UpdateProductRequest): Promise<ApiResponse<AdminProduct>> {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    
    if (data.skuId) formData.append('skuId', data.skuId);
    if (data.name) formData.append('name', data.name);
    if (data.status) formData.append('status', data.status);
    if (data.description) formData.append('description', data.description);
    if (data.basePrice !== undefined) formData.append('basePrice', data.basePrice.toString());
    if (data.quantity !== undefined) formData.append('quantity', data.quantity.toString());
    
    if (data.category_ids && data.category_ids.length > 0) {
      data.category_ids.forEach((id, index) => {
        formData.append(`category_ids[${index}]`, id.toString());
      });
    }
    
    if (data.images && data.images.length > 0) {
      data.images.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });
    }

    // Use POST with _method=PUT for Laravel form-data updates
    return apiClient.postFormData<AdminProduct>(`${this.baseUrl}/${id}`, formData);
  }

  // Delete product
  async deleteProduct(id: number): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`${this.baseUrl}/${id}`);
  }

  // Delete product image
  async deleteProductImage(imageId: number): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`${this.baseUrl}/images/${imageId}`);
  }
}

export const adminProductApi = new AdminProductApi();
