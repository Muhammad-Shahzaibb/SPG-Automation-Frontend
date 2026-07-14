"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";
import { authService } from "@/services";
import {
  clearSession,
  extractErrorMessage,
  getRefreshToken,
  setTokens,
} from "@/services/api-client";
import { API_BASE_URL } from "@/lib/constants";
import axios from "axios";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  const access = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!stored || !access) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const cached = readStoredUser();
      if (!cached) {
        setIsLoading(false);
        return;
      }
      setUser(cached);
      try {
        const me = await authService.me();
        setUser(me);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(me));
      } catch {
        // keep cached until refresh interceptor clears session
      }
      setIsLoading(false);
    };
    void init();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authService.login({ email, password });
      setTokens(response.access_token, response.refresh_token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      setUser(response.user);
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    // Clear local session first so nothing can restore auth during navigation
    clearSession();
    setUser(null);

    try {
      if (refreshToken) {
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );
      }
    } catch {
      // Session already cleared locally; continue to login
    }

    window.location.replace("/login");
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authService.me();
    setUser(me);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(me));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export { extractErrorMessage };
