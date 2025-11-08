import { apiClient } from './api-client';
import { ApiResponse } from './api-types';

export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  parent?: Category | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

class CategoryApi {
  private baseUrl = '/categories';

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>(this.baseUrl);
  }

  async getCategory(id: number): Promise<ApiResponse<Category>> {
    return apiClient.get<Category>(`${this.baseUrl}/${id}`);
  }
}

export const categoryApi = new CategoryApi();
