"use client";

/**
 * ServiceErrorPageClient.tsx
 *
 * Client component that reads the `reason` query param from the URL
 * (set by middleware) and renders the appropriate error UI.
 *
 * Separated from page.tsx so useSearchParams can work inside Suspense.
 */

import { useSearchParams } from "next/navigation";
import ServiceErrorPage from "@/components/ServiceErrorPage";
import type { ErrorReason } from "@/components/ServiceErrorPage";

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

export default function ServiceErrorPageClient() {
    const searchParams = useSearchParams();
    const rawReason = searchParams.get("reason");
    const reason: ErrorReason = isValidReason(rawReason) ? rawReason : "unknown";

    return <ServiceErrorPage reason={reason} />;
}
