"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("ff_token");
    if (!token) { setLoading(false); return; }
    try {
      const me = await api.get<User>("/users/me");
      setUser(me);
    } catch {
      localStorage.removeItem("ff_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const register = async (email: string, name: string, password: string) => {
    const { access_token } = await api.post<{ access_token: string }>("/auth/register", { email, name, password });
    localStorage.setItem("ff_token", access_token);
    const me = await api.get<User>("/users/me");
    setUser(me);
    router.push("/home");
  };

  const login = async (email: string, password: string) => {
    const { access_token } = await api.post<{ access_token: string }>("/auth/login", { email, password });
    localStorage.setItem("ff_token", access_token);
    const me = await api.get<User>("/users/me");
    setUser(me);
    router.push("/home");
  };

  const logout = () => {
    localStorage.removeItem("ff_token");
    setUser(null);
    router.push("/login");
  };

  return { user, loading, register, login, logout };
}
