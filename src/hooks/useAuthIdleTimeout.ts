"use client";

import { useEffect, useRef, useCallback } from "react";

export const AUTH_ACTIVITY_EVENT = "auth:activity";

export function notifyUserActivity(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_ACTIVITY_EVENT));
}

const DEFAULT_IDLE_MS = 15 * 60 * 1000; // 15 minutes 

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

export interface UseAuthIdleTimeoutOptions {
  onIdle: () => void;
  idleTimeMs?: number;
  enabled?: boolean;
}

/**
 * Tracks user activity and invokes onIdle after the specified idle period.
 * Resets on: mouse, keyboard, scroll, touch, and auth:activity custom events.
 */
export function useAuthIdleTimeout({
  onIdle,
  idleTimeMs = DEFAULT_IDLE_MS,
  enabled = true,
}: UseAuthIdleTimeoutOptions): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      onIdleRef.current();
    }, idleTimeMs);
  }, [idleTimeMs, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    resetTimer();

    const handleActivity = () => resetTimer();

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, handleActivity);
    }
    window.addEventListener(AUTH_ACTIVITY_EVENT, handleActivity);

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, handleActivity);
      }
      window.removeEventListener(AUTH_ACTIVITY_EVENT, handleActivity);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [resetTimer, enabled]);
}
