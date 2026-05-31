"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api, ApiError, UserPublic } from "./api";

interface AuthState {
  user: UserPublic | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("focusnt_access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.auth
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("focusnt_access_token");
        localStorage.removeItem("focusnt_refresh_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.auth.login(email, password);
    localStorage.setItem("focusnt_access_token", data.access_token);
    localStorage.setItem("focusnt_refresh_token", data.refresh_token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const data = await api.auth.register(email, username, password);
      localStorage.setItem("focusnt_access_token", data.access_token);
      localStorage.setItem("focusnt_refresh_token", data.refresh_token);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("focusnt_access_token");
    localStorage.removeItem("focusnt_refresh_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
