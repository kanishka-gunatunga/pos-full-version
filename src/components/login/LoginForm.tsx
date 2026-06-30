"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { User, Lock, ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

const ERROR_MESSAGES: Record<string, string> = {
  MISSING_FIELDS: "Please enter Employee ID and Password.",
  INVALID_CREDENTIALS: "Invalid Employee ID or Password.",
  CredentialsSignin: "Invalid Employee ID or Password.",
  ACCOUNT_INACTIVE: "Account is inactive. Contact your manager.",
  USER_NOT_FOUND: "User not found.",
  SERVER_ERROR: "Something went wrong. Try again later.",
  TIMEOUT: "Connection timed out. Check your network or try again.",
  ROLE_NOT_SUPPORTED: "Your account role is not set up for this app. Contact your manager.",
};

const SIGN_IN_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

export default function LoginForm() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const fromLogout = searchParams.get("from") === "logout";
  const fromIdle = searchParams.get("from") === "idle";
  const fromSessionExpired = searchParams.get("from") === "session_expired";

  useEffect(() => {
    if (fromIdle) {
      toast.info("You were signed out due to inactivity. Please sign in again.");
    } else if (fromSessionExpired) {
      toast.info("Your session expired. Please sign in again.");
    }
  }, [fromIdle, fromSessionExpired]);

  // Redirect only when authenticated, we have a valid user, AND the token is available for API calls.
  // If we just came from an explicit logout, idle timeout, or session expiry, wait until a new login succeeds.
  useEffect(() => {
    if ((fromLogout || fromIdle || fromSessionExpired) && !loginSuccess) return;
    if (sessionStatus !== "authenticated" || !user || !token) return;
    if (user.role === "kitchen") router.replace(ROUTES.KITCHEN);
    else if (user.role === "cashier") router.replace(ROUTES.DASHBOARD_MENU);
    else router.replace(ROUTES.DASHBOARD);
  }, [sessionStatus, user, token, router, fromLogout, fromIdle, fromSessionExpired, loginSuccess]);


  useEffect(() => {
    if (sessionStatus !== "authenticated" || user) return;
    setError(ERROR_MESSAGES.ROLE_NOT_SUPPORTED);
    signOut({ redirect: false }).then(() => router.refresh());
  }, [sessionStatus, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const id = employeeId.trim();
    if (!id || !password) {
      setError(ERROR_MESSAGES.MISSING_FIELDS);
      return;
    }
    setIsSubmitting(true);
    let didSucceed = false;
    try {
      const result = await withTimeout(
        signIn("credentials", {
          employeeId: id,
          password,
          redirect: false,
        }),
        SIGN_IN_TIMEOUT_MS,
        "TIMEOUT"
      );

      if (result?.error) {
        const msg = ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.SERVER_ERROR;
        setError(msg);
        return;
      }

      if (result?.ok) {
        didSucceed = true;
        setLoginSuccess(true);
        await router.refresh();
        return;
      }

      setError(ERROR_MESSAGES.SERVER_ERROR);
    } catch (err) {
      const message = err instanceof Error ? err.message : "SERVER_ERROR";
      const msg = ERROR_MESSAGES[message] ?? ERROR_MESSAGES.SERVER_ERROR;
      setError(msg);
    } finally {
      if (!didSucceed) setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col items-center rounded-3xl bg-white px-10 py-10 shadow-xl"
    >
      {/* Logo - Bistro/House icon */}
      <div className="mb-4 flex h-[52px] w-16 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.1),0px_10px_15px_-3px_rgba(0,0,0,0.1)]">
        <Image src="/house_icon.svg" alt="" width={28} height={28} className="h-7 w-7" />
      </div>

      <h1 className="text-center font-[Arial] text-[28px] font-black leading-[36px] tracking-[-0.75px] text-[#1D293D]">
        Ahas Gawwa POS
      </h1>
      <p className="mb-8 mt-4 font-[Arial] text-[10px] font-normal leading-[15px] tracking-[1px] uppercase text-[#62748E]">
        Login Here
      </p>

      {error && (
        <p className="mb-4 w-full rounded-xl bg-red-50 px-4 py-2.5 font-[Arial] text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Employee ID */}
      <div className="mb-5 w-full">
        <label
          htmlFor="employeeId"
          className="mb-2 block font-[Arial] text-[12px] font-bold leading-[16px] tracking-[1.2px] uppercase text-[#90A1B9]"
        >
          Employee ID
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            id="employeeId"
            type="text"
            placeholder="e.g. EMP001"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            autoComplete="username"
            disabled={isSubmitting || loginSuccess}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3.5 pl-12 pr-4 text-zinc-800 placeholder:font-[Arial] placeholder:text-[16px] placeholder:leading-[100%] placeholder:text-[#31415880] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Password */}
      <div className="mb-8 w-full">
        <label
          htmlFor="password"
          className="mb-2 block font-[Arial] text-[12px] font-bold leading-[16px] tracking-[1.2px] uppercase text-[#90A1B9]"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            id="password"
            type="password"
            placeholder="••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting || loginSuccess}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3.5 pl-12 pr-4 text-zinc-800 placeholder:font-[Arial] placeholder:text-[16px] placeholder:leading-[100%] placeholder:text-[#31415880] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Sign In Button */}
      <button
        type="submit"
        disabled={isSubmitting || loginSuccess}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-medium text-white shadow-[var(--shadow-primary)] transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
      >
        {loginSuccess ? "Redirecting…" : isSubmitting ? "Signing in…" : "Sign In to Terminal"}
        <ArrowRight className="h-5 w-5" />
      </button>

      {/* Forgot credentials */}
      {/* <p className="mt-10 text-center font-[Arial] text-[12px] font-normal leading-[16px] text-[#90A1B9]">
        Forgot your credentials?{" "}
        <a
          href="#"
          className="inline font-[Arial] text-[16px] font-bold leading-[24px] text-primary hover:underline hover:opacity-90"
        >
          Contact Manager
        </a>
      </p> */}
    </form>
  );
}
