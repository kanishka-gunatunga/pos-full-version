/**
 * healthCheck.ts
 *
 * ─────────────────────────────────────────────────────────────────
 * REUSABLE HEALTH GATE — drop this into any Next.js project
 * ─────────────────────────────────────────────────────────────────
 *
 * Called from the root layout (async Server Component) before the
 * app renders. If any check fails the layout shows a full-screen
 * error page instead of loading the site.
 *
 * Checks performed (in order):
 *  1. Environment variables are set
 *  2. Backend API is reachable
 *  3. Backend reports DB is connected
 *
 * To adapt for another project:
 *  - Change HEALTH_ENDPOINT to your backend's health route
 *  - Adjust the DB status field name in parseHealthResponse()
 */

export type HealthReason =
    | "env_missing"
    | "api_unreachable"
    | "api_error"
    | "db_disconnected"
    | "unknown";

export interface HealthResult {
    healthy: boolean;
    reason?: HealthReason;
    message?: string;
    /** Raw response from the health endpoint (if reachable) */
    details?: Record<string, unknown>;
}

// ─── Configuration ────────────────────────────────────────────────

/**
 * The path appended to NEXT_PUBLIC_API_URL for the health check.
 * Your Node.js backend must expose this route.
 * Example response: { "status": "ok", "db": "connected" }
 */
const HEALTH_PATH = "/health";

/**
 * How long (ms) to wait for the backend before declaring it down.
 * Keep this short so the error page appears quickly.
 */
const TIMEOUT_MS = 5000;

// ─── Core logic ───────────────────────────────────────────────────

/**
 * Runs all pre-flight health checks.
 * Safe to call from a Next.js async Server Component / layout.
 */
export async function runHealthChecks(): Promise<HealthResult> {
    // ── 1. Environment variables ──────────────────────────────────
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl || apiUrl.trim() === "") {
        return {
            healthy: false,
            reason: "env_missing",
            message:
                "NEXT_PUBLIC_API_URL is not configured. Check your environment variables.",
        };
    }

    // ── 2. Backend reachability ───────────────────────────────────
    const healthUrl = `${apiUrl.replace(/\/$/, "")}${HEALTH_PATH}`;

    let response: Response;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        response = await fetch(healthUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
            // Disable Next.js fetch caching — always run a fresh check
            cache: "no-store",
        });

        clearTimeout(timeoutId);
    } catch (err: unknown) {
        const isTimeout =
            err instanceof Error && err.name === "AbortError";

        return {
            healthy: false,
            reason: "api_unreachable",
            message: isTimeout
                ? `Backend did not respond within ${TIMEOUT_MS / 1000}s.`
                : `Cannot reach backend at ${healthUrl}. ${err instanceof Error ? err.message : ""}`,
        };
    }

    // ── 3. HTTP status check ──────────────────────────────────────
    if (!response.ok) {
        return {
            healthy: false,
            reason: "api_error",
            message: `Backend returned HTTP ${response.status} (${response.statusText}).`,
        };
    }

    // ── 4. Parse health response & check DB ──────────────────────
    let body: Record<string, unknown> = {};
    try {
        body = await response.json();
    } catch {
        // Backend is reachable but didn't return JSON — treat as healthy
        // (Some backends return plain "OK" text)
        return { healthy: true, details: {} };
    }

    const dbStatus =
        typeof body.db === "string" ? body.db.toLowerCase() : null;

    if (dbStatus !== null && dbStatus !== "connected" && dbStatus !== "ok") {
        return {
            healthy: false,
            reason: "db_disconnected",
            message: `Database is not connected (reported: "${body.db}").`,
            details: body,
        };
    }

    // ── All checks passed ─────────────────────────────────────────
    return { healthy: true, details: body };
}
