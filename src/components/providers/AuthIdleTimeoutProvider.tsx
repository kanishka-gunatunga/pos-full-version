"use client";

import { useSession, signOut } from "next-auth/react";
import { useAuthIdleTimeout } from "@/hooks/useAuthIdleTimeout";
import { ROUTES, AUTH_IDLE_TIMEOUT_MINUTES } from "@/lib/constants";

const IDLE_TIMEOUT_MINUTES =
  Number(process.env.NEXT_PUBLIC_AUTH_IDLE_TIMEOUT_MINUTES) || AUTH_IDLE_TIMEOUT_MINUTES;


// When the user is authenticated, tracks activity and signs out after idle period.
export function AuthIdleTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;

  useAuthIdleTimeout({
    onIdle: () => {
      signOut({ callbackUrl: `${ROUTES.HOME}?from=idle` });
    },
    idleTimeMs: IDLE_TIMEOUT_MINUTES * 60 * 1000,
    enabled: isAuthenticated,
  });

  return <>{children}</>;
}
