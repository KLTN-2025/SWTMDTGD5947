import { apiClient } from './api-client';
import { ApiResponse } from './api-types';

// Profile Types
export interface UserProfile {
  address?: string | null;
  phoneNumber?: string | null;
}

export interface ProfileUser {
  id: number;
  name: string;
  userName: string;
  email: string;
  imageUrl?: string | null;
  isActive: boolean;
  role?: string | null;
}

export interface ProfileData {
  user: ProfileUser;
  profile: UserProfile;
}

export interface UpdateProfileRequest {
  name?: string;
  userName?: string;
  address?: string;
  phoneNumber?: string;
  image?: File;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class ProfileApi {
  private baseUrl = '/profile';

  // Get current user profile
  async getProfile(): Promise<ApiResponse<ProfileData>> {
    return apiClient.get<ProfileData>(this.baseUrl);
  }

  // Update profile
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<ProfileData>> {
    const formData = new FormData();
    
    if (data.name) formData.append('name', data.name);
    if (data.userName) formData.append('userName', data.userName);
    if (data.address) formData.append('address', data.address);
    if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);
    if (data.image) formData.append('image', data.image);

    return apiClient.postFormData<ProfileData>(`${this.baseUrl}/update`, formData);
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
    return apiClient.post<null>(`${this.baseUrl}/change-password`, data);
  }
}

export const profileApi = new ProfileApi();
