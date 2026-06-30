"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import * as sessionService from "@/services/sessionService";
import { useAuth } from "@/contexts/AuthContext";

type SessionData = { initialAmount: number; startedAt: string } | null;

type DrawerSessionContextType = {
  hasDrawerStarted: boolean;
  hasActiveSession: boolean;
  
  sessionData: SessionData;
  setHasDrawerStarted: (v: boolean) => void;
  setHasActiveSession: (v: boolean) => void;
  setSessionData: React.Dispatch<React.SetStateAction<SessionData>>;
  hasSession: boolean;
  isSessionLoading: boolean;
  /** Force re-fetch from backend (useful after login/focus). */
  refreshSession: () => Promise<void>;
};

const DrawerSessionContext = createContext<DrawerSessionContextType | null>(null);

export function DrawerSessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasDrawerStarted, setHasDrawerStarted] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const current = await sessionService.getCurrentSession();
    if (current) {
      // If backend returns user-scoped sessions, ensure we don't treat another user's session as ours.
      const currentUserId = (current as { userId?: string | number }).userId;
      if (currentUserId != null && user?.id != null && String(currentUserId) !== String(user.id)) {
        setHasActiveSession(false);
        setHasDrawerStarted(false);
        setSessionData(null);
        return;
      }
      const { initialAmount, startedAt } = sessionService.parseActiveSessionForUI(current);
      setSessionData({ initialAmount, startedAt });
      setHasActiveSession(true);
      setHasDrawerStarted(true);
      return;
    }
    // No active session on backend → reset local state
    setHasActiveSession(false);
    setHasDrawerStarted(false);
    setSessionData(null);
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshSession();
      } catch (e: unknown) {
        // If token wasn't ready yet, retry once shortly after (common in production on first load)
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          await new Promise((r) => setTimeout(r, 800));
          if (!cancelled) {
            try {
              await refreshSession();
            } catch {
              // swallow
            }
          }
        }
      } finally {
        if (!cancelled) setIsSessionLoading(false);
      }
    })();

    const onFocus = () => {
      refreshSession().catch(() => {});
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshSession().catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshSession]);

  const hasSession = hasDrawerStarted && hasActiveSession;

  return (
    <DrawerSessionContext.Provider
      value={{
        hasDrawerStarted,
        hasActiveSession,
        sessionData,
        setHasDrawerStarted,
        setHasActiveSession,
        setSessionData,
        hasSession,
        isSessionLoading,
        refreshSession,
      }}
    >
      {children}
    </DrawerSessionContext.Provider>
  );
}

export function useDrawerSession() {
  const ctx = useContext(DrawerSessionContext);
  return ctx;
}
