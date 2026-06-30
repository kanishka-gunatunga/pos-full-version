import { isInvalidManagerPasscodeError } from "@/lib/api/managerPasscodeError";
import { isLikelyConnectivityOrTimeoutError } from "@/lib/api/requestErrors";

export type SessionCloseErrorContext = "logout_modal" | "drawer_modal";

export function getSessionCloseErrorMessage(
  err: unknown,
  context: SessionCloseErrorContext
): string {
  const ax = err as {
    response?: { status?: number; data?: { message?: string } };
    message?: string;
  };
  const apiMessage = ax.response?.data?.message;
  const raw =
    (typeof apiMessage === "string" ? apiMessage : null) ||
    (err instanceof Error ? err.message : "Failed to close session.");

  if (isInvalidManagerPasscodeError(err)) {
    return "Wrong passcode.";
  }

  const status = ax.response?.status;
  if (status === 503) {
    const prefix =
      typeof apiMessage === "string" && apiMessage.trim().length > 0 ? `${apiMessage} ` : "";
    return (
      `${prefix}Try again in a few seconds. If this keeps happening, wait for other requests to finish or ask your admin to increase DB_POOL_MAX (database connection pool).`
    );
  }

  if (typeof apiMessage === "string" && ax.response != null) {
    if (/operation timeout|request timed out/i.test(apiMessage)) {
      return (
        "The server hit a database timeout while closing the session (often connection pool exhaustion). Fix this on the backend (pool size, passcode verification before transactions)—not a wrong API URL."
      );
    }
    return apiMessage;
  }

  if (isLikelyConnectivityOrTimeoutError(err)) {
    if (context === "logout_modal") {
      return (
        "The server did not respond in time or the connection failed. Check that the API is running and NEXT_PUBLIC_API_URL is correct, then try again. You can also use “Go to Drawer” to close the session from the Drawer page."
      );
    }
    return "Unable to reach the server. Check that the API is running and try again.";
  }

  const isTechnical =
    /initialization vector|ECONNREFUSED|ECONNRESET|decrypt|ENOTFOUND/i.test(String(raw));
  if (isTechnical) {
    return "Unable to close session. Please try again or contact support.";
  }

  return raw || "Failed to close session.";
}
