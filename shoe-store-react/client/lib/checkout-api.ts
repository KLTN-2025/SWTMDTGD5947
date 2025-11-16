import { apiClient } from './api-client';
import type { ApiResponse, CheckoutCalculation, CheckoutRequest, CheckoutResponse } from './api-types';

class CheckoutApi {
  private baseUrl = '/checkout';

  // Calculate checkout totals (preview)
  async calculateCheckout(): Promise<ApiResponse<CheckoutCalculation>> {
    return apiClient.get<CheckoutCalculation>(`${this.baseUrl}/calculate`);
  }

  // Create order from cart
  async checkout(data: CheckoutRequest): Promise<ApiResponse<CheckoutResponse>> {
    return apiClient.post<CheckoutResponse>(this.baseUrl, data);
  }
}

export const checkoutApi = new CheckoutApi();
