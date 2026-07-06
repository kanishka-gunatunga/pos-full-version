import axiosInstance from "@/lib/api/axiosInstance";

export type CashActionType = "add" | "remove";

export interface CashActionPayload {
  type: CashActionType;
  amount: number;
  description?: string;
  passcode: string;
}
export interface CloseSessionPayload {
  passcode: string;
  actualBalance?: number;
}

export async function closeSession(payload: CloseSessionPayload): Promise<void> {
  const body: Record<string, unknown> = { passcode: payload.passcode };
  if (payload.actualBalance !== undefined) {
    body.actualBalance = payload.actualBalance;
  }
  await axiosInstance.post("/sessions/close", body, {
    skipAuthRedirectOn401: true,
    timeout: 120_000,
  });
}

export interface CurrentSession {
  id?: string | number;
  startBalance?: number | string;
  currentBalance?: number | string;
  status?: string;
  startTime?: string;
  startedAt?: string;
  openedAt?: string;
  endTime?: string | null;
  [key: string]: unknown;
}

export interface CashActionResponse {
  session?: CurrentSession;
  transaction?: unknown;
}

/** Add or remove cash from the current drawer session. */
export async function cashAction(payload: CashActionPayload): Promise<CashActionResponse> {
  const res = await axiosInstance.post<
    CashActionResponse | { data?: CashActionResponse; session?: CurrentSession }
  >("/sessions/cash-action", payload, {
    skipAuthRedirectOn401: true,
  });
  let body: unknown = res.data;
  if (body && typeof body === "object" && "data" in body && (body as { data?: unknown }).data != null) {
    body = (body as { data: CashActionResponse }).data;
  }
  const b = body as CashActionResponse & { session?: CurrentSession };
  return {
    session: b?.session,
    transaction: b?.transaction,
  };
}

export async function adjustInitialAmount(params: {
  currentAmount: number;
  newAmount: number;
  reason: string;
  passcode: string;
}): Promise<void> {
  const { currentAmount, newAmount, reason, passcode } = params;
  const diff = newAmount - currentAmount;
  if (Math.abs(diff) < 0.01) return;
  await axiosInstance.post("/sessions/adjust-initial", { currentAmount, newAmount, reason, passcode }, {
    skipAuthRedirectOn401: true,
  });
}

function parseBalance(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  try {
    const res = await axiosInstance.get<CurrentSession | { data?: CurrentSession; session?: CurrentSession }>(
      "/sessions/active"
    );
    let data = res.data;
    if (data && typeof data === "object" && "data" in data && (data as { data?: unknown }).data != null) {
      data = (data as { data: CurrentSession }).data;
    } else if (data && typeof data === "object" && "session" in data && (data as { session?: unknown }).session != null) {
      data = (data as { session: CurrentSession }).session;
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const session = data as CurrentSession;
    const hasValid =
      session.status === "open" ||
      session.startBalance != null ||
      session.startTime != null ||
      session.startedAt != null ||
      session.openedAt != null;
    if (!hasValid) return null;
    return session;
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 404 || status === 204) return null;
    throw e;
  }
}

export function parseActiveSessionForUI(session: CurrentSession): { initialAmount: number; startedAt: string } {
  const amount = parseBalance(session.startBalance);
  const startTime =
    session.startTime ?? session.startedAt ?? session.openedAt ?? session.createdAt;
  let startedAt = "—";
  if (startTime != null && startTime !== "") {
    try {
      const t = typeof startTime === "string" || typeof startTime === "number" ? startTime : startTime instanceof Date ? startTime : String(startTime);
      startedAt = new Date(t).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      startedAt = String(startTime);
    }
  }
  return { initialAmount: amount, startedAt };
}

export interface ActiveSessionDetail {
  initialAmount: number;
  startedAt: string;
  currentBalance: number;
  cashSalesAmount: number;
  cashSalesCount: number;
  cashOutsAmount: number;
  cashOutsCount: number;
}

/** Classify a session ledger row for cash KPIs (used for totals and cash-out history). */
function classifyDrawerTransaction(row: Record<string, unknown>): "sale" | "out" | null {
  const type = String(row.type ?? row.transactionType ?? row.action ?? row.kind ?? "")
    .toLowerCase()
    .replace(/-/g, "_");
  const desc = String(row.description ?? row.reason ?? row.source ?? "").toLowerCase();
  const amount = parseBalance(row.amount ?? row.value ?? row.total);
  if (amount <= 0) return null;
  // Opening / initial float — not a cash sale for drawer KPIs
  if (
    (type === "add" || type === "remove") &&
    (desc.includes("opening") ||
      desc.includes("initial") ||
      desc.includes("start balance") ||
      desc.includes("session start") ||
      desc.includes("drawer start"))
  ) {
    return null;
  }
  const saleTypes = new Set(["sale", "cash_sale", "cash_sales", "order", "payment", "cash"]);
  const outTypes = new Set(["cash_out", "cash_outs", "remove", "withdrawal", "withdraw"]);
  const pm = String(
    row.paymentMethod ?? row.paymentMethodType ?? row.payment_method ?? row.payMethod ?? ""
  ).toLowerCase();
  const isCashPayment =
    pm === "cash" ||
    pm === "cod" ||
    pm === "counter" ||
    pm === "in_person" ||
    String(row.paymentType ?? row.payment_type ?? "").toLowerCase() === "cash";
  const isSale =
    saleTypes.has(type) ||
    type.includes("sale") ||
    type.includes("order") ||
    (type === "payment" && isCashPayment) ||
    row.isCash === true ||
    row.is_cash === true ||
    (type === "add" && (desc.includes("sale") || desc.includes("order") || desc.includes("payment")));
  const isOut =
    outTypes.has(type) ||
    type.includes("cash_out") ||
    type.includes("remove") ||
    type.includes("withdraw") ||
    type === "payout";
  if (isOut) return "out";
  if (isSale) return "sale";
  return null;
}

function sumTransactionsToCashTotals(transactions: unknown): {
  cashSalesAmount: number;
  cashSalesCount: number;
  cashOutsAmount: number;
  cashOutsCount: number;
} {
  const out = { cashSalesAmount: 0, cashSalesCount: 0, cashOutsAmount: 0, cashOutsCount: 0 };
  if (!Array.isArray(transactions)) return out;
  for (const t of transactions) {
    if (!t || typeof t !== "object") continue;
    const row = t as Record<string, unknown>;
    const kind = classifyDrawerTransaction(row);
    const amount = parseBalance(row.amount ?? row.value ?? row.total);
    if (kind === "sale") {
      out.cashSalesAmount += amount;
      out.cashSalesCount += 1;
    } else if (kind === "out") {
      out.cashOutsAmount += amount;
      out.cashOutsCount += 1;
    }
  }
  return out;
}

function transactionSortTimeMs(row: Record<string, unknown>): number {
  const t =
    row.createdAt ??
    row.created_at ??
    row.timestamp ??
    row.time ??
    row.date ??
    row.updatedAt ??
    row.updated_at;
  if (t == null || t === "") return 0;
  const n = new Date(String(t)).getTime();
  return Number.isNaN(n) ? 0 : n;
}

function transactionActorName(row: Record<string, unknown>, fallback: string): string {
  const u = row.user ?? row.User ?? row.performedBy ?? row.cashier ?? row.cashierUser;
  if (u && typeof u === "object") {
    const o = u as Record<string, unknown>;
    return sessionUserDisplayName({
      name: o.name as string | undefined,
      employeeId: o.employeeId as string | undefined,
      id: o.id as number | undefined,
    });
  }
  const name = row.cashierName ?? row.userName ?? row.performedByName;
  if (name != null && String(name).trim()) return String(name).trim();
  return fallback;
}

export interface CashOutLedgerRow {
  dateTime: string;
  by: string;
  amount: number;
  sortKey: number;
}

/** Individual cash-out lines from GET /sessions/active `transactions` (closed sessions still come from all-history). */
export function extractCashOutLedgerFromSession(
  session: CurrentSession | null | undefined,
  fallbackCashierName: string
): CashOutLedgerRow[] {
  if (!session || typeof session !== "object") return [];
  const raw = session as Record<string, unknown>;
  const txList = raw.transactions ?? raw.Transactions;
  if (!Array.isArray(txList)) return [];
  const rows: CashOutLedgerRow[] = [];
  const seen = new Set<string>();
  for (const t of txList) {
    if (!t || typeof t !== "object") continue;
    const row = t as Record<string, unknown>;
    if (classifyDrawerTransaction(row) !== "out") continue;
    const amount = parseBalance(row.amount ?? row.value ?? row.total);
    if (amount <= 0) continue;
    const sortKey = transactionSortTimeMs(row);
    const when = sortKey ? new Date(sortKey) : new Date();
    const datePart = when.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timePart = when.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const by = transactionActorName(row, fallbackCashierName);
    const dedupeId = row.id ?? row.transactionId ?? row.uuid ?? row._id ?? row.ledgerEntryId;
    const desc = String(row.description ?? row.reason ?? "").slice(0, 120);
    const key =
      dedupeId != null && String(dedupeId).trim() !== ""
        ? `id:${String(dedupeId)}`
        : `f:${sortKey}:${amount}:${by}:${desc}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      dateTime: `${datePart} • ${timePart}`,
      by,
      amount,
      sortKey: sortKey || when.getTime(),
    });
  }
  rows.sort((a, b) => b.sortKey - a.sortKey);
  return rows;
}

export function parseActiveSessionDetail(session: CurrentSession | null): ActiveSessionDetail | null {
  if (!session || typeof session !== "object") return null;
  const raw = session as Record<string, unknown>;
  const base = parseActiveSessionForUI(session);
  const currentBalance = parseBalance(session.currentBalance ?? raw.current_balance);
  const cashSales = raw.cashSales ?? raw.cash_sales;
  let cashSalesAmount =
    typeof cashSales === "object" && cashSales != null && "amount" in cashSales
      ? parseBalance((cashSales as { amount?: unknown }).amount)
      : parseBalance(raw.cashSalesAmount ?? raw.cash_sales_amount ?? raw.totalCashSales);
  let cashSalesCount =
    typeof cashSales === "object" && cashSales != null && "count" in cashSales
      ? Number((cashSales as { count?: unknown }).count) || 0
      : Number(raw.cashSalesCount ?? raw.cash_sales_count ?? raw.cashSalesOrders) || 0;
  const cashOuts = raw.cashOuts ?? raw.cash_outs;
  let cashOutsAmount =
    typeof cashOuts === "object" && cashOuts != null && "amount" in cashOuts
      ? parseBalance((cashOuts as { amount?: unknown }).amount)
      : parseBalance(raw.cashOutsAmount ?? raw.cash_outs_amount ?? raw.totalCashOuts);
  let cashOutsCount =
    typeof cashOuts === "object" && cashOuts != null && "count" in cashOuts
      ? Number((cashOuts as { count?: unknown }).count) || 0
      : Number(raw.cashOutsCount ?? raw.cash_outs_count) || 0;
  const txList = raw.transactions ?? raw.Transactions;
  const fromTx =
    Array.isArray(txList) && txList.length > 0 ? sumTransactionsToCashTotals(txList) : null;
  if (fromTx) {
    if (cashSalesAmount === 0 && fromTx.cashSalesAmount > 0) {
      cashSalesAmount = fromTx.cashSalesAmount;
      cashSalesCount = fromTx.cashSalesCount;
    }
    if (cashOutsAmount === 0 && fromTx.cashOutsAmount > 0) {
      cashOutsAmount = fromTx.cashOutsAmount;
      cashOutsCount = fromTx.cashOutsCount;
    }
  }
  return {
    initialAmount: base.initialAmount,
    startedAt: base.startedAt,
    currentBalance,
    cashSalesAmount,
    cashSalesCount,
    cashOutsAmount,
    cashOutsCount,
  };
}

export async function getActiveSessionDetail(): Promise<ActiveSessionDetail | null> {
  const session = await getCurrentSession();
  return parseActiveSessionDetail(session);
}

export interface StartSessionPayload {
  startBalance: number;
  passcode?: string;
}

export async function startSession(payload: StartSessionPayload): Promise<void> {
  const hasPasscode = Boolean(payload.passcode != null && String(payload.passcode).trim() !== "");
  await axiosInstance.post("/sessions/start", payload, {
    skipAuthRedirectOn401: hasPasscode,
  });
}

export type SessionUserInfo = {
  id?: number;
  employeeId?: string;
  name?: string;
  role?: string;
};

export function sessionUserDisplayName(u: SessionUserInfo | null | undefined): string {
  if (!u) return "—";
  if (u.employeeId && String(u.employeeId).trim()) return String(u.employeeId).trim();
  if (u.name && String(u.name).trim()) return String(u.name).trim();
  if (u.role && String(u.role).trim()) return String(u.role).trim();
  if (u.id != null) return `User ${u.id}`;
  return "—";
}

export interface SessionHistoryItem {
  id?: number;
  userId?: number;
  startBalance?: number | string;
  currentBalance?: number | string;
  closingAmount?: number | string;
  startTime?: string;
  endTime?: string | null;
  closedAt?: string;
  actualBalance?: number | string;
  closedBy?: string | number;
  User?: SessionUserInfo;
  user?: SessionUserInfo;
  closedByUser?: SessionUserInfo;
  [key: string]: unknown;
}

export function mapHistoryItemToSummary(item: SessionHistoryItem): {
  closedAt: string;
  closedBy: string;
  closingAmount: number;
} {
  const raw = item as Record<string, unknown>;
  const closedByUser = (item.closedByUser ?? raw.ClosedByUser ?? raw.closed_by_user) as SessionUserInfo | undefined;
  const closedBy =
    sessionUserDisplayName(closedByUser) !== "—"
      ? sessionUserDisplayName(closedByUser)
      : item.closedBy != null
        ? `User ${item.closedBy}`
        : "—";
  const closedAt = String(item.closedAt ?? item.endTime ?? raw.end_time ?? "");
  const closingAmount = parseBalance(item.closingAmount ?? item.currentBalance ?? raw.current_balance);
  return { closedAt, closedBy, closingAmount };
}

function parseSessionHistoryResponse(
  raw: SessionHistoryItem[] | { data?: SessionHistoryItem[]; sessions?: SessionHistoryItem[] } | unknown
): SessionHistoryItem[] {
  let arr: SessionHistoryItem[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (raw && typeof raw === "object") {
    const data = (raw as { data?: SessionHistoryItem[] }).data ?? (raw as { sessions?: SessionHistoryItem[] }).sessions;
    arr = Array.isArray(data) ? data : [];
  }
  return arr.map((s) => {
    const any = s as Record<string, unknown>;
    const closedByUser = (s.closedByUser ?? any.ClosedByUser ?? any.closed_by_user) as SessionUserInfo | undefined;
    const closedByDisplay =
      sessionUserDisplayName(closedByUser) !== "—"
        ? sessionUserDisplayName(closedByUser)
        : s.closedBy != null
          ? `User ${s.closedBy}`
          : "—";
    return {
      ...s,
      closedAt: s.closedAt ?? s.endTime ?? (any.end_time as string) ?? "",
      closingAmount: s.closingAmount ?? s.currentBalance ?? (any.current_balance as number | string),
      closedBy: closedByDisplay,
      startTime: s.startTime ?? (any.start_time as string),
      startBalance: s.startBalance ?? (any.start_balance as number | string),
      currentBalance: s.currentBalance ?? (any.current_balance as number | string),
    } as SessionHistoryItem;
  });
}

export async function getSessionHistory(): Promise<SessionHistoryItem[]> {
  try {
    const res = await axiosInstance.get<SessionHistoryItem[] | { data?: SessionHistoryItem[]; sessions?: SessionHistoryItem[] }>("/sessions/history");
    return parseSessionHistoryResponse(res.data);
  } catch (err) {
    console.error("Failed to load session history", err);
    return [];
  }
}

export interface AllHistorySession {
  id: number;
  cashierId?: number;
  cashierName: string;
  date: string;
  startTime: string;
  endTime: string | null;
  initial: number;
  cashSales?: { amount: number; count: number };
  cashOuts?: { amount: number; count: number };
  expected: number;
  actual: number;
  difference: number;
  discrepancy?: "balanced" | "overage" | "shortage";
  closedBy: string;
}

export function normalizeAllHistorySession(raw: Record<string, unknown>): AllHistorySession {
  const cashSales = raw.cashSales as { amount?: number; count?: number } | undefined;
  const cashOuts = raw.cashOuts as { amount?: number; count?: number } | undefined;
  return {
    id: Number(raw.id),
    cashierId: raw.cashierId != null ? Number(raw.cashierId) : undefined,
    cashierName: String(raw.cashierName ?? "").trim() || "—",
    date: String(raw.date ?? ""),
    startTime: String(raw.startTime ?? ""),
    endTime: raw.endTime != null ? String(raw.endTime) : null,
    initial: Number(raw.initial) || 0,
    cashSales: {
      amount: Number(cashSales?.amount) || 0,
      count: Number(cashSales?.count) || 0,
    },
    cashOuts: {
      amount: Number(cashOuts?.amount) || 0,
      count: Number(cashOuts?.count) || 0,
    },
    expected: Number(raw.expected) || 0,
    actual: Number(raw.actual) || 0,
    difference: Number(raw.difference) || 0,
    discrepancy: raw.discrepancy as AllHistorySession["discrepancy"],
    closedBy: String(raw.closedBy ?? "").trim() || "—",
  };
}

export const ALL_HISTORY_CAP = 500;
const DEFAULT_ALL_HISTORY_CAP = ALL_HISTORY_CAP;

export async function getAllSessionHistory(params?: {
  cashierId?: number;
  discrepancy?: string;
  fromDate?: string;
  toDate?: string;
  cap?: number;
}): Promise<AllHistorySession[]> {
  try {
    const { cap = DEFAULT_ALL_HISTORY_CAP, ...queryParams } = params ?? {};
    const res = await axiosInstance.get<
      AllHistorySession[] | { data?: AllHistorySession[]; sessions?: AllHistorySession[] }
    >("/sessions/all-history", { params: queryParams });
    let arr: unknown[] = [];
    const raw = res.data;
    if (Array.isArray(raw)) arr = raw;
    else if (raw && typeof raw === "object") {
      const data = (raw as { data?: unknown[] }).data ?? (raw as { sessions?: unknown[] }).sessions;
      arr = Array.isArray(data) ? data : [];
    }
    const normalized = arr
      .filter((s): s is Record<string, unknown> => s != null && typeof s === "object")
      .map((s) => normalizeAllHistorySession(s));
    if (normalized.length <= cap) return normalized;
    return normalized.slice(0, cap);
  } catch (err) {
    console.error("Failed to load all session history", err);
    throw err;
  }
}

export const getTodaySummary = async (): Promise<any> => {
  const res = await axiosInstance.get("/sessions/today/summary");
  return res.data;
};

export const getTodaySessions = async (): Promise<any> => {
  const res = await axiosInstance.get("/sessions/today/sessions");
  return res.data;
};

