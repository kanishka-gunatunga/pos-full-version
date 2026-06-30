import type { Order } from "@/types/order";
import { readLineSettlementStatus } from "./paymentRowFields";
import { sumNetCollectedTowardOrder } from "./orderRefundSummary";

export const ORDER_MONEY_EPS = 0.02;

const COLLECT_EPS = ORDER_MONEY_EPS;

export function roundMoney2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type CreatePaymentDraft = {
  amount: number;
  paymentRole?: "balance_due";
};

function pendingBalanceDueFromOrderPayments(order: Partial<Order>): number {
  const rows = order.payments;
  if (!rows?.length) return 0;
  let sum = 0;
  for (const p of rows) {
    const r = p as unknown as Record<string, unknown>;
    const role = String(p.paymentRole ?? r.payment_role ?? "").toLowerCase();
    const st = readLineSettlementStatus(r);
    if (role === "balance_due" && st === "pending") {
      sum += Number(p.amount ?? r.amount ?? 0);
    }
  }
  return sum;
}

function pendingSaleLikeSettlementAmount(order: Partial<Order>): number {
  const rows = order.payments;
  if (!rows?.length) return 0;
  let sum = 0;
  for (const p of rows) {
    const r = p as unknown as Record<string, unknown>;
    const role = String(p.paymentRole ?? r.payment_role ?? "sale").toLowerCase();
    if (role === "balance_due") continue;
    const st = readLineSettlementStatus(r);
    if (st === "pending") {
      sum += Number(p.amount ?? r.amount ?? 0);
    }
  }
  return sum;
}

export function buildCreatePaymentDraftFromOrder(order: Partial<Order>): CreatePaymentDraft {
  const ta = Number(order.totalAmount);
  const o = order as Partial<Order> & Record<string, unknown>;
  const apiBd = Number(o.balanceDue ?? o.balance_due);

  const pendingBdLines = pendingBalanceDueFromOrderPayments(order);
  if (pendingBdLines > COLLECT_EPS) {
    return { amount: roundMoney2(pendingBdLines), paymentRole: "balance_due" };
  }
  if (Number.isFinite(apiBd) && apiBd > COLLECT_EPS) {
    return { amount: roundMoney2(apiBd), paymentRole: "balance_due" };
  }

  const pendingSaleLike = pendingSaleLikeSettlementAmount(order);
  if (pendingSaleLike > COLLECT_EPS) {
    return { amount: roundMoney2(pendingSaleLike) };
  }

  const net = sumNetCollectedTowardOrder(order.payments);
  const totalOk = Number.isFinite(ta) && ta > COLLECT_EPS;
  if (totalOk && net >= ta - COLLECT_EPS) {
    return { amount: 0 };
  }

  return {
    amount: totalOk ? roundMoney2(ta) : 0,
  };
}

export function resolvePaymentSettlementAmount(
  order: Partial<{ totalAmount: unknown; balanceDue: unknown | null }> &
    Record<string, unknown>
): number {
  return buildCreatePaymentDraftFromOrder(order as Partial<Order>).amount;
}

export function collectibleOrderAmount(order: {
  totalAmount: number;
  balanceDue?: number | null;
}): number {
  const raw = order.balanceDue;
  if (raw != null && Number.isFinite(Number(raw))) {
    const n = Number(raw);
    if (n > COLLECT_EPS) return n;
    return 0;
  }
  return Number(order.totalAmount) || 0;
}

type OrderLikeForPayGate = {
  totalAmount: number;
  balanceDue?: number | null;
  requiresAdditionalPayment?: boolean | null;
  requires_additional_payment?: boolean | null;
};

export function orderNeedsPaymentCollection(order: OrderLikeForPayGate): boolean {
  const snake = order.requires_additional_payment;
  const camel = order.requiresAdditionalPayment;
  if (camel === true || snake === true) return true;
  if (camel === false || snake === false) {
    return collectibleOrderAmount(order) > COLLECT_EPS;
  }
  return collectibleOrderAmount(order) > COLLECT_EPS;
}
