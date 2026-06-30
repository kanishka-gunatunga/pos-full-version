import type { OrderStatus, PaymentStatus } from "./types";

export const STATUS_STYLES: Record<OrderStatus, { bg: string; border: string; text: string }> = {
  preparing: { bg: "#EFF6FF", border: "#BEDBFF", text: "#155DFC" },
  pending: { bg: "#FFF4E6", border: "#FFE0B3", text: "#E17100" },
  complete: { bg: "#E6F7F0", border: "#B3E6D1", text: "#009966" },
  hold: { bg: "#F1F5F9", border: "#CAD5E2", text: "#45556C" },
  ready: { bg: "#F3F0FF", border: "#D4C5FF", text: "#4F39F6" },
  cancel: { bg: "#FFE6EB", border: "#FFB3C1", text: "#EC003F" },
};

export const DEFAULT_STATUS_STYLE = { bg: "#F1F5F9", border: "#CAD5E2", text: "#45556C" };

export const PAYMENT_STATUS_STYLES: Record<
  PaymentStatus,
  { bg: string; border: string; text: string }
> = {
  pending: { bg: "#FFF4E6", border: "#FFE0B3", text: "#E17100" },
  paid: { bg: "#E6F7F0", border: "#B3E6D1", text: "#009966" },
  refund: { bg: "#FFE6EB", border: "#FFB3C1", text: "#EC003F" },
  partial_refund: { bg: "#FFE6EB", border: "#FFB3C1", text: "#EC003F" },
};

export const DEFAULT_PAYMENT_STATUS_STYLE = { bg: "#F1F5F9", border: "#CAD5E2", text: "#45556C" };

export function formatOrderStatusLabel(status: OrderStatus | string): string {
  const s = String(status).toLowerCase().replace(/\s+/g, "_");
  switch (s) {
    case "pending":
      return "Pending";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready";
    case "hold":
      return "Hold";
    case "complete":
      return "Complete";
    case "cancel":
      return "Cancelled";
    default:
      return String(status)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function formatPaymentStatusLabel(status: PaymentStatus | string): string {
  const s = String(status).toLowerCase().replace(/\s+/g, "_");
  switch (s) {
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "refund":
      return "Full refund";
    case "partial_refund":
      return "Partial refund";
    default:
      return String(status)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export const ORDER_STATUS_OPTIONS: (OrderStatus | "All")[] = [
  "All",
  "pending",
  "preparing",
  "ready",
  "complete",
  "hold",
  "cancel",
];

export const PAYMENT_STATUS_OPTIONS: (PaymentStatus | "All")[] = [
  "All",
  "pending",
  "paid",
  "partial_refund",
  "refund",
];
