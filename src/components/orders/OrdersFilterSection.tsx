import { Filter } from "lucide-react";
import type { OrderStatus, PaymentStatus } from "@/domains/orders/types";
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/domains/orders/constants";

function formatOption(opt: string) {
  if (opt === "All") return "All";
  if (opt === "refund") return "Full Refund";

  return opt
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

type Props = {
  orderStatusFilter: OrderStatus | "All";
  paymentStatusFilter: PaymentStatus | "All";
  onOrderStatusChange: (value: OrderStatus | "All") => void;
  onPaymentStatusChange: (value: PaymentStatus | "All") => void;
};

export default function OrdersFilterSection({
  orderStatusFilter,
  paymentStatusFilter,
  onOrderStatusChange,
  onPaymentStatusChange,
}: Props) {
  return (
    <div className="mt-5 rounded-[24px] border border-[#E2E8F0] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-5">
      <div className="flex gap-5">
        <div className="">
          <div className="mb-3 flex items-center gap-2 font-['Inter'] text-sm font-bold leading-5 text-[#314158]">
            <Filter className="h-4 w-4 shrink-0 text-[#90A1B9]" />
            Order Status
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onOrderStatusChange(opt)}
                className={`rounded-[14px] px-4 py-2 text-center font-['Inter'] text-sm font-bold leading-5 transition-colors ${
                  orderStatusFilter === opt
                    ? "bg-[#EA580C] text-white shadow-[0px_4px_6px_-4px_#EA580C4D,0px_10px_15px_-3px_#EA580C4D]"
                    : "bg-[#F1F5F9] text-[#45556C] hover:bg-[#E2E8F0]"
                }`}
              >
                {formatOption(opt)}
              </button>
            ))}
          </div>
        </div>
        {orderStatusFilter !== "cancel" && (
          <div className="">
            <div className="mb-3 flex items-center gap-2 font-['Inter'] text-sm font-bold leading-5 text-[#314158]">
              <Filter className="h-4 w-4 shrink-0 text-[#90A1B9]" />
              Payment Status
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onPaymentStatusChange(opt)}
                  className={`rounded-[14px] px-4 py-2 text-center font-['Inter'] text-sm font-bold leading-5 transition-colors ${
                    paymentStatusFilter === opt
                      ? "bg-[#00BC7D] text-white shadow-[0px_4px_6px_-4px_#00BC7D4D,0px_10px_15px_-3px_#00BC7D4D]"
                      : "bg-[#F1F5F9] text-[#45556C] hover:bg-[#E2E8F0]"
                  }`}
                >
                  {formatOption(opt)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
