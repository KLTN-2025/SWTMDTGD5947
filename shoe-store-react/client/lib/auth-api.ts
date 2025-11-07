import { apiClient } from './api-client';
import {
  ApiResponse,
  AuthData,
  User,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from './api-types';

export class AuthApi {
  // Login with email and password
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthData>> {
    return apiClient.post<AuthData>('/auth/login', credentials);
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/auth/register', userData);
  }

  // Logout current user
  async logout(): Promise<ApiResponse<null>> {
    return apiClient.post<null>('/auth/logout');
  }

  // Get Google OAuth URL
  getGoogleAuthUrl(): string {
    return `${apiClient['baseURL']}/auth/google`;
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<ApiResponse<null>> {
    return apiClient.post<null>('/auth/send-email-reset-pass', { email });
  }

  // Reset password with token
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
    return apiClient.post<null>('/auth/reset-password', data);
  }

  // Check if user is authenticated (by trying to access a protected route)
  async checkAuth(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/users');
  }
}

export const authApi = new AuthApi();
