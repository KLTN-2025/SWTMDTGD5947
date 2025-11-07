// API Response Types
export interface ApiResponse<T = any> {
  code: number;
  status: boolean;
  msgCode: string;
  message: string;
  data?: T;
}

// User & Auth Types
export interface User {
  id: number;
  name: string;
  userName: string;
  email: string;
  isActive: boolean;
  roleId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthData {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  userName: string;
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  password: string;
  re_password: string;
  token: string;
}

// Product Types
export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Size {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sizeId: number;
  quantity: number;
  price: number;
  size: Size;
  createdAt: string;
  updatedAt: string;
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
  categories: Category[];
  variants: ProductVariant[];
}

export interface ProductsData {
  products: Product[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
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

export interface UpdateProductRequest extends CreateProductRequest {
  // Same as create but for updates
}

export interface ProductSearchParams {
  keyword?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  status?: 'SOLD_OUT' | 'IN_STOCK' | 'PRE_SALE';
  sort_by?: 'name' | 'basePrice' | 'createdAt';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

// Error Types
export interface ApiError {
  code: number;
  status: false;
  msgCode: string;
  message: string | Record<string, string[]>; // Can be validation errors object
}
