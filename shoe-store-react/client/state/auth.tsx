import { createContext, useContext, useEffect, useState } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  login: (email: string, _password: string) => Promise<void>;
  register: (name: string, email: string, _password: string) => Promise<void>;
  loginWithGoogle: () => Promise<never>;
  logout: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
}

const KEY = "oce_user_v1";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(KEY, JSON.stringify(user));
      else localStorage.removeItem(KEY);
    } catch {}
  }, [user]);

  async function login(email: string, _password: string) {
    setUser({ id: `u-${Date.now().toString(36)}`, name: email.split("@")[0], email });
  }

  async function register(name: string, email: string, _password: string) {
    setUser({ id: `u-${Date.now().toString(36)}`, name, email });
  }

  async function loginWithGoogle(): Promise<never> {
    throw new Error("Vui lòng [Open MCP popover](#open-mcp-popover) và kết nối Supabase để bật đăng nhập Google.");
  }

  function logout() { setUser(null); }

  function updateProfile(patch: Partial<UserProfile>) {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
