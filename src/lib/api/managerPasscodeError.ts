const INVALID_CODE = "INVALID_MANAGER_PASSCODE";

export function isInvalidManagerPasscodeError(err: unknown): boolean {
  const ax = err as {
    response?: { status?: number; data?: unknown };
  };
  const data = ax.response?.data;
  const rec =
    data != null && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;
  if (rec?.code === INVALID_CODE) return true;
  const msg = String(rec?.message ?? "");
  if (/invalid passcode|invalid manager passcode/i.test(msg)) return true;
  return false;
}
