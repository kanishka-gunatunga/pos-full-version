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
// NextAuth Middleware
// =========================

const authMiddleware = withAuth({
  pages: {
    signIn: "/",
  },
});

// =========================
// Main Middleware
// =========================

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and error page
  if (
    pathname.startsWith(ERROR_ROUTE) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  // -----------------------
  // 1. Health Check FIRST
  // -----------------------

  const healthResponse = await runHealthCheck(request);

  if (healthResponse) {
    return healthResponse;
  }

  // -----------------------
  // 2. Then NextAuth
  // -----------------------

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/kitchen");

  if (isProtected) {
    return authMiddleware(request);
  }

  return NextResponse.next();
}

// =========================
// Health Check
// =========================

async function runHealthCheck(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip if recently checked
  const cookie = request.cookies.get(HEALTH_COOKIE);

  if (cookie?.value === "1") {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_API_URL) {
    return rewriteToError(request, "env_missing");
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(HEALTH_ENDPOINT, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return rewriteToError(request, "api_error");
    }

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
        return rewriteToError(request, "db_disconnected");
      }
    } catch {
      // Ignore invalid JSON
    }

    // Create response with cookie
    const responseWithCookie = NextResponse.next();

    responseWithCookie.cookies.set(HEALTH_COOKIE, "1", {
      maxAge: HEALTH_CACHE_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });

    return null;
  } catch (err) {
    return rewriteToError(request, "api_unreachable");
  }
}

// =========================
// Error Rewrite
// =========================

function rewriteToError(request: NextRequest, reason: string) {
  const url = request.nextUrl.clone();

  url.pathname = ERROR_ROUTE;
  url.searchParams.set("reason", reason);

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