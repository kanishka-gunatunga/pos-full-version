"use client";

import { useState } from "react";
import { CreditCard, Banknote, Globe, Loader2 } from "lucide-react";
import ProcessPaymentModal from "./ProcessPaymentModal";
import { Payment } from "@/types/payment";
import { readLineSettlementStatus } from "@/domains/orders/paymentRowFields";

function rowSettlementStatus(p: Payment): string {
  return readLineSettlementStatus(p as unknown as Record<string, unknown>);
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-[#ECFDF5] text-[#009966] border-[#A4F4CF]";
    case "pending":
      return "bg-[#FFFBEB] text-[#E17100] border-[#FEE685]";
    case "refund":
    case "partial_refund":
      return "bg-[#FFF1F2] text-[#EC003F] border-[#FFCCD3]";
    default:
      return "bg-zinc-50 text-zinc-500 border-zinc-200";
  }
};

interface PaymentHistoryTableProps {
  payments: Payment[];
  isLoading: boolean;
}

export default function PaymentHistoryTable({ payments, isLoading }: PaymentHistoryTableProps) {
  const [processingPayment, setProcessingPayment] = useState<Payment | null>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getMethodDisplay = (payment: Payment) => {
    const status = rowSettlementStatus(payment);
    const method = payment.method;

    if (status === "pending") {
      return (
        <button
          onClick={() => setProcessingPayment(payment)}
          className="flex h-7 items-center gap-2 rounded-[14px] bg-[#00BC7D] px-4 text-[14px] font-bold text-white transition-all hover:bg-[#00BC86] active:scale-95"
        >
          Pay
        </button>
      );
    }

    switch (method?.toLowerCase()) {
      case "card":
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#F1F5F9] bg-[#F8FAFC] text-[#2B7FFF]">
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="text-[14px] font-bold text-[#45556C]">Card</span>
          </div>
        );
      case "cash":
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#F1F5F9] bg-[#F8FAFC] text-[#00D094]">
              <Banknote className="h-4 w-4" />
            </div>
            <span className="text-[14px] font-bold text-[#45556C]">Cash</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-3 text-[#94A3B8]">
            <Globe className="h-4 w-4" />
            <span className="text-[14px] font-bold text-[#45556C]">{method || "Unknown"}</span>
          </div>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-[32px] border border-[#E2E8F0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#90A1B9]">
                RECEIPT NO
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#90A1B9]">
                ORDER NO
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#90A1B9]">
                CUSTOMER
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#90A1B9]">
                DATE & TIME
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#90A1B9]">
                METHOD
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#90A1B9]">
                AMOUNT
              </th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#90A1B9] text-right">
                STATUS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-[#90A1B9]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading transactions...</span>
                  </div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-[#90A1B9]">
                  No transactions found.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="group hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-5 text-[11px] font-normal text-[#62748E]">
                    #P{payment.id}
                  </td>
                  <td className="px-6 py-5 text-[16px] font-bold text-[#314158]">
                    #{payment.orderNo}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-[#314158]">{payment.customerName}</span>
                      <span className="text-[11px] font-normal text-[#90A1B9]">{payment.customerMobile}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-[#314158]">{formatDate(payment.dateTime)}</span>
                      <span className="text-[11px] font-normal text-[#90A1B9] uppercase">{formatTime(payment.dateTime)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {getMethodDisplay(payment)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1 text-[14px] font-bold">
                      {rowSettlementStatus(payment) === "refund" ? (
                        <span className="text-[#EC003F]">- Rs.{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      ) : (
                        <>
                          <span className={payment.refundedAmount && payment.refundedAmount > 0 ? "text-[#EC003F]" : "text-[#009966]"}>
                            +Rs.{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          {payment.refundedAmount && payment.refundedAmount > 0 && (
                            <span className="text-[#EC003F] ml-1"> - Rs.{payment.refundedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black tracking-wider uppercase ${getStatusColor(rowSettlementStatus(payment))}`}>
                      {rowSettlementStatus(payment).replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {processingPayment && (
        <ProcessPaymentModal
          payment={processingPayment}
          onClose={() => setProcessingPayment(null)}
        />
      )}
    </div>
  );
}
