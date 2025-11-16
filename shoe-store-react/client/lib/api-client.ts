import { ApiResponse } from './api-types';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8009/api';

class ApiClient {
  private baseURL: string;
  private csrfInitialized = false;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Initialize CSRF token for Sanctum
  private async initializeCsrf(): Promise<void> {
    if (this.csrfInitialized) return;
    
    try {
      const csrfUrl = this.baseURL.replace('/api', '/sanctum/csrf-cookie');
      await fetch(csrfUrl, {
        method: 'GET',
        credentials: 'include',
      });
      this.csrfInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize CSRF token:', error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include', // Important for cookie-based auth
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Important for Laravel
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle non-200 responses that still return JSON
      if (!response.ok || !data.status) {
        throw new ApiError(data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network errors or other fetch failures
      throw new ApiError({
        code: 500,
        status: false,
        msgCode: 'NETWORK_ERROR',
        message: 'Lỗi kết nối mạng. Vui lòng thử lại.',
      });
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let finalEndpoint = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        finalEndpoint += (endpoint.includes('?') ? '&' : '?') + searchParams.toString();
      }
    }

    return this.request<T>(finalEndpoint);
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // POST with FormData (for file uploads)
  async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      method: 'POST',
      credentials: 'include',
      body: formData,
      // Don't set Content-Type header for FormData - browser will set it with boundary
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new ApiError(data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError({
        code: 500,
        status: false,
        msgCode: 'NETWORK_ERROR',
        message: 'Lỗi kết nối mạng. Vui lòng thử lại.',
      });
    }
  }

  // PUT with FormData (for file uploads in updates)
  async putFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    // Laravel requires _method=PUT for form data updates
    formData.append('_method', 'PUT');
    
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      method: 'POST', // Use POST with _method=PUT for Laravel
      credentials: 'include',
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new ApiError(data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError({
        code: 500,
        status: false,
        msgCode: 'NETWORK_ERROR',
        message: 'Lỗi kết nối mạng. Vui lòng thử lại.',
      });
    }
  }
}

// Custom error class for API errors
class ApiError extends Error {
  public code: number;
  public status: false;
  public msgCode: string;
  public apiMessage: string | Record<string, string[]>;
  public errorData: any;

  constructor(errorData: {
    code: number;
    status: false;
    msgCode: string;
    message: string | Record<string, string[]>;
    errors?: string[];
  }) {
    // Use the actual API message or first validation error
    const displayMessage = typeof errorData.message === 'string' 
      ? errorData.message 
      : Object.values(errorData.message)[0]?.[0] || 'Lỗi từ server';
    
    super(displayMessage);
    this.name = 'ApiError';
    this.code = errorData.code;
    this.status = errorData.status;
    this.msgCode = errorData.msgCode;
    this.apiMessage = errorData.message;
    this.errorData = errorData;
  }

  // Helper to get validation errors
  getValidationErrors(): Record<string, string[]> | null {
    if (typeof this.apiMessage === 'object' && !Array.isArray(this.apiMessage) && !('errors' in this.apiMessage)) {
      return this.apiMessage;
    }
    return null;
  }

  // Helper to get errors array from backend
  getErrorsArray(): string[] | null {
    // Check in errorData first (full response)
    if (this.errorData && this.errorData.errors && Array.isArray(this.errorData.errors)) {
      return this.errorData.errors;
    }
    
    // Fallback to check in apiMessage
    if (typeof this.apiMessage === 'object' && 'errors' in this.apiMessage) {
      const errors = (this.apiMessage as any).errors;
      return Array.isArray(errors) ? errors : null;
    }
    return null;
  }

  // Helper to get first validation error message
  getFirstValidationError(): string | null {
    const errors = this.getValidationErrors();
    if (errors) {
      const firstKey = Object.keys(errors)[0];
      return errors[firstKey]?.[0] || null;
    }
    return null;
  }

  // Helper to get all validation errors as a formatted string
  getAllValidationErrors(): string {
    const errors = this.getValidationErrors();
    if (errors) {
      return Object.entries(errors)
        .map(([field, messages]) => messages.join(', '))
        .join('; ');
    }
    return this.message;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export { ApiError };
