/**
 * error.tsx — Next.js App Router Error Boundary
 *
 * Automatically catches:
 *  - Unhandled runtime JavaScript exceptions in any page/component
 *  - React render errors (component throws during render)
 *  - Hydration mismatches that cause crashes
 *
 * Next.js guarantees this file is used as the error boundary for all
 * routes inside app/. It must be a "use client" component.
 *
 * The `reset` function re-renders the subtree — use it for the retry button.
 * If the error is catastrophic, fall back to a hard reload.
 */
"use client";

import ServiceErrorPage from "@/components/ServiceErrorPage";
import { useEffect } from "react";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        // Log to your error tracking service here (Sentry, Datadog, etc.)
        console.error("[Quick Seats] Runtime error caught by error.tsx:", error);
    }, [error]);

    return (
        <ServiceErrorPage
            reason="runtime"
            message={
                process.env.NODE_ENV === "development"
                    ? `${error.message}${error.digest ? ` (digest: ${error.digest})` : ""}`
                    : undefined
            }
            resetErrorBoundary={reset}
        />
    );
}
