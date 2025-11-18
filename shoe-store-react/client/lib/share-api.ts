import { apiClient } from './api-client';
import { ApiResponse } from './api-types';

export interface ProductShareLinks {
  product: {
    id: number;
    skuId: string;
    name: string;
    url: string;
  };
  shareLinks: {
    facebookPost: string;
    messenger: string;
  };
}

class ShareApi {
  private baseUrl = '/products';

  // Get product share links
  async getProductShareLinks(productId: number): Promise<ApiResponse<ProductShareLinks>> {
    return apiClient.get<ProductShareLinks>(`${this.baseUrl}/${productId}/share`);
  }
}

export const shareApi = new ShareApi();

