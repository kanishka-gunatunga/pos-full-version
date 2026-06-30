import type { Order as ApiOrder } from "@/types/order";
import type { Payment } from "@/types/payment";
import { readLineSettlementStatus } from "./paymentRowFields";

const EPS = 0.02;

type PaymentRowLike = Payment & {
  payment_status?: string;
  payment_role?: string;
  refunded_amount?: number;
  status?: string;
  linePaymentStatus?: string;
  line_payment_status?: string;
};

function readPaymentRowStatus(r: PaymentRowLike): string {
  return readLineSettlementStatus(r as unknown as Record<string, unknown>);
}

function isSaleLikePaymentRow(p: Payment): boolean {
  const r = p as PaymentRowLike;
  const st = readPaymentRowStatus(r);
  if (st !== "paid" && st !== "partial_refund") return false;
  const role = String(r.paymentRole ?? r.payment_role ?? "sale").toLowerCase();
  if (role === "balance_due") return false;
  return true;
}

/** Gross amounts collected on sale-like rows (excludes `balance_due`). */
export function sumSalePaymentsGross(payments: Payment[] | undefined): number {
  if (!payments?.length) return 0;
  return payments.filter(isSaleLikePaymentRow).reduce((s, p) => s + Number(p.amount ?? 0), 0);
}

function netCollectedOnPaymentRow(r: PaymentRowLike): number {
  const gross = Number(r.amount ?? 0);
  const ref = Number(r.refundedAmount ?? r.refunded_amount ?? 0);
  return Math.max(0, gross - ref);
}

/**
 * Net amount counted toward the order: paid/partial_refund sale rows (after refunds on that row)
 * plus paid/partial_refund `balance_due` rows. Excludes pending `balance_due` (still owed).
 */
export function sumNetCollectedTowardOrder(payments: Payment[] | undefined): number {
  if (!payments?.length) return 0;
  let sum = 0;
  for (const p of payments) {
    const r = p as PaymentRowLike;
    const role = String(r.paymentRole ?? r.payment_role ?? "sale").toLowerCase();
    const st = readPaymentRowStatus(r);
    if (role === "balance_due") {
      if (st === "paid" || st === "partial_refund") {
        sum += netCollectedOnPaymentRow(r);
      }
      continue;
    }
    if (st === "paid" || st === "partial_refund") {
      sum += netCollectedOnPaymentRow(r);
    }
  }
  return sum;
}

/** Sum of amounts on pending `balance_due` payment rows (explicit “still to collect”). */
export function sumPendingBalanceDueAmount(payments: Payment[] | undefined): number {
  if (!payments?.length) return 0;
  let sum = 0;
  for (const p of payments) {
    const r = p as PaymentRowLike;
    const role = String(r.paymentRole ?? r.payment_role ?? "").toLowerCase();
    const st = readPaymentRowStatus(r);
    if (role === "balance_due" && st === "pending") {
      sum += Number(r.amount ?? 0);
    }
  }
  return sum;
}

/**
 * When `payments[]` is present, reconcile order-level `balanceDue` / `requiresAdditionalPayment`
 * with rows so we do not show “Balance due Rs.X” next to “Refunded” when net collected already covers the order
 * (stale `balance_due` / derived field lag after refunds).
 */
export function reconcileBalanceDueWithPaymentRows(
  apiOrder: ApiOrder,
  orderTotal: number,
  apiBalanceDue: number | undefined,
  apiRequiresAdditionalPayment: boolean | undefined
): { balanceDue?: number; requiresAdditionalPayment?: boolean } {
  const pay = apiOrder.payments;
  if (!pay?.length) {
    return {
      balanceDue: apiBalanceDue,
      requiresAdditionalPayment: apiRequiresAdditionalPayment,
    };
  }

  const apiTotalRaw = Number(apiOrder.totalAmount);
  const totalForShortfall =
    Number.isFinite(apiTotalRaw) && apiTotalRaw > EPS ? apiTotalRaw : orderTotal;

  const netCollected = sumNetCollectedTowardOrder(pay);
  const pendingLines = sumPendingBalanceDueAmount(pay);
  const shortfall = Math.max(0, totalForShortfall - netCollected);
  const owedFromRows = Math.max(pendingLines, shortfall);
  const apiBal = apiBalanceDue ?? 0;

  // Stale order-level balance: API says money is owed but row math shows the order is covered.
  if (apiBal > EPS && owedFromRows <= EPS) {
    return { balanceDue: 0, requiresAdditionalPayment: false };
  }

  // List (and some detail) payloads often omit reliable per-row `payment_status`. If the API
  // already reports settled and there is no pending `balance_due` line, do not infer "owed"
  // from shortfall — that would flip paid orders to pending whenever net collected is undercounted.
  const apiReportsSettled =
    apiBal <= EPS &&
    apiRequiresAdditionalPayment !== true &&
    pendingLines <= EPS;

  if (apiReportsSettled) {
    return { balanceDue: 0, requiresAdditionalPayment: false };
  }

  if (owedFromRows > EPS) {
    return { balanceDue: owedFromRows, requiresAdditionalPayment: true };
  }

  // API still shows balance due but row math is inconclusive — keep server numbers.
  if (apiBal > EPS) {
    return {
      balanceDue: apiBalanceDue,
      requiresAdditionalPayment: apiRequiresAdditionalPayment ?? true,
    };
  }

  return { balanceDue: 0, requiresAdditionalPayment: false };
}

/** Sum of `refundedAmount` across all payment rows. */
export function sumRecordedRefundsFromPayments(payments: Payment[] | undefined): number {
  if (!payments?.length) return 0;
  return payments.reduce((s, p) => {
    const r = p as PaymentRowLike;
    const amt = Number(r.refundedAmount ?? r.refunded_amount ?? 0);
    return s + (Number.isFinite(amt) ? amt : 0);
  }, 0);
}

export function readOrderLevelTotalRefunded(raw: Record<string, unknown>): number | undefined {
  const v =
    raw.totalRefunded ??
    raw.total_refunded ??
    raw.refundedAmount ??
    raw.refunded_amount ??
    raw.refunded_total ??
    raw.refundTotalAmount ??
    raw.refund_total_amount;
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export type OrderRefundSummary = {
  totalRefunded: number;
  totalPaidForOrder: number;
  outstandingRefund: number;
};

export function buildOrderRefundSummary(
  apiOrder: ApiOrder,
  raw: Record<string, unknown>,
  currentOrderTotal: number
): OrderRefundSummary {
  const fromOrderField = readOrderLevelTotalRefunded(raw);
  const fromPayments = sumRecordedRefundsFromPayments(apiOrder.payments);
  const totalRefunded = Math.max(fromOrderField ?? 0, fromPayments);

  const totalPaidForOrder = sumSalePaymentsGross(apiOrder.payments);

  const outstandingRefund =
    totalPaidForOrder > EPS
      ? Math.max(0, totalPaidForOrder - currentOrderTotal - totalRefunded)
      : 0;

  return { totalRefunded, totalPaidForOrder, outstandingRefund };
}
