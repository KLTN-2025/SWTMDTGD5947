import { apiClient } from './api-client';
import type { ApiResponse, Order } from './api-types';

export interface PaymentRequest {
  orderId: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'E_WALLET' | 'BANK_TRANSFER';
  bankCode?: string;
  accountNumber?: string;
}

export interface PaymentResponseData {
  order: Order;
  payment: any;
  paymentMethod: string;
  paymentUrl?: string;
  transactionCode?: string;
  nextStep?: string;
  message?: string;
}

class PaymentApi {
  private baseUrl = '/payments';

  async processPayment(data: PaymentRequest): Promise<ApiResponse<PaymentResponseData>> {
    return apiClient.post<PaymentResponseData>(this.baseUrl, data);
  }
}

export const paymentApi = new PaymentApi();
