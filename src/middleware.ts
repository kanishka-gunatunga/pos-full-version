import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";

const HEALTH_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}/api/health`;
const HEALTH_CACHE_SECONDS = 30;
const HEALTH_COOKIE = "qs-health-ok";
const FORCE_ERROR_COOKIE = "qs-force-error";

async function runHealthGate(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/site_unavailable.html"
  ) {
    return undefined;
  }

  const forceError = request.cookies.get(FORCE_ERROR_COOKIE);
  if (forceError) {
    console.error(
      `[Health Gate] ❌ Intercepted forced error from frontend: ${forceError.value}`
    );
    return serveStaticErrorPage(request);
  }

  const healthCookie = request.cookies.get(HEALTH_COOKIE);
  if (healthCookie?.value === "1") {
    return undefined;
  }

  let isHealthy = true;
  let failReason = "";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(HEALTH_ENDPOINT, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      isHealthy = false;
      failReason = `api_error: Backend returned HTTP ${response.status}`;
    } else {
      try {
        const body = (await response.json()) as Record<string, unknown>;
        const dbStatus =
          typeof body.db === "string" ? body.db.toLowerCase() : null;
        if (dbStatus !== null && dbStatus !== "connected" && dbStatus !== "ok") {
          isHealthy = false;
          failReason = `db_disconnected: Backend reported db is "${body.db}"`;
        }
      } catch {
        // Valid response but no JSON is acceptable.
      }
    }
  } catch (err) {
    isHealthy = false;
    const msg = err instanceof Error ? err.message : String(err);
    failReason = `api_unreachable: ${msg}`;
  }

  if (!isHealthy) {
    console.error(`[Health Gate] ❌ Health check failed: ${failReason}`);
    return serveStaticErrorPage(request);
  }

  const nextResponse = NextResponse.next();
  nextResponse.cookies.set(HEALTH_COOKIE, "1", {
    maxAge: HEALTH_CACHE_SECONDS,
    path: "/",
    httpOnly: true,
    sameSite: "strict",
  });
  return nextResponse;
}

function serveStaticErrorPage(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.rewrite(
    new URL("/site_unavailable.html", request.url)
  );
}

export default async function middleware(request: NextRequest) {
  const healthResponse = await runHealthGate(request);
  if (healthResponse) return healthResponse;
  return withAuth(request as NextRequestWithAuth, {
    pages: {
      signIn: "/",
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
