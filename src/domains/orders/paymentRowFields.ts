
export function readLineSettlementStatus(r: Record<string, unknown>): string {
  return String(
    r.status ??
      r.linePaymentStatus ??
      r.line_payment_status ??
      r.paymentStatus ??
      r.payment_status ??
      ""
  ).toLowerCase();
}
