/**
 * middleware.ts
 *
 * NextAuth + Backend Health Gate + Static Error Page
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";


// =========================
// Configuration
// =========================

const HEALTH_ENDPOINT =
    `${process.env.NEXT_PUBLIC_API_URL}/health`;

const HEALTH_CACHE_SECONDS = 30;

const HEALTH_COOKIE = "qs-health-ok";

const FORCE_ERROR_COOKIE = "qs-force-error";

const ERROR_PAGE = "/site_unavailable.html";

const TIMEOUT_MS = 5000;


// =========================
// Main Middleware
// =========================

export default withAuth(
    async function middleware(request: NextRequest) {

        const { pathname } = request.nextUrl;


        // -----------------------------------
        // Allow internal files and error page
        // -----------------------------------

        if (
            pathname.startsWith("/_next") ||
            pathname.startsWith("/api/") ||
            pathname === ERROR_PAGE
        ) {
            return NextResponse.next();
        }



        // -----------------------------------
        // Frontend forced error handling
        // -----------------------------------

        const forceError =
            request.cookies.get(FORCE_ERROR_COOKIE);


        if (forceError) {

            console.error(
                "[Health Gate] Frontend forced error:",
                forceError.value
            );


            return serveStaticErrorPage(request);
        }



        // -----------------------------------
        // Backend health check
        // -----------------------------------

        const healthError =
            await runHealthCheck(request);



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


    // Cache check

    const healthCookie =
        request.cookies.get(
            HEALTH_COOKIE
        );


    if (healthCookie?.value === "1") {
        return null;
    }



    // Environment check

    if (!process.env.NEXT_PUBLIC_API_URL) {

        return serveStaticErrorPage(
            request
        );
    }



    try {


        const controller =
            new AbortController();


        const timeoutId =
            setTimeout(
                () => controller.abort(),
                TIMEOUT_MS
            );



        const response =
            await fetch(
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



        if (!response.ok) {


            console.error(
                "[Health Gate] API failed:",
                response.status
            );


            return serveStaticErrorPage(
                request
            );
        }



        // Database check

        try {


            const body = (await response.json()) as Record<string, unknown>;



            const dbStatus =
                typeof body.db === "string"
                    ? body.db.toLowerCase()
                    : null;



            if (
                dbStatus &&
                dbStatus !== "connected" &&
                dbStatus !== "ok"
            ) {


                console.error(
                    "[Health Gate] Database down:",
                    body.db
                );


                return serveStaticErrorPage(
                    request
                );

            }


        } catch {

            // ignore invalid JSON

        }



        return null;



    } catch(err) {


        console.error(
            "[Health Gate] Backend unreachable:",
            err
        );


        return serveStaticErrorPage(
            request
        );

    }

}



// =========================
// Static Error Handler
// =========================

function serveStaticErrorPage(
    request: NextRequest
) {


    const { pathname } =
        request.nextUrl;



    /*
        If user is visiting:

        /dashboard
        /dashboard/users
        /events/123

        redirect them to homepage

    */

    if (pathname !== "/") {


        return NextResponse.redirect(
            new URL(
                "/",
                request.url
            )
        );

    }



    /*
        Homepage request:
        Replace normal app with static error page

    */

    return NextResponse.rewrite(
        new URL(
            ERROR_PAGE,
            request.url
        )
    );

}



// =========================
// Matcher
// =========================

export const config = {

    matcher: [
        /*
          Protect all pages except:
          - next static
          - images
          - assets
        */

        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",

    ],

};