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
  async searchProducts(params: Record<string, string>): Promise<ApiResponse<AdminProduct[]>> {
    console.log('API searchProducts - params:', params);
    return apiClient.get<AdminProduct[]>(`${this.baseUrl}/search`, params);
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

// Admin Category Types
export interface AdminCategory {
  id: number;
  name: string;
  parentId?: number | null;
  parent?: AdminCategory | null;
  children?: AdminCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  parentId?: number | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  parentId?: number | null;
}

export class AdminCategoryApi {
  private baseUrl = '/admin/categories';

  // Get all categories
  async getCategories(): Promise<ApiResponse<AdminCategory[]>> {
    return apiClient.get<AdminCategory[]>(this.baseUrl);
  }

  // Get single category
  async getCategory(id: number): Promise<ApiResponse<AdminCategory>> {
    return apiClient.get<AdminCategory>(`${this.baseUrl}/${id}`);
  }

  // Create category
  async createCategory(data: CreateCategoryRequest): Promise<ApiResponse<AdminCategory>> {
    return apiClient.post<AdminCategory>(this.baseUrl, data);
  }

  // Update category
  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<ApiResponse<AdminCategory>> {
    return apiClient.post<AdminCategory>(`${this.baseUrl}/${id}`, data);
  }

  // Delete category
  async deleteCategory(id: number): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`${this.baseUrl}/${id}`);
  }
}

export const adminCategoryApi = new AdminCategoryApi();

// Admin User Types
export interface UserProfile {
  id: number;
  userId: number;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  userName: string;
  email: string;
  imageUrl?: string | null;
  isActive: boolean;
  roleId: number;
  role?: UserRole;
  profile?: UserProfile;
  hasPassword?: boolean;
  provider?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  userName: string;
  email: string;
  password?: string;
  roleId: number;
  isActive?: boolean;
  image?: File;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface UpdateUserRequest {
  name?: string;
  userName?: string;
  email?: string;
  password?: string;
  roleId?: number;
  isActive?: boolean;
  image?: File;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export class AdminUserApi {
  private baseUrl = '/admin/users';

  // Get all users
  async getUsers(): Promise<ApiResponse<AdminUser[]>> {
    return apiClient.get<AdminUser[]>(this.baseUrl);
  }

  // Search users
  async searchUsers(params: Record<string, string>): Promise<ApiResponse<AdminUser[]>> {
    console.log('API searchUsers - params:', params);
    return apiClient.get<AdminUser[]>(`${this.baseUrl}/search`, params);
  }

  // Get single user
  async getUser(id: number): Promise<ApiResponse<AdminUser>> {
    return apiClient.get<AdminUser>(`${this.baseUrl}/${id}`);
  }

  // Create user
  async createUser(data: CreateUserRequest): Promise<ApiResponse<AdminUser>> {
    const formData = new FormData();
    
    formData.append('name', data.name);
    formData.append('userName', data.userName);
    formData.append('email', data.email);
    formData.append('roleId', data.roleId.toString());
    
    if (data.password) {
      formData.append('password', data.password);
    }
    
    if (data.isActive !== undefined) {
      formData.append('isActive', data.isActive ? '1' : '0');
    }
    
    if (data.image) {
      formData.append('image', data.image);
    }
    
    if (data.phone) {
      formData.append('phone', data.phone);
    }
    
    if (data.address) {
      formData.append('address', data.address);
    }
    
    if (data.dateOfBirth) {
      formData.append('dateOfBirth', data.dateOfBirth);
    }

    return apiClient.postFormData<AdminUser>(this.baseUrl, formData);
  }

  // Update user
  async updateUser(id: number, data: UpdateUserRequest): Promise<ApiResponse<AdminUser>> {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    
    if (data.name) formData.append('name', data.name);
    if (data.userName) formData.append('userName', data.userName);
    if (data.email) formData.append('email', data.email);
    if (data.password) formData.append('password', data.password);
    if (data.roleId !== undefined) formData.append('roleId', data.roleId.toString());
    if (data.isActive !== undefined) formData.append('isActive', data.isActive ? '1' : '0');
    
    if (data.image) {
      formData.append('image', data.image);
    }
    
    if (data.phone) formData.append('phone', data.phone);
    if (data.address) formData.append('address', data.address);
    if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth);

    // Use POST with _method=PUT for Laravel form-data updates
    return apiClient.postFormData<AdminUser>(`${this.baseUrl}/${id}`, formData);
  }

  // Delete user
  async deleteUser(id: number): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`${this.baseUrl}/${id}`);
  }

  // Get all roles
  async getRoles(): Promise<ApiResponse<UserRole[]>> {
    return apiClient.get<UserRole[]>('/roles');
  }
}

export const adminUserApi = new AdminUserApi();
