import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { LoginResponse } from "@/types/auth";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const BACKEND_AUTH_ERRORS = new Set([
  "MISSING_FIELDS",
  "INVALID_CREDENTIALS",
  "ACCOUNT_INACTIVE",
  "USER_NOT_FOUND",
  "SERVER_ERROR",
]);

const BACKEND_FETCH_TIMEOUT_MS = 10000;

async function loginWithBackend(
  employeeId: string,
  password: string
): Promise<LoginResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: employeeId, password }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 400) throw new Error("MISSING_FIELDS");
      if (res.status === 401) throw new Error("INVALID_CREDENTIALS");
      if (res.status === 403) throw new Error("ACCOUNT_INACTIVE");
      if (res.status === 404) throw new Error("USER_NOT_FOUND");
      throw new Error("SERVER_ERROR");
    }

    return res.json() as Promise<LoginResponse>;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("SERVER_ERROR");
    }
    throw err;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        employeeId: { label: "Employee ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.employeeId || !credentials?.password) {
          throw new Error("MISSING_FIELDS");
        }
        try {
          const data = await loginWithBackend(
            String(credentials.employeeId),
            String(credentials.password)
          );
          if (!data?.token || !data?.user) return null;
          return {
            id: String(data.user.id),
            email: data.user.email ?? undefined,
            name: data.user.name,
            employeeId: data.user.employeeId,
            role: data.user.role,
            status: data.user.status,
            branchId: data.user.branchId,
            token: data.token,
          };
        } catch (err) {
          if (err instanceof Error && BACKEND_AUTH_ERRORS.has(err.message)) {
            throw err;
          }
          throw new Error("SERVER_ERROR");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as { id?: string }).id ?? token.sub;
        token.token = (user as { token?: string }).token;
        token.employeeId = (user as { employeeId?: string }).employeeId;
        token.role = (user as { role?: string }).role;
        token.status = (user as { status?: string }).status;
        token.branchId = (user as { branchId?: number }).branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.sub;
        (session.user as Record<string, unknown>).token = token.token;
        (session.user as Record<string, unknown>).employeeId = token.employeeId;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).status = token.status;
        (session.user as Record<string, unknown>).branchId = token.branchId ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    maxAge: 12 * 60 * 60, // 12 hours absolute max
    updateAge: 15 * 60, // Extend session on activity every 15 min (rolling)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
