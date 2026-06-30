/**
 * API client helpers for authenticated requests to the Restaurant POS backend.
 * Use getSession() or the token from useAuth() to send Authorization header.
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export function getApiUrl(path: string): string {
  const base = API_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export type AuthHeaders = {
  Authorization: string;
  "Content-Type"?: string;
};

/**
 * Build headers with Bearer token for backend API calls.
 * Use from server components or API routes: pass the token from getServerSession or getToken.
 * Use from client: pass the token from useAuth().token or getSession().
 */
export function authHeaders(token: string | null): AuthHeaders {
  const headers: AuthHeaders = {
    Authorization: token ? `Bearer ${token}` : "",
  };
  return headers;
}

/**
 * Fetch wrapper for GET requests to the backend with auth.
 */
export async function fetchWithAuth(
  path: string,
  token: string | null,
  init?: RequestInit
): Promise<Response> {
  const url = getApiUrl(path);
  return fetch(url, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init?.headers as Record<string, string>),
    },
  });
}

/**
 * GET /api/auth/me - get current user from backend (validates token).
 */
export async function fetchMe(token: string | null): Promise<Response> {
  return fetchWithAuth("/api/auth/me", token);
}
