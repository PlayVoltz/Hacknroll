"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "../../lib/api";

export type Me = {
  id: string;
  email: string;
  username: string;
  profileImageUrl: string | null;
};

type AuthCtx = {
  me: Me | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    try {
      const data = await apiFetch<Me>("/api/auth/me");
      setMe(data);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setMe(null);
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ me, loading, refreshMe, logout }),
    [me, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

