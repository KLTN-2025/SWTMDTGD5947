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

export interface Color {
  id: number;
  name: string;
  hexCode?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  colors?: Color[];
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
  color_ids?: number[];
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
  color_ids?: number[];
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
    
    if (data.color_ids && data.color_ids.length > 0) {
      data.color_ids.forEach((id, index) => {
        formData.append(`color_ids[${index}]`, id.toString());
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
    
    if (data.color_ids && data.color_ids.length > 0) {
      data.color_ids.forEach((id, index) => {
        formData.append(`color_ids[${index}]`, id.toString());
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
  phoneNumber?: string | null; // Match Laravel backend field name
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
  fullImageUrl?: string | null; // From Laravel accessor
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

// Color Types and API
export class ColorApi {
  private baseUrl = '/colors';

  // Get all colors
  async getColors(): Promise<ApiResponse<Color[]>> {
    return apiClient.get<Color[]>(this.baseUrl);
  }
}

export const colorApi = new ColorApi();

// Customer Types
export interface CustomerProfile {
  id: number;
  userId: number;
  phoneNumber?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Customer {
  id: number;
  name: string;
  userName: string;
  email: string;
  imageUrl?: string | null;
  fullImageUrl?: string | null;
  isActive: boolean;
  roleId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  role?: {
    id: number;
    name: string;
  };
  profile?: CustomerProfile;
  totalOrders?: number;
  totalSpent?: number;
  totalReviews?: number;
  totalCartItems?: number;
  recentOrders?: any[];
}

export interface CreateCustomerRequest {
  name: string;
  userName: string;
  email: string;
  password?: string;
  isActive?: boolean;
  image?: File;
  phoneNumber?: string;
  address?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  userName?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  image?: File;
  phoneNumber?: string;
  address?: string;
}

export interface CustomersResponse {
  customers: Customer[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

export class CustomerApi {
  private baseUrl = '/admin/customers';

  // Get all customers
  async getCustomers(params?: {
    per_page?: number;
    search?: string;
    is_active?: boolean;
    min_spent?: number;
    max_spent?: number;
    min_orders?: number;
    max_orders?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
  }): Promise<ApiResponse<CustomersResponse>> {
    return apiClient.get<CustomersResponse>(this.baseUrl, params);
  }

  // Get single customer
  async getCustomer(id: number): Promise<ApiResponse<Customer>> {
    return apiClient.get<Customer>(`${this.baseUrl}/${id}`);
  }

  // Create customer
  async createCustomer(data: CreateCustomerRequest): Promise<ApiResponse<Customer>> {
    const formData = new FormData();
    
    formData.append('name', data.name);
    formData.append('userName', data.userName);
    formData.append('email', data.email);
    
    if (data.password) {
      formData.append('password', data.password);
    }
    
    if (data.isActive !== undefined) {
      formData.append('isActive', data.isActive ? '1' : '0');
    }
    
    if (data.image) {
      formData.append('image', data.image);
    }
    
    if (data.phoneNumber) {
      formData.append('phoneNumber', data.phoneNumber);
    }
    
    if (data.address) {
      formData.append('address', data.address);
    }

    return apiClient.postFormData<Customer>(this.baseUrl, formData);
  }

  // Update customer
  async updateCustomer(id: number, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> {
    const formData = new FormData();
    
    if (data.name) {
      formData.append('name', data.name);
    }
    
    if (data.userName) {
      formData.append('userName', data.userName);
    }
    
    if (data.email) {
      formData.append('email', data.email);
    }
    
    if (data.password) {
      formData.append('password', data.password);
    }
    
    if (data.isActive !== undefined) {
      formData.append('isActive', data.isActive ? '1' : '0');
    }
    
    if (data.image) {
      formData.append('image', data.image);
    }
    
    if (data.phoneNumber !== undefined) {
      formData.append('phoneNumber', data.phoneNumber || '');
    }
    
    if (data.address !== undefined) {
      formData.append('address', data.address || '');
    }

    return apiClient.postFormData<Customer>(`${this.baseUrl}/${id}`, formData);
  }

  // Delete customer
  async deleteCustomer(id: number): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`${this.baseUrl}/${id}`);
  }
}

export const customerApi = new CustomerApi();

// Chatbox Types
export interface ChatBoxUserSummary {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  isActive: boolean;
  phoneNumber?: string | null;
  address?: string | null;
}

export interface ChatBoxCategorySummary {
  id: number;
  name: string;
}

export interface ChatBoxSummary {
  id: number;
  mode: string;
  modeLabel: string;
  category?: ChatBoxCategorySummary | null;
  user?: ChatBoxUserSummary | null;
  totalMessages: number;
  lastMessage?: string | null;
  lastMessageRole?: string | null;
  lastMessageAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ChatBoxStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  modeBreakdown: Array<{
    mode: string;
    label: string;
    count: number;
  }>;
  availableModes: Record<string, string>;
}

export interface ChatBoxPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface ChatBoxListResponse {
  chatBoxes: ChatBoxSummary[];
  pagination: ChatBoxPagination;
  stats: ChatBoxStats;
}

export interface ChatBoxHistoryEntry {
  id: number;
  role: 'assistant' | 'user' | 'system';
  message: string;
  createdAt: string;
  meta?: Record<string, any> | null;
}

export interface ChatBoxDetailResponse {
  chatBox: ChatBoxSummary & {
    user?: ChatBoxUserSummary | null;
  };
  history: ChatBoxHistoryEntry[];
}

class AdminChatBoxApi {
  private baseUrl = '/admin/chat-box/messages';

  async getConversations(params?: {
    search?: string;
    mode?: string;
    per_page?: number;
    page?: number;
  }): Promise<ApiResponse<ChatBoxListResponse>> {
    return apiClient.get<ChatBoxListResponse>(this.baseUrl, params);
  }

  async getConversation(id: number | string): Promise<ApiResponse<ChatBoxDetailResponse>> {
    return apiClient.get<ChatBoxDetailResponse>(`${this.baseUrl}/${id}`);
  }

  async deleteConversation(id: number | string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`${this.baseUrl}/${id}`);
  }
}

export const adminChatBoxApi = new AdminChatBoxApi();

// Admin API instance for orders
class AdminApi {
  private baseUrl = '/admin';

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiClient.get<T>(`${this.baseUrl}${endpoint}`);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return apiClient.post<T>(`${this.baseUrl}${endpoint}`, data);
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return apiClient.put<T>(`${this.baseUrl}${endpoint}`, data);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiClient.delete<T>(`${this.baseUrl}${endpoint}`);
  }
}

export const adminApi = new AdminApi();

// ============================================================================
// REPORTS API
// ============================================================================

export interface OverviewStats {
  revenue: {
    total: number;
    averageDaily: number;
    averageOrderValue: number;
    previousPeriod?: number;
    growth?: number;
  };
  orders: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    previousPeriod?: number;
    growth?: number;
  };
  customers: {
    total: number;
    new: number;
    withOrders: number;
    conversionRate: number;
    previousPeriod?: number;
    growth?: number;
  };
  products: {
    total: number;
    active: number;
    soldOut: number;
  };
  period: number;
  startDate: string;
  endDate: string;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueByPeriodResponse {
  revenueByDay: RevenueByDay[];
  summary: {
    total: number;
    average: number;
    max: number;
    min: number;
  };
  period: number;
}

export interface TopSellingProduct {
  productVariantId: number;
  productId: number;
  productName: string;
  skuId: string;
  basePrice: number;
  size: {
    id: number;
    name: string;
  } | null;
  mainImage: string | null;
  totalSold: number;
  totalRevenue: number;
}

export interface TopSellingProductsResponse {
  products: TopSellingProduct[];
  period: number;
}

export interface InventoryProduct {
  productId: number;
  name: string;
  skuId: string;
  basePrice: number;
  mainImage: string | null;
  totalQuantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  statusDisplay: string;
}

export interface InventoryStatusResponse {
  summary: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  lowStockProducts: InventoryProduct[];
  allProducts: InventoryProduct[];
}

export interface OrderStatsResponse {
  stats: {
    [key: string]: {
      count: number;
      totalAmount: number;
    };
  };
  period: number;
}

export interface PaymentMethodStat {
  method: string;
  count: number;
  totalAmount: number;
}

export interface PaymentStatsResponse {
  statusStats: {
    [key: string]: {
      count: number;
      totalAmount: number;
    };
  };
  methodStats: PaymentMethodStat[];
  period: number;
}

export interface RatedProduct {
  productId: number;
  productName: string;
  skuId: string;
  basePrice: number;
  mainImage: string | null;
  averageRating: number;
  reviewCount: number;
}

export interface RatedProductsResponse {
  topRated: RatedProduct[];
  bottomRated: RatedProduct[];
  period: number;
}

export interface TopCustomer {
  userId: number;
  name: string;
  email: string;
  avatar: string | null;
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface TopCustomersResponse {
  customers: TopCustomer[];
  period: number;
}

export interface RevenueByCategoryItem {
  categoryId: number;
  categoryName: string;
  totalRevenue: number;
  totalQuantity: number;
  orderCount: number;
}

export interface RevenueByCategoryResponse {
  revenueByCategory: RevenueByCategoryItem[];
  totalRevenue: number;
  period: number;
}

class ReportApi {
  private baseUrl = '/admin/reports';

  async getOverview(params?: { period?: number }): Promise<ApiResponse<OverviewStats>> {
    return apiClient.get<OverviewStats>(`${this.baseUrl}/overview`, params);
  }

  async getRevenueByPeriod(params?: { period?: number }): Promise<ApiResponse<RevenueByPeriodResponse>> {
    return apiClient.get<RevenueByPeriodResponse>(`${this.baseUrl}/revenue`, params);
  }

  async getTopSellingProducts(params?: { limit?: number; period?: number }): Promise<ApiResponse<TopSellingProductsResponse>> {
    return apiClient.get<TopSellingProductsResponse>(`${this.baseUrl}/top-products`, params);
  }

  async getInventoryStatus(params?: { lowStockThreshold?: number }): Promise<ApiResponse<InventoryStatusResponse>> {
    return apiClient.get<InventoryStatusResponse>(`${this.baseUrl}/inventory`, params);
  }

  async getOrderStats(params?: { period?: number }): Promise<ApiResponse<OrderStatsResponse>> {
    return apiClient.get<OrderStatsResponse>(`${this.baseUrl}/orders`, params);
  }

  async getPaymentStats(params?: { period?: number }): Promise<ApiResponse<PaymentStatsResponse>> {
    return apiClient.get<PaymentStatsResponse>(`${this.baseUrl}/payments`, params);
  }

  async getRatedProducts(params?: { limit?: number; period?: number }): Promise<ApiResponse<RatedProductsResponse>> {
    return apiClient.get<RatedProductsResponse>(`${this.baseUrl}/rated-products`, params);
  }

  async getTopCustomers(params?: { limit?: number; period?: number }): Promise<ApiResponse<TopCustomersResponse>> {
    return apiClient.get<TopCustomersResponse>(`${this.baseUrl}/top-customers`, params);
  }

  async getRevenueByCategory(params?: { period?: number }): Promise<ApiResponse<RevenueByCategoryResponse>> {
    return apiClient.get<RevenueByCategoryResponse>(`${this.baseUrl}/revenue-by-category`, params);
  }
}

export const reportApi = new ReportApi();
