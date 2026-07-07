import ServiceErrorPage from "@/components/ServiceErrorPage";
import type { ErrorReason } from "@/components/ServiceErrorPage";

/**
 * service-error/page.tsx
 *
 * Standalone error page route rendered by the health gate middleware.
 *
 * The middleware rewrites failed requests to /service-error?reason=xxx
 * without redirecting (the browser URL stays unchanged).
 *
 * We read the `searchParams` on the Server side because Next.js
 * middleware rewrites don't pass rewritten query params to client-side
 * hooks (like `useSearchParams`) after hydration.
 */

export const metadata = {
    title: "Service Unavailable",
    description: "The service is currently unavailable. Please try again shortly.",
};

// Force dynamic so the searchParams are always read fresh
export const dynamic = "force-dynamic";

const VALID_REASONS: ErrorReason[] = [
    "env_missing",
    "api_unreachable",
    "api_error",
    "db_disconnected",
    "runtime",
    "unknown",
];

function isValidReason(r: string | null): r is ErrorReason {
    return VALID_REASONS.includes(r as ErrorReason);
}

export default async function ServiceErrorRoute({
    searchParams,
}: {
    // Next.js 15 uses a Promise for searchParams
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // Await the params on the server
    const params = await searchParams;
    
    const rawReason = typeof params?.reason === "string" ? params.reason : null;
    const msg = typeof params?.msg === "string" ? params.msg : undefined;

    const reason: ErrorReason = isValidReason(rawReason) ? rawReason : "unknown";

    return <ServiceErrorPage reason={reason} message={msg} />;
}
