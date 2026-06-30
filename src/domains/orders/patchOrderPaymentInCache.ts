import type { QueryClient } from "@tanstack/react-query";
import type { Order, OrdersPageResponse } from "@/types/order";
import { ORDER_KEYS } from "@/hooks/useOrder";
import { reconcileBalanceDueWithPaymentRows } from "@/domains/orders/orderRefundSummary";

function unwrapPaymentApiRoot(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  if (r.data != null && typeof r.data === "object" && !Array.isArray(r.data)) {
    return r.data as Record<string, unknown>;
  }
  return r;
}

/**
 * Reads order snapshot from `PUT /payments/:id/status` or `POST /payments` success bodies.
 * Supports nested `order`, `{ data: ... }`, and backend field names (`totalRefundedOnOrder`, etc.).
 */
function readRequiresAdditionalFlag(
  root: Record<string, unknown>,
  orderObj?: Record<string, unknown>
): boolean | undefined {
  const v =
    root.requiresAdditionalPayment ??
    root.requires_additional_payment ??
    orderObj?.requiresAdditionalPayment ??
    orderObj?.requires_additional_payment;
  if (v === true || v === 1 || String(v).toLowerCase() === "true") return true;
  if (v === false || v === 0 || String(v).toLowerCase() === "false") return false;
  return undefined;
}

export function readOrderPaymentFieldsFromRefundResponse(raw: unknown): {
  orderPaymentStatus?: string;
  balanceDue?: number;
  totalRefunded?: number;
  orderId?: string | number;
  requiresAdditionalPayment?: boolean;
} {
  const o = unwrapPaymentApiRoot(raw);
  const orderObj =
    o.order != null && typeof o.order === "object" && !Array.isArray(o.order)
      ? (o.order as Record<string, unknown>)
      : undefined;

  const st =
    o.paymentStatus ??
    o.payment_status ??
    o.orderPaymentStatus ??
    o.order_payment_status ??
    orderObj?.paymentStatus ??
    orderObj?.payment_status;
  const bd =
    o.balanceDue ?? o.balance_due ?? orderObj?.balanceDue ?? orderObj?.balance_due;
  const requiresAdditionalPayment = readRequiresAdditionalFlag(o, orderObj);
  const oid = o.orderId ?? o.order_id ?? orderObj?.id;
  const tr =
    o.totalRefunded ??
    o.total_refunded ??
    o.totalRefundedOnOrder ??
    o.total_refunded_on_order ??
    o.refundedAmount ??
    o.refunded_amount ??
    orderObj?.totalRefunded ??
    orderObj?.total_refunded;

  const n = bd == null || bd === "" ? NaN : Number(bd);
  const trn = tr == null || tr === "" ? NaN : Number(tr);

  const statusStr =
    st != null && String(st).trim() !== ""
      ? String(st).trim().toLowerCase().replace(/\s+/g, "_")
      : undefined;

  return {
    orderPaymentStatus: statusStr,
    balanceDue: Number.isFinite(n) ? n : undefined,
    totalRefunded: Number.isFinite(trn) ? trn : undefined,
    orderId:
      oid != null && oid !== ""
        ? typeof oid === "number" || typeof oid === "string"
          ? oid
          : undefined
        : undefined,
    ...(requiresAdditionalPayment !== undefined ? { requiresAdditionalPayment } : {}),
  };
}

export function readOrderSnapshotFromPaymentResponse(raw: unknown): Partial<Order> | undefined {
  const o = unwrapPaymentApiRoot(raw);
  const ord = o.order;
  if (ord == null || typeof ord !== "object" || Array.isArray(ord)) return undefined;
  return ord as Partial<Order>;
}

export function patchOrderPaymentInQueryCache(
  queryClient: QueryClient,
  orderId: string | number,
  orderPaymentStatus: string,
  balanceDue?: number,
  totalRefunded?: number,
  requiresAdditionalPayment?: boolean,
  orderSnapshot?: Partial<Order>
) {
  const idStr = String(orderId);
  const normalizedApiStatus = String(orderPaymentStatus)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  const patchOrder = (o: Order): Order => {
    const base: Order =
      orderSnapshot && typeof orderSnapshot === "object"
        ? { ...o, ...orderSnapshot, id: o.id }
        : { ...o };

    const mergedRefunded =
      totalRefunded !== undefined && Number.isFinite(Number(totalRefunded))
        ? Number(totalRefunded)
        : Number(base.totalRefunded ?? 0);
    const mergedBalance =
      balanceDue !== undefined && Number.isFinite(Number(balanceDue))
        ? Number(balanceDue)
        : base.balanceDue;
    const mergedRequires =
      requiresAdditionalPayment !== undefined
        ? requiresAdditionalPayment
        : base.requiresAdditionalPayment;
    const orderTotal = Number(base.totalAmount ?? 0);
    const reconciled = reconcileBalanceDueWithPaymentRows(
      base,
      orderTotal,
      mergedBalance,
      mergedRequires
    );
    return {
      ...base,
      paymentStatus: normalizedApiStatus,
      balanceDue: reconciled.balanceDue,
      ...(reconciled.requiresAdditionalPayment !== undefined
        ? { requiresAdditionalPayment: reconciled.requiresAdditionalPayment }
        : {}),
      ...(totalRefunded !== undefined ? { totalRefunded: mergedRefunded } : {}),
    };
  };

  queryClient.setQueriesData<OrdersPageResponse | Order[]>({ queryKey: ORDER_KEYS.lists() }, (old) => {
    if (old == null) return old;
    if (Array.isArray(old)) {
      return old.map((o) => (String(o.id) === idStr ? patchOrder(o) : o));
    }
    return {
      ...old,
      data: old.data.map((o) => (String(o.id) === idStr ? patchOrder(o) : o)),
    };
  });

  queryClient.setQueryData<Order>(ORDER_KEYS.detail(orderId), (old) => {
    if (!old || String(old.id) !== idStr) return old;
    return patchOrder(old);
  });
}
