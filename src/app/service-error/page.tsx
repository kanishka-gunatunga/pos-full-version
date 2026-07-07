/**
 * service-error/page.tsx
 *
 * Standalone error page route rendered by the health gate middleware.
 *
 * The middleware rewrites failed requests to /service-error?reason=xxx
 * without redirecting (the browser URL stays unchanged).
 *
 * This page is excluded from middleware checks to prevent infinite loops.
 * It has NO dependency on the project's layout providers — it renders
 * its own complete UI so it works even if providers are broken.
 *
 * The `reason` query param maps to ServiceErrorPage's reason prop:
 *   env_missing     → Configuration Error
 *   api_unreachable → Service Unreachable
 *   api_error       → Server Error
 *   db_disconnected → Database Unavailable
 *   unknown         → Service Unavailable (default)
 */
import { Suspense } from "react";
import ServiceErrorPageClient from "./ServiceErrorPageClient";

export const metadata = {
    title: "Service Unavailable",
    description: "The service is currently unavailable. Please try again shortly.",
};

// Force dynamic so the reason searchParam is always read fresh
export const dynamic = "force-dynamic";

export default function ServiceErrorRoute() {
    return (
        <Suspense fallback={null}>
            <ServiceErrorPageClient />
        </Suspense>
    );
}
