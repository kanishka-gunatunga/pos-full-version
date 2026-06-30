export type PaymentStatus = "paid" | "pending" | "refund" | "partial_refund" | string;

export interface Payment {
  id: number;
  orderNo: number;
  customerName: string;
  customerMobile: string;
  dateTime: string;
  method: string | null;
  paymentStatus: PaymentStatus;
  status?: PaymentStatus;
  linePaymentStatus?: string;
  line_payment_status?: string;
  amount: number;
  refundedAmount?: number;
  /** Server: `sale` | `balance_due` */
  paymentRole?: string;
  isAdditionalCharge?: boolean;
}

export interface PaymentUpdatePayload {
  status?: PaymentStatus;
  is_refund?: number;
  refund_type?: "partial" | "full";
  refund_amount?: number;
}

export interface IndividualPaymentPayload {
  paymentMethod: "cash" | "card" | "voucher" | "loyalty_points";
  amount: number;
  paidAmount?: number;
  paid_amount?: number;
  transactionId?: string;
  paymentRole?: "sale" | "balance_due";
  cardType?: string;
  cardLastFour?: string;
  pointsUsed?: number;
}

export interface CreatePaymentPayload {
  orderId: number;
  status?: PaymentStatus;
  points_used?: number;
  payments?: IndividualPaymentPayload[];
  paymentMethod?: "cash" | "card" | "voucher" | "loyalty_points";
  amount?: number;
  paidAmount?: number;
  paid_amount?: number;
  transactionId?: string;
  paymentRole?: "sale" | "balance_due";
}

export interface PaymentStats {
  totalCollectedAmount: number;
  pendingPaymentAmount: number;
  totalRefundAmount: number;
  refundRate: string;
}
