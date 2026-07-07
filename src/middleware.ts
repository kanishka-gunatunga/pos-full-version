/**
 * middleware.ts
 *
 * NextAuth + Backend Health Gate Middleware
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// =========================
// Configuration
// =========================

const HEALTH_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}/health`;

const HEALTH_CACHE_SECONDS = 30;

const ERROR_ROUTE = "/service-error";

const TIMEOUT_MS = 5000;

const HEALTH_COOKIE = "qs-health-ok";


// =========================
// Main Middleware
// =========================

export default withAuth(
    async function middleware(request: NextRequest) {

        const { pathname } = request.nextUrl;


        // -----------------------------------
        // Skip internal routes
        // -----------------------------------

        if (
            pathname.startsWith(ERROR_ROUTE) ||
            pathname.startsWith("/_next") ||
            pathname.startsWith("/api/")
        ) {
            return NextResponse.next();
        }



        // -----------------------------------
        // Health Check FIRST
        // -----------------------------------

        const healthError = await runHealthCheck(request);


        if (healthError) {
            return healthError;
        }



        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/",
        },
    }
);



// =========================
// Health Check
// =========================

async function runHealthCheck(
    request: NextRequest
): Promise<NextResponse | null> {


    // -----------------------------------
    // Check cached health cookie
    // -----------------------------------

    const healthCookie = request.cookies.get(
        HEALTH_COOKIE
    );


    if (healthCookie?.value === "1") {
        return null;
    }



    // -----------------------------------
    // Check environment variable
    // -----------------------------------

    if (!process.env.NEXT_PUBLIC_API_URL) {

        return rewriteToError(
            request,
            "env_missing",
            "NEXT_PUBLIC_API_URL is missing."
        );
    }



    // -----------------------------------
    // Call Backend Health API
    // -----------------------------------

    try {

        const controller = new AbortController();


        const timeoutId = setTimeout(
            () => controller.abort(),
            TIMEOUT_MS
        );


        const response = await fetch(
            HEALTH_ENDPOINT,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                cache: "no-store",
                signal: controller.signal,
            }
        );


        clearTimeout(timeoutId);



        // -----------------------------------
        // HTTP Status Check
        // -----------------------------------

        if (!response.ok) {

            return rewriteToError(
                request,
                "api_error",
                `Backend returned ${response.status} ${response.statusText}`
            );

        }



        // -----------------------------------
        // Database Status Check
        // -----------------------------------

        try {

            const body =
                await response.json() as Record<string, unknown>;


            const dbStatus =
                typeof body.db === "string"
                    ? body.db.toLowerCase()
                    : null;



            if (
                dbStatus &&
                dbStatus !== "connected" &&
                dbStatus !== "ok"
            ) {

                return rewriteToError(
                    request,
                    "db_disconnected",
                    `Database status: ${body.db}`
                );

            }


        } catch {

            // Backend alive but invalid JSON
            // Treat as healthy

        }



        // -----------------------------------
        // Health Passed
        // -----------------------------------

        const nextResponse = NextResponse.next();


        nextResponse.cookies.set(
            HEALTH_COOKIE,
            "1",
            {
                maxAge: HEALTH_CACHE_SECONDS,
                path: "/",
                httpOnly: true,
                sameSite: "strict",
            }
        );


        return null;



    } catch (err: unknown) {


        const isTimeout =
            err instanceof Error &&
            err.name === "AbortError";



        return rewriteToError(
            request,
            isTimeout
                ? "api_timeout"
                : "api_unreachable",
            isTimeout
                ? `Backend timeout after ${TIMEOUT_MS / 1000}s`
                : err instanceof Error
                    ? err.message
                    : String(err)
        );

    }

}




// =========================
// Error Rewrite
// =========================

function rewriteToError(
    request: NextRequest,
    reason: string,
    message?: string
) {


    console.error(
        `[Health Gate] ${reason}`,
        message
    );


    const url =
        request.nextUrl.clone();


    url.pathname = ERROR_ROUTE;


    url.searchParams.set(
        "reason",
        reason
    );


    if (message) {

        url.searchParams.set(
            "msg",
            message
        );

    }


    return NextResponse.rewrite(url);

}



// =========================
// Matcher
// =========================

export const config = {

    matcher: [
        "/dashboard/:path*",
        "/kitchen/:path*",
    ],

};