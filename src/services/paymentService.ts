import axiosInstance from "@/lib/api/axiosInstance";
import { roundMoney2 } from "@/domains/orders/orderCollectionAmount";
import type { Order } from "@/types/order";
import { CreatePaymentPayload, Payment, PaymentStats, PaymentUpdatePayload } from "@/types/payment";
import { getOrderById } from "@/services/orderService";

function numField(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

/** Map API stats payload (camelCase or snake_case, optional `data` wrapper) to PaymentStats. */
export function normalizePaymentStats(raw: unknown): PaymentStats {
  const root =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const data =
    root.data != null && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  const refundRaw = data.refundRate ?? data.refund_rate;
  const refundRate =
    typeof refundRaw === "number" && !Number.isNaN(refundRaw)
      ? `${refundRaw.toFixed(2)}%`
      : String(refundRaw ?? "0.00%");
  return {
    totalCollectedAmount: numField(data.totalCollectedAmount ?? data.total_collected_amount),
    pendingPaymentAmount: numField(
      data.pendingPaymentAmount ??
      data.pending_payment_amount ??
      data.pendingAmount ??
      data.pending_amount
    ),
    totalRefundAmount: numField(data.totalRefundAmount ?? data.total_refund_amount),
    refundRate,
  };
}

export const createPayment = async (payload: CreatePaymentPayload): Promise<any> => {
  console.log("Creating payment with payload:", payload);
  const res = await axiosInstance.post("/payments", {
    ...payload,
    amount: roundMoney2(Number(payload.amount)),
  });
  return res.data;
};

export const updatePaymentStatus = async (
  id: number,
  payload: PaymentUpdatePayload
): Promise<any> => {
  const res = await axiosInstance.put(`/payments/${id}/status`, payload);
  return res.data;
};

/**
 * `GET /payments/order/:id`
 */
export function normalizePaymentsByOrderApiResponse(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (Array.isArray(o.payments)) return o.payments;
    const wrapped = o.data;
    if (wrapped != null && typeof wrapped === "object") {
      if (Array.isArray(wrapped)) return wrapped;
      const inner = wrapped as Record<string, unknown>;
      if (Array.isArray(inner.payments)) return inner.payments;
    }
  }
  return [];
}

export const getPaymentsByOrder = async (orderId: number): Promise<any[]> => {
  const res = await axiosInstance.get(`/payments/order/${orderId}`);
  return normalizePaymentsByOrderApiResponse(res.data);
};

export async function fetchOrderStateForPaymentCreate(id: string | number): Promise<Order> {
  const order = await getOrderById(id);
  if (order.payments != null && order.payments.length > 0) {
    return order;
  }
  const rows = await getPaymentsByOrder(Number(id));
  if (!rows.length) return order;
  return { ...order, payments: rows as Order["payments"] };
}

export const searchPaymentDetails = async (query: string): Promise<Payment[]> => {
  const res = await axiosInstance.get("/payments/search", { params: { query } });
  return res.data;
};

export const filterPaymentsByStatus = async (status: string): Promise<Payment[]> => {
  const res = await axiosInstance.get("/payments/filter", { params: { status } });
  return res.data;
};

export const getAllPaymentDetails = async (): Promise<Payment[]> => {
  const res = await axiosInstance.get("/payments/all-details");
  return res.data;
};

export const getPaymentStats = async (): Promise<PaymentStats> => {
  const res = await axiosInstance.get("/payments/stats");
  return normalizePaymentStats(res.data);
};
