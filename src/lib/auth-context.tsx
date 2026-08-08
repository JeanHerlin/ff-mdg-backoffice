"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, setAccessToken, tryRefresh } from "./api-client";

export type BackofficePermission =
  | "verifications"
  | "saisons"
  | "scrims"
  | "ligues"
  | "mercato"
  | "statistiques"
  | "annonces";

export interface AuthUser {
  id: string;
  email: string;
  role: "PLAYER" | "ADMIN" | "SUPER_ADMIN";
  displayName: string | null;
  avatarUrl: string | null;
  permissions: BackofficePermission[];
}

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  can: (permission: BackofficePermission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isBackofficeRole(user: AuthUser | null | undefined): user is AuthUser {
  return !!user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  const refreshUser = useCallback(async () => {
    const data = await apiRequest<{ user: AuthUser }>("/auth/me");
    const nextUser = isBackofficeRole(data?.user) ? data!.user : null;
    setUser(nextUser);
    setStatus(nextUser ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await tryRefresh();
      if (!ok) {
        setStatus("unauthenticated");
        return;
      }
      await refreshUser();
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<{ user: AuthUser; accessToken: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    if (!data) return;
    if (!isBackofficeRole(data.user)) {
      setAccessToken(null);
      throw new Error("auth.forbidden");
    }
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const can = useCallback(
    (permission: BackofficePermission) => {
      if (!user) return false;
      if (user.role === "SUPER_ADMIN") return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, status, login, logout, refreshUser, can }),
    [user, status, login, logout, refreshUser, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
