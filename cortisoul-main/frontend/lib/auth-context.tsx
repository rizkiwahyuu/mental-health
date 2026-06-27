"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  authApi,
  usersApi,
  setTokens,
  clearTokens,
  getRefreshToken,
  decodeJwtPayload,
  registerUnauthorizedCallback,
  type User,
} from "./api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, fullname?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_STORAGE_KEY = "cortisoul_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Ambil data user lengkap dari backend menggunakan access token.
   * JWT payload berisi `{ id }` → gunakan untuk hit GET /users/:id
   */
  const fetchUserProfile = useCallback(async (accessToken: string): Promise<User | null> => {
    try {
      const payload = decodeJwtPayload(accessToken);
      const userId = payload?.id as string | undefined;
      if (!userId) return null;

      const res = await usersApi.getById(userId);
      const userData = res.data?.user;
      if (!userData) return null;

      return {
        id: userData.id,
        username: userData.username,
        fullname: userData.fullname,
      };
    } catch {
      return null;
    }
  }, []);

  // Register callback untuk mendeteksi 401 (auth expired) secara global
  useEffect(() => {
    registerUnauthorizedCallback(() => {
      setUser(null);
      clearTokens();
      localStorage.removeItem(USER_STORAGE_KEY);
    });
  }, []);

  // Restore session dari localStorage & lakukan validasi token/refresh saat mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (token && storedUser) {
        try {
          const payload = decodeJwtPayload(token);
          const isExpired = payload && typeof payload.exp === "number" && (Date.now() / 1000) >= (payload.exp - 30);

          if (isExpired) {
            // Token kedaluwarsa, coba lakukan refresh
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const apiBaseUrl = (
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
              ).replace(/\/+$/, "");
              const refreshRes = await fetch(`${apiBaseUrl}/authentications`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                const newAccessToken = refreshData.data?.accessToken;
                if (newAccessToken) {
                  setTokens(newAccessToken, refreshToken);
                  const profile = await fetchUserProfile(newAccessToken);
                  const userData: User = profile ?? JSON.parse(storedUser);
                  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
                  setUser(userData);
                  setIsLoading(false);
                  return;
                }
              }
            }
            // Jika refresh gagal atau tidak ada refresh token
            clearTokens();
            localStorage.removeItem(USER_STORAGE_KEY);
            setUser(null);
          } else {
            // Token masih valid, pakai yang sudah ada
            setUser(JSON.parse(storedUser));
          }
        } catch (e) {
          console.error("Auth initialization error:", e);
          clearTokens();
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
        }
      } else {
        clearTokens();
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchUserProfile]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login({ username, password });
    const { accessToken, refreshToken } = res.data as {
      accessToken: string;
      refreshToken: string;
    };
    setTokens(accessToken, refreshToken);

    // Ambil profil lengkap dari backend (termasuk fullname)
    const profile = await fetchUserProfile(accessToken);
    const userData: User = profile ?? { id: "", username };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  }, [fetchUserProfile]);

  const register = useCallback(async (
    username: string,
    password: string,
    fullname?: string
  ) => {
    await authApi.register({ username, password, fullname });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Tetap lanjutkan logout meski request gagal
      }
    }
    clearTokens();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
