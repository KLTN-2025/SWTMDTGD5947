import { apiClient } from './api-client';
import type { ApiResponse, Order, OrdersData } from './api-types';

export interface OrdersParams {
  status?: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  per_page?: number;
  page?: number;
}

class OrderApi {
  private baseUrl = '/orders';

  // Get user orders with pagination and filters
  async getOrders(params?: OrdersParams): Promise<ApiResponse<OrdersData>> {
    const searchParams = new URLSearchParams();
    
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    if (params?.per_page) {
      searchParams.append('per_page', params.per_page.toString());
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }

    const url = searchParams.toString() 
      ? `${this.baseUrl}?${searchParams.toString()}`
      : this.baseUrl;

    return apiClient.get<OrdersData>(url);
  }

  // Get order detail by ID
  async getOrderDetail(orderId: number): Promise<ApiResponse<{ order: Order }>> {
    return apiClient.get<{ order: Order }>(`${this.baseUrl}/${orderId}`);
  }

  // Cancel order
  async cancelOrder(orderId: number): Promise<ApiResponse<{ order: Order }>> {
    return apiClient.put<{ order: Order }>(`${this.baseUrl}/${orderId}/cancel`, {});
  }
}

export const orderApi = new OrderApi();
