"use client";

/**
 * ServiceErrorPageClient.tsx
 *
 * Reads `reason` and `msg` query params set by middleware and renders
 * the appropriate error UI with a debug panel showing the exact cause.
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
    const msg = searchParams.get("msg");

    const reason: ErrorReason = isValidReason(rawReason) ? rawReason : "unknown";

    // Always show the message — it tells you exactly what failed.
    // In production you can remove the `message` prop to hide it from end users.
    return (
        <ServiceErrorPage
            reason={reason}
            message={msg ?? undefined}
        />
    );
}
