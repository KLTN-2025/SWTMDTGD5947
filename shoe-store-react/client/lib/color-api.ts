import { apiClient } from "./api-client";
import { ApiResponse } from "./api-types";

export interface Color {
  id: number;
  name: string;
  hexCode?: string | null;
  description?: string | null;
}

class PublicColorApi {
  private baseUrl = "/colors";

  async getColors(): Promise<ApiResponse<Color[]>> {
    return apiClient.get<Color[]>(this.baseUrl);
  }
}

export const publicColorApi = new PublicColorApi();

