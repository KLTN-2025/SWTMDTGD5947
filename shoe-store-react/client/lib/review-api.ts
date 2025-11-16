import { apiClient } from './api-client';
import type { ApiResponse } from './api-types';
import type { ProductReview } from './product-api';

export interface CreateReviewRequest {
  productId: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  comment?: string;
}

export interface ReviewStatistics {
  total: number;
  average: number;
  ratingCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ProductReviewsResponse {
  reviews: ProductReview[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
  statistics: ReviewStatistics;
}

export interface GetProductReviewsParams {
  per_page?: number;
  page?: number;
  sort_by?: 'newest' | 'oldest' | 'rating';
  rating?: number;
}

class ReviewApi {
  private baseUrl = '/reviews';

  // Create review
  async createReview(data: CreateReviewRequest): Promise<ApiResponse<ProductReview>> {
    return apiClient.post<ProductReview>(this.baseUrl, data);
  }

  // Update review
  async updateReview(reviewId: number, data: UpdateReviewRequest): Promise<ApiResponse<ProductReview>> {
    return apiClient.put<ProductReview>(`${this.baseUrl}/${reviewId}`, data);
  }

  // Delete review
  async deleteReview(reviewId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${reviewId}`);
  }

  // Get product reviews
  async getProductReviews(productId: number, params?: GetProductReviewsParams): Promise<ApiResponse<ProductReviewsResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params?.per_page) {
      searchParams.append('per_page', params.per_page.toString());
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.sort_by) {
      searchParams.append('sort_by', params.sort_by);
    }
    if (params?.rating) {
      searchParams.append('rating', params.rating.toString());
    }

    const url = searchParams.toString() 
      ? `/products/${productId}/reviews?${searchParams.toString()}`
      : `/products/${productId}/reviews`;

    return apiClient.get<ProductReviewsResponse>(url);
  }
}

export const reviewApi = new ReviewApi();

