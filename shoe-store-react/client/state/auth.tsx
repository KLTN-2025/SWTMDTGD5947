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

const KEY = "shoe_store_user_v1";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const userData = JSON.parse(raw);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem(KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save user to localStorage when user changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(KEY);
      }
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  }, [user]);

  // Check authentication status on mount
  useEffect(() => {
    if (user) {
      checkAuth().catch(() => {
        // If auth check fails, clear user data
        setUser(null);
      });
    }
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
