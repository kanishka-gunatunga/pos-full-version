export function isLikelyConnectivityOrTimeoutError(err: unknown): boolean {
  const e = err as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: unknown };
  };

  const axiosCodes = ["ECONNABORTED", "ETIMEDOUT", "ERR_NETWORK", "ECONNREFUSED", "ENOTFOUND", "ECONNRESET"];
  if (e.code && axiosCodes.includes(e.code)) return true;

  const msg = String(e.message ?? "");
  if (!e.response && /network error|timeout|aborted|failed to fetch|load failed|i\/o error/i.test(msg)) {
    return true;
  }

  const status = e.response?.status;
  if (status === 408 || status === 504 || status === 502) return true;

  if (status != null && status >= 502) {
    const data = e.response?.data;
    if (data != null && typeof data === "object" && !Array.isArray(data)) {
      const rec = data as Record<string, unknown>;
      const apiMsg = String(rec.message ?? rec.error ?? "");
      if (/timed out|gateway|bad gateway|service unavailable/i.test(apiMsg)) return true;
    }
  }

  return false;
}
