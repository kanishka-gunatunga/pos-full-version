import { useMemo } from "react";
import { CircleCheck, History, RotateCcw, X, Loader2 } from "lucide-react";
import { useGetAllPaymentDetails, useGetPaymentStats } from "@/hooks/usePayment";
import { formatCurrency } from "@/lib/format";
import { readLineSettlementStatus } from "@/domains/orders/paymentRowFields";

function sumPendingPaymentAmount(payments: { amount: number }[]): number {
  return payments.reduce((sum, p) => {
    if (readLineSettlementStatus(p as Record<string, unknown>) !== "pending") return sum;
    const n = Number(p.amount);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export default function PaymentStats() {
  const { data: statsData, isLoading, isError } = useGetPaymentStats();
  const { data: allPayments, isLoading: isPaymentsListLoading } = useGetAllPaymentDetails();

  const pendingPaymentAmount = useMemo(() => {
    if (!isPaymentsListLoading && Array.isArray(allPayments)) {
      return sumPendingPaymentAmount(allPayments);
    }
    return statsData?.pendingPaymentAmount ?? 0;
  }, [allPayments, isPaymentsListLoading, statsData?.pendingPaymentAmount]);

  const stats = [
    {
      label: "TOTAL COLLECTED",
      value: statsData ? formatCurrency(statsData.totalCollectedAmount) : "Rs.0.00",
      icon: CircleCheck,
      color: "text-[#00BC7D]",
    },
    {
      label: "PENDING PAYMENTS",
      value: formatCurrency(pendingPaymentAmount),
      icon: History,
      color: "text-[#FE9A00]",
    },
    {
      label: "TOTAL REFUNDS",
      value: statsData ? formatCurrency(statsData.totalRefundAmount) : "Rs.0.00",
      icon: RotateCcw,
      color: "text-[#62748E]",
    },
    {
      label: "REFUND RATE",
      value: statsData ? statsData.refundRate : "0.00%",
      icon: X,
      color: "text-[#FF2056]",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex h-[160px] animate-pulse items-center justify-center rounded-[32px] border border-[#E2E8F0] bg-white shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#90A1B9]" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[32px] border border-red-100 bg-red-50 p-8 text-center text-red-600 shadow-sm">
        Error loading payment statistics.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`flex flex-col gap-4 rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-sm transition-all hover:scale-[1.02]`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-wider text-[#90A1B9] uppercase">
              {stat.label}
            </p>
            <div className={`flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F8FAFC]`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
          <div>
            <p className="text-[24px] font-bold text-[#1D293D]">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
