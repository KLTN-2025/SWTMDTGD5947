import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api-client";
import { User } from "@/lib/api-types";

export interface UserProfile {
  id: number;
  name: string;
  userName: string;
  email: string;
  imageUrl?: string;
  isActive: boolean;
  roleId: number;
  createdAt: string;
  updatedAt: string;
}

// Role IDs (should match backend database)
export const ROLES = {
  ADMIN: 1,
  USER: 2,
} as const;

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  register: (name: string, userName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  resetPassword: (password: string, rePassword: string, token: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount (get user from cookie via API)
  useEffect(() => {
    // Only check auth if we might have a token cookie
    // Check if we have any cookies at all to avoid unnecessary API calls
    const hasCookies = document.cookie.length > 0;
    
    if (hasCookies) {
      checkAuth()
        .catch(() => {
          // If auth check fails, user is not authenticated
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // No cookies, skip auth check
      setLoading(false);
    }
  }, []);

  // Listen for auth expiration events from API client (immediate response to 401)
  useEffect(() => {
    const handleAuthExpired = () => {
      // Không logout nếu đang ở trang payment callback (redirect từ VNPay/MoMo)
      // Vì cookie có thể chưa được gửi đúng cách sau cross-site redirect
      const isPaymentCallback = window.location.pathname.startsWith('/payment/callback');
      if (isPaymentCallback) {
        console.log('Skipping auth:expired on payment callback page');
        return;
      }
      
      console.log('Token expired, logging out...');
      setUser(null);
      
      // Redirect to auth page if not already there
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth?expired=true';
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  async function login(email: string, password: string): Promise<UserProfile | null> {
    try {
      setLoading(true);
      const response = await authApi.login({ email, password });
      
      if (response.data) {
        setUser(response.data.user);
        return response.data.user;
      }
      return null;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(typeof error.apiMessage === 'string' ? error.apiMessage : 'Đăng nhập thất bại');
      }
      throw new Error('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function register(name: string, userName: string, email: string, password: string): Promise<void> {
    try {
      setLoading(true);
      const response = await authApi.register({ name, userName, email, password });
      
      // Don't auto-login after registration
      // User needs to manually login after registration
    } catch (error) {
      if (error instanceof ApiError) {
        const validationError = error.getFirstValidationError();
        if (validationError) {
          throw new Error(validationError);
        }
        throw new Error(typeof error.apiMessage === 'string' ? error.apiMessage : 'Đăng ký thất bại');
      }
      throw new Error('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  function loginWithGoogle(): void {
    // Redirect to Google OAuth URL
    const googleAuthUrl = authApi.getGoogleAuthUrl();
    window.location.href = googleAuthUrl;
  }

  async function logout(): Promise<void> {
    try {
      setLoading(true);
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      setLoading(false);
    }
  }

  async function sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await authApi.sendPasswordResetEmail(email);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(typeof error.apiMessage === 'string' ? error.apiMessage : 'Gửi email thất bại');
      }
      throw new Error('Lỗi kết nối. Vui lòng thử lại.');
    }
  }

  async function resetPassword(password: string, rePassword: string, token: string): Promise<void> {
    try {
      await authApi.resetPassword({ password, re_password: rePassword, token });
    } catch (error) {
      if (error instanceof ApiError) {
        const validationError = error.getFirstValidationError();
        if (validationError) {
          throw new Error(validationError);
        }
        throw new Error(typeof error.apiMessage === 'string' ? error.apiMessage : 'Đặt lại mật khẩu thất bại');
      }
      throw new Error('Lỗi kết nối. Vui lòng thử lại.');
    }
  }

  async function checkAuth(): Promise<void> {
    try {
      const response = await authApi.checkAuth();
      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      // If auth check fails, user is not authenticated
      setUser(null);
      throw error;
    }
  }

  // Check if user is admin
  const isAdmin = user?.roleId === ROLES.ADMIN;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      isAdmin,
      login, 
      register, 
      loginWithGoogle, 
      logout, 
      sendPasswordResetEmail,
      resetPassword,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
