import { apiClient } from './api-client';
import type { ApiResponse } from './api-types';

// Cart Types based on Laravel API
export interface CartItemResponse {
  id: number;
  cartId: number;
  productVariantId: number;
  colorId?: number | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  itemTotal: number;
  productStatus: {
    isAvailable: boolean;
    status: string;
    isDeleted: boolean;
  };
  mainImage: string;
  variantStatus: {
    isInSalePeriod: boolean;
    startDate: string;
    endDate: string;
  };
  product_variant: {
    id: number;
    productId: number;
    sizeId: number;
    price: number;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
    product: {
      id: number;
      skuId: string;
      name: string;
      status: 'SOLD_OUT' | 'IN_STOCK' | 'PRE_SALE';
      description?: string;
      basePrice: number;
      quantity: number;
      createdAt: string;
      updatedAt: string;
      deletedAt?: string | null;
      images: Array<{
        id: number;
        productId: number;
        url: string;
        fullUrl: string;
        createdAt: string;
        updatedAt: string;
        deletedAt?: string | null;
      }>;
      categories: Array<{
        id: number;
        name: string;
        parentId?: number | null;
        createdAt: string;
        updatedAt: string;
        deletedAt?: string | null;
        pivot: {
          productId: number;
          categoryId: number;
          createdAt: string;
          updatedAt: string;
        };
      }>;
      colors?: Array<{
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
      }>;
    };
    size: {
      id: number;
      nameSize: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
      deletedAt?: string | null;
    };
  };
  color?: {
    id: number;
    name: string;
    hexCode?: string | null;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  } | null;
}

export interface CartResponse {
  cartId: number;
  cartItems: CartItemResponse[];
  totalItems: number;
  totalAmount: number;
  summary: {
    itemCount: number;
    totalQuantity: number;
    totalAmount: number;
    currency: string;
  };
}

export interface AddToCartRequest {
  productVariantId: number;
  colorId?: number | null;
  quantity: number;
}

export interface AddToCartResponse {
  cartId: number;
  cartItem: CartItemResponse;
  totalItems: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface UpdateCartItemResponse {
  cartItem: CartItemResponse;
}

class CartApi {
  private baseUrl = '/cart';

  // Add item to cart
  async addToCart(data: AddToCartRequest): Promise<ApiResponse<AddToCartResponse>> {
    return apiClient.post<AddToCartResponse>(this.baseUrl, data);
  }

  // Get all cart items
  async getCartItems(): Promise<ApiResponse<CartResponse>> {
    return apiClient.get<CartResponse>(this.baseUrl);
  }

  // Update cart item quantity
  async updateCartItem(cartItemId: number, data: UpdateCartItemRequest): Promise<ApiResponse<UpdateCartItemResponse>> {
    return apiClient.put<UpdateCartItemResponse>(`${this.baseUrl}/items/${cartItemId}`, data);
  }

  // Delete cart item
  async deleteCartItem(cartItemId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/items/${cartItemId}`);
  }

  // Clear entire cart
  async clearCart(): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/clear`);
  }
}

export const cartApi = new CartApi();
