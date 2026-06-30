"use client";

import { createContext, useContext, useCallback, useLayoutEffect, useMemo, type ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { ROUTES } from "@/lib/constants";
import { getMe } from "@/services/userService";

export type UserRole = "cashier" | "manager" | "admin" | "kitchen";

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  employeeId?: string;
  email?: string | null;
  branchId?: number | null;
  branchName?: string | null;
};

const ALLOWED_ROLES: UserRole[] = ["admin", "manager", "cashier", "kitchen"];

function sessionUserToAuthUser(
  sessionUser: { id?: string; name?: string | null; role?: string } | null
): AuthUser | null {
  if (!sessionUser?.id || !sessionUser?.name || !sessionUser?.role) return null;
  const rawRole = sessionUser.role;
  const roleLower = typeof rawRole === "string" ? rawRole.trim().toLowerCase() : "";
  const role = ALLOWED_ROLES.includes(roleLower as UserRole) ? (roleLower as UserRole) : null;
  if (!role) return null;
  return {
    id: sessionUser.id,
    name: sessionUser.name,
    role,
    employeeId: (sessionUser as { employeeId?: string }).employeeId,
    email: (sessionUser as { email?: string | null }).email ?? null,
    branchId: (sessionUser as { branchId?: number | null }).branchId ?? null,
  };
}

type AuthContextType = {
  user: AuthUser | null;
  role: UserRole | null;
  isReady: boolean;
  isCashier: boolean;
  isKitchen: boolean;
  isManagerOrAdmin: boolean;
  token: string | null;
  login: (role: UserRole, name?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isReady = status !== "loading";
  const token = (session?.user as { token?: string } | undefined)?.token ?? null;

  const meQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => getMe(),
    enabled: isReady && status === "authenticated" && !!token,
    staleTime: 5 * 60 * 1000,
  });

  const user = useMemo((): AuthUser | null => {
    const base = sessionUserToAuthUser(session?.user ?? null);
    if (!base) return null;
    if (status !== "authenticated") return base;
    if (meQuery.isPending) return { ...base, branchName: undefined };
    return { ...base, branchName: meQuery.data?.user?.branchName ?? null };
  }, [session?.user, status, meQuery.isPending, meQuery.data?.user?.branchName]);

  // useLayoutEffect runs before paint so the cookie is set before any child component's effects (e.g. dashboard fetch)
  useLayoutEffect(() => {
    if (token) {
      Cookies.set("token", token, {
        expires: 1,
        sameSite: "lax",
        secure: typeof window !== "undefined" && window.location?.protocol === "https:",
      });
    } else if (status === "unauthenticated") {
      Cookies.remove("token");
    }
  }, [token, status]);

  const logout = useCallback(() => {
    signOut({ callbackUrl: `${ROUTES.HOME}?from=logout` });
  }, []);

  const login = useCallback((_role: UserRole, _name?: string) => {
    // No-op: actual login is done via NextAuth signIn in LoginForm
  }, []);

  const value: AuthContextType = {
    user,
    role: user?.role ?? null,
    isReady,
    isCashier: user?.role === "cashier",
    isKitchen: user?.role === "kitchen",
    isManagerOrAdmin: user?.role === "manager" || user?.role === "admin",
    token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
