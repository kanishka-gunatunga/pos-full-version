/**
 * API Client for Restaurant POS- Connects to Express.js backend
 */

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    const origin =
      (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "").replace(/\/api$/i, "");
    // In the browser, default to same-origin Next.js API routes if no backend origin is configured.
    return origin ? `${origin}/api` : "/api";
  }
  const origin =
    (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "").replace(/\/api$/i, "");
  return origin ? `${origin}/api` : "http://localhost:3001/api";
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(
      `API Error: ${response.status} ${response.statusText}`,
      response.status,
      errorData
    );
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return response.text() as Promise<T>;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  return handleResponse<T>(response);
}

export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, data?: unknown) =>
    apiClient<T>(endpoint, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(endpoint: string, data?: unknown) =>
    apiClient<T>(endpoint, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(endpoint: string, data?: unknown) =>
    apiClient<T>(endpoint, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(endpoint: string) => apiClient<T>(endpoint, { method: "DELETE" }),
};
