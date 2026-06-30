import axios from "axios";
import Cookies from "js-cookie";
import { getSession, signOut } from "next-auth/react";
import { notifyUserActivity } from "@/hooks/useAuthIdleTimeout";
import { ROUTES } from "@/lib/constants";

function getBackendOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  const fallback = "http://localhost:5000";
  if (!raw) return fallback;
  return raw.replace(/\/+$/, "").replace(/\/api$/i, "") || fallback;
}

const axiosInstance = axios.create({
  baseURL: `${getBackendOrigin()}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    let token = typeof window !== "undefined" ? Cookies.get("token") : null;

    if (!token && typeof window !== "undefined") {
      const session = await getSession();
      token = (session?.user as { token?: string })?.token ?? null;

      if (token) {
        Cookies.set("token", token, {
          expires: 1,
          sameSite: "lax",
          secure: window.location?.protocol === "https:",
        });
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      notifyUserActivity();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    // Wrong passcode → 403 + INVALID_MANAGER_PASSCODE (no logout). 
    const skipAuthRedirect =
      error?.config?.skipAuthRedirectOn401 === true;
    if (status === 401 && typeof window !== "undefined" && !skipAuthRedirect) {
      Cookies.remove("token");
      signOut({ callbackUrl: `${ROUTES.HOME}?from=session_expired` });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
