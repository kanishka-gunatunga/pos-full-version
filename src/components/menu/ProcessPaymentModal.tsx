"use client";

import { useMemo, useState } from "react";
import { X, CreditCard, Gift, Star, Trash2, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { fetchOrderStateForPaymentCreate } from "@/services/paymentService";
import {
  buildCreatePaymentDraftFromOrder,
  ORDER_MONEY_EPS,
} from "@/domains/orders/orderCollectionAmount";
import { useGetLoyaltyPoints } from "@/hooks/useCustomer";
import { createPayment } from "@/services/paymentService";
import { CreatePaymentPayload, IndividualPaymentPayload } from "@/types/payment";

const formatRs = (n: number) =>
  `Rs.${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type PaymentMethod = "cash" | "card" | "voucher" | "loyalty";

type CardPaymentRow = {
  id: string;
  cardType: string;
  last4: string;
  amount: number;
};

type VoucherRedemptionRow = {
  id: string;
  code: string;
  amount: number;
};

type ProcessPaymentModalProps = {
  customerName: string;
  customerMobile?: string;
  amountDue: number;
  orderId?: number;
  customerId?: number | string;
  loyaltyPoints?: number;
  onClose: () => void;
  onComplete: () => void;
};

const CashMethodIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2V22"
      stroke="#009966"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
      stroke="#009966"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PromoMethodIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 9H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M4 15H20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 3L8 21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 3L14 21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ScanMethodIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 7V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 17V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ProcessPaymentModal({
  customerName,
  customerMobile,
  amountDue,
  orderId,
  customerId,
  loyaltyPoints: propLoyaltyPoints,
  onClose,
  onComplete,
}: ProcessPaymentModalProps) {

  const [activeMethod, setActiveMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [cards, setCards] = useState<CardPaymentRow[]>([]);
  const [cardType, setCardType] = useState("visa");
  const [cardLast4, setCardLast4] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [voucherMode, setVoucherMode] = useState<"promo" | "scan">("promo");
  const [voucherCode, setVoucherCode] = useState("");
  const [vouchers, setVouchers] = useState<VoucherRedemptionRow[]>([]);
  const [pointsToUse, setPointsToUse] = useState("");
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const cashApplied = Number.parseFloat(cashAmount || "0") || 0;
  const cardApplied = cards.reduce((sum, c) => sum + c.amount, 0);
  const voucherApplied = vouchers.reduce((sum, v) => sum + v.amount, 0);
  const hasCustomerForPoints = customerId != null;
  const availablePoints = propLoyaltyPoints || 0;
  const pointsRate = 1;
  const pointsNumRaw = Number.parseInt(pointsToUse || "0", 10) || 0;
  // pointsNum is what's in the input, but appliedPoints is what's confirmed
  const pointsApplied = appliedPoints * pointsRate;
  const totalPaid = cashApplied + cardApplied + voucherApplied + pointsApplied;
  const remaining = amountDue - totalPaid;
  const canConfirm = remaining <= ORDER_MONEY_EPS;
  const fullyPaid = remaining <= ORDER_MONEY_EPS;
  const cardCountText = `${cards.length}/5 cards`;

  const handleApplyPoints = () => {
    const num = Number.parseInt(pointsToUse || "0", 10) || 0;
    if (num <= 0) return toast.error("Enter a valid points amount.");
    if (num > availablePoints) return toast.error("Not enough points.");
    
    const value = num * pointsRate;
    if (value > remaining + pointsApplied + ORDER_MONEY_EPS) {
      toast.error("Points value exceeds remaining balance.");
      return;
    }

    setAppliedPoints(num);
    toast.success(`${num} points applied (Rs.${value.toFixed(2)})`);
  };

  const voucherCodeMap = useMemo(
    () => ({
      "GV25-ABCD-1234": 5000,
      "BX25-ABCD-1234": 8000,
      GV25: 5000,
      BX25: 8000,
    }),
    []
  );

  const getCloseAction = () => {
    if (isSubmitting) return;
    onClose();
  };

  const resetCardInputs = () => {
    setCardType("visa");
    setCardLast4("");
    setCardAmount("");
  };

  const handleAddCard = () => {
    if (cards.length >= 5) {
      toast.error("Maximum 5 cards allowed for split card payment.");
      return;
    }
    const amount = Number.parseFloat(cardAmount || "0") || 0;
    const digits = cardLast4.replace(/\D/g, "");
    if (!cardType.trim()) return toast.error("Select card type.");
    if (digits.length !== 4) return toast.error("Enter the last 4 digits.");
    if (amount <= 0) return toast.error("Enter a valid card amount.");
    const row: CardPaymentRow = {
      id: crypto.randomUUID(),
      cardType,
      last4: digits,
      amount,
    };
    setCards((prev) => [...prev, row]);
    resetCardInputs();
  };

  const handleRedeemVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return toast.error("Enter voucher/promo code.");
    if (vouchers.some((v) => v.code === code)) return toast.error("Voucher already applied.");
    const amount = voucherCodeMap[code as keyof typeof voucherCodeMap] ?? 0;
    if (amount <= 0) return toast.error("Invalid voucher code.");
    setVouchers((prev) => [...prev, { id: crypto.randomUUID(), code, amount }]);
    setVoucherCode("");
  };

  const handleConfirmPayment = async () => {
    if (!canConfirm || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!orderId) {
        toast.error("Order ID is missing.");
        return;
      }

      const fresh = await fetchOrderStateForPaymentCreate(orderId);
      const draft = buildCreatePaymentDraftFromOrder(fresh);
      if (draft.amount <= ORDER_MONEY_EPS) {
        toast.message(
          "This order is already fully paid on the server. Clearing checkout so you can start a new order."
        );
        onComplete();
        onClose();
        return;
      }

      const payments: IndividualPaymentPayload[] = [];
      if (cashApplied > 0) {
        payments.push({
          paymentMethod: "cash",
          amount: cashApplied,
          paidAmount: cashApplied,
        });
      }
      cards.forEach((c) => {
        payments.push({
          paymentMethod: "card",
          amount: c.amount,
          paidAmount: c.amount,
          cardType: c.cardType,
          cardLastFour: c.last4,
        });
      });
      vouchers.forEach((v) => {
        payments.push({
          paymentMethod: "voucher",
          amount: v.amount,
          transactionId: v.code,
        });
      });
      if (appliedPoints > 0) {
        payments.push({
          paymentMethod: "loyalty_points",
          amount: appliedPoints * pointsRate,
          pointsUsed: appliedPoints,
        });
      }

      const payload: CreatePaymentPayload = {
        orderId,
        status: "paid",
        payments,
      };

      await createPayment(payload);
      
      setIsSuccess(true);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1400);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process payment";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const header = (
    <div className=" pb-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-['Inter'] text-2xl font-bold leading-8 text-[#1D293D]">
            Split Payment
          </h2>
          <p className="mt-1 font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
            {customerMobile ? `${customerName} • ${customerMobile}` : customerName}
          </p>
        </div>
        <button
          type="button"
          onClick={getCloseAction}
          disabled={isSubmitting}
          className="rounded-full p-1.5 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C] disabled:pointer-events-none disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const requestBackdropClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={requestBackdropClose}
    >
      <div
        className="flex h-[calc(100dvh-2rem)] w-full max-w-[1100px] flex-col overflow-hidden rounded-[24px] border border-[#FFFFFF33] bg-white p-6 shadow-[0px_25px_50px_-12px_#00000040]"
        onClick={(e) => e.stopPropagation()}
      >
        {header}
        <div className="grid grid-cols-4 gap-3 pb-3">
          <div className="flex flex-col gap-1 rounded-[14px] bg-[#F8FAFC] p-4">
            <p className="text-xs font-normal leading-4 tracking-normal text-[#62748E]">
              Order Total
            </p>
            <p className="text-2xl font-bold leading-8 tracking-normal text-[#1D293D]">
              {formatRs(amountDue)}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-[14px] bg-[#ECFDF5] p-4">
            <p className="text-xs font-normal leading-4 tracking-normal text-[#009966]">
              Total Paid
            </p>
            <p className="text-2xl font-bold leading-8 tracking-normal text-[#007A55]">
              {formatRs(totalPaid)}
            </p>
          </div>
          <div
            className={`flex flex-col gap-1 rounded-[14px] p-4 ${fullyPaid ? "bg-[#ECFDF5]" : "bg-[#FFF7ED]"}`}
          >
            <p
              className={`text-xs font-normal leading-4 tracking-normal ${fullyPaid ? "text-[#10B981]" : "text-[#F54900]"}`}
            >
              Remaining
            </p>
            <p
              className={`text-2xl font-bold leading-8 tracking-normal ${fullyPaid ? "text-[#047857]" : "text-[#CA3500]"}`}
            >
              {formatRs(Math.max(remaining, 0))}
            </p>
          </div>
          <div className="flex items-center justify-center gap-1 rounded-[14px] bg-[#F8FAFC] p-4">
            <p className={`text-xl font-bold ${fullyPaid ? "text-[#009966]" : "text-[#90A1B9]"}`}>
              {fullyPaid ? (
                <span className="inline-flex items-center gap-1 text-base font-bold leading-6 tracking-normal">
                  <Check className="h-5 w-5" /> Fully Paid
                </span>
              ) : (
                <span className="text-xs font-normal leading-4 tracking-normal">
                  Payment Pending
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="-mx-6 border-b border-[#E2E8F0]" />

        <div className="mt-4 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#CBD5E1_#F1F5F9] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#F1F5F9] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#CBD5E1] hover:[&::-webkit-scrollbar-thumb]:bg-[#94A3B8]">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4 border-r border-[#E2E8F0] pr-4">
              <p className="text-sm font-bold uppercase leading-5 tracking-normal text-[#314158]">
                Payment Methods
              </p>
              <div className="mt-3 space-y-2">
                {[
                  { id: "cash", label: "Cash", icon: CashMethodIcon, sub: formatRs(cashApplied) },
                  {
                    id: "card",
                    label: "Card",
                    icon: CreditCard,
                    sub: `${cardCountText} • ${formatRs(cardApplied)}`,
                  },
                  {
                    id: "voucher",
                    label: "Voucher",
                    icon: Gift,
                    sub: `${vouchers.length} vouchers • ${formatRs(voucherApplied)}`,
                  },
                  {
                    id: "loyalty",
                    label: "Loyalty Points",
                    icon: Star,
                    sub: `${appliedPoints} pts • ${formatRs(pointsApplied)}`,
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMethod(m.id as PaymentMethod)}
                    className={`w-full rounded-[14px] border-2 px-4 py-3 text-left transition-colors duration-300 ease-out ${activeMethod === m.id ? "border-[#EA580C] bg-[#EA580C15]" : "border-[#E2E8F0] bg-white"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-[14px] px-3 transition-colors duration-300 ease-out ${
                          activeMethod === m.id ? "bg-[#EA580C30]" : "bg-[#F1F5F9]"
                        }`}
                      >
                        <m.icon className="h-6 w-6 text-[#64748B]" />
                      </span>
                      <div>
                        <p className="font-['Inter'] text-base font-bold leading-6 tracking-normal text-[#1D293D]">
                          {m.label}
                        </p>
                        <p className="font-['Inter'] text-xs font-medium leading-4 tracking-normal text-[#62748E]">
                          {m.sub}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 border-t border-[#E2E8F0] pt-3">
                <p className="font-['Inter'] text-sm font-bold uppercase leading-5 tracking-normal text-[#314158]">
                  Applied Payments
                </p>
                <div className="mt-2 space-y-1.5 text-sm">
                  {cashApplied > 0 && (
                    <div className="flex min-h-11 items-center justify-between rounded-[10px] bg-[#ECFDF5] px-3 py-2">
                      <span className="inline-flex items-center gap-2 font-['Inter'] text-sm font-medium leading-5 tracking-normal text-[#314158]">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M8 1.33331V14.6666" stroke="#009966" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M11.3333 3.33331H6.33333C5.71449 3.33331 5.121 3.57915 4.68342 4.01673C4.24583 4.45432 4 5.04781 4 5.66665C4 6.28548 4.24583 6.87898 4.68342 7.31656C5.121 7.75415 5.71449 7.99998 6.33333 7.99998H9.66667C10.2855 7.99998 10.879 8.24581 11.3166 8.6834C11.7542 9.12098 12 9.71447 12 10.3333C12 10.9522 11.7542 11.5456 11.3166 11.9832C10.879 12.4208 10.2855 12.6666 9.66667 12.6666H4" stroke="#009966" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Cash</span>
                      </span>
                      <span className="font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#007A55]">{formatRs(cashApplied)}</span>
                    </div>
                  )}
                  {cards.map((c) => (
                    <div
                      key={c.id}
                      className="flex min-h-11 items-center justify-between rounded-[10px] bg-[#EFF6FF] px-3 py-2"
                    >
                      <span className="inline-flex items-center gap-2 font-['Inter'] text-sm font-medium leading-5 tracking-normal text-[#314158]">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M13.333 3.33331H2.66634C1.92996 3.33331 1.33301 3.93027 1.33301 4.66665V11.3333C1.33301 12.0697 1.92996 12.6666 2.66634 12.6666H13.333C14.0694 12.6666 14.6663 12.0697 14.6663 11.3333V4.66665C14.6663 3.93027 14.0694 3.33331 13.333 3.33331Z" stroke="#155DFC" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M1.33301 6.66669H14.6663" stroke="#155DFC" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>
                          {c.cardType.charAt(0).toUpperCase() + c.cardType.slice(1).toLowerCase()} •••• {c.last4}
                        </span>
                      </span>
                      <span className="font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#1447E6]">{formatRs(c.amount)}</span>
                    </div>
                  ))}
                  {vouchers.map((v) => (
                    <div
                      key={v.id}
                      className="flex min-h-11 items-center justify-between rounded-[10px] bg-[#F5F3FF] px-3 py-2"
                    >
                      <span className="inline-flex items-center gap-2 font-['Inter'] text-sm font-medium leading-5 tracking-normal text-[#314158]">
                        <Gift className="h-4 w-4 text-[#9810FA]" />
                        <span>{v.code}</span>
                      </span>
                      <span className="font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#8200DB]">{formatRs(v.amount)}</span>
                    </div>
                  ))}
                  {pointsApplied > 0 && (
                    <div className="flex min-h-11 items-center justify-between rounded-[10px] bg-[#FEF9C3] px-3 py-2">
                      <span className="inline-flex items-center gap-2 font-['Inter'] text-sm font-medium leading-5 tracking-normal text-[#314158]">
                        <Star className="h-4 w-4 text-[#E17100]" />
                        <span>Loyalty Points ({appliedPoints})</span>
                      </span>
                      <span className="font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#BB4D00]">{formatRs(pointsApplied)}</span>
                      <button 
                        onClick={() => setAppliedPoints(0)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {cashApplied + cards.length + vouchers.length + (pointsApplied > 0 ? 1 : 0) ===
                    0 && <p className="py-4 text-center text-[#94A3B8]">No payments applied yet</p>}
                </div>
              </div>
            </div>

            <div className="col-span-8">
              {activeMethod === "cash" && (
                <>
                  <p className="mb-3 font-['Inter'] text-[18px] font-bold leading-7 tracking-normal text-[#1D293D]">
                    Cash Payment
                  </p>
                  <div className="rounded-[16px] border border-[#A4F4CF] bg-[#ECFDF5] p-6">
                    <label className="font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158]">
                      Cash Amount ($)
                    </label>
                    <input
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-3 w-full rounded-[14px] border-2 border-[#5EE9B5] bg-white px-6 py-4 font-['Inter'] text-[30px] font-bold leading-none tracking-normal text-[#0A0A0A] placeholder:text-[#0A0A0A80]"
                    />
                    <button
                      type="button"
                      className="mt-3 w-full rounded-[14px] bg-[#009966] py-3 font-['Inter'] text-base font-bold leading-6 tracking-normal text-white transition-colors duration-300 ease-out"
                    >
                      Save Cash Balance (
                      {formatRs(
                        Math.max(amountDue - (cardApplied + voucherApplied + pointsApplied), 0)
                      )}
                      )
                    </button>
                  </div>
                </>
              )}

              {activeMethod === "card" && (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-['Inter'] text-[18px] font-bold leading-7 tracking-normal text-[#1D293D]">
                      Card Payment
                    </p>
                    <p className="font-['Inter'] text-sm font-normal leading-5 tracking-normal text-[#62748E]">
                      {cardCountText}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-[#BEDBFF] bg-[#EFF6FF] px-[25px] pt-[25px] pb-4">
                    <p className="mb-4 font-['Inter'] text-sm font-normal leading-5 tracking-normal text-[#1447E6]">
                      Record card payment details. Actual payment is processed on the card machine.
                    </p>
                    <label className="font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158]">
                      Card Type
                    </label>
                    <div className="relative mt-1">
                      <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                        className="w-full appearance-none rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-3 pr-11 font-['Inter'] text-sm leading-5 text-[#1D293D] focus:border-[#155DFC] focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20"
                      >
                        <option value="visa">Visa</option>
                        <option value="master">MasterCard</option>
                        <option value="amex">Amex</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                    </div>
                    <label className="mt-4 block font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158]">
                      Last 4 Digits
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      value={cardLast4}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setCardLast4(digitsOnly);
                      }}
                      maxLength={4}
                      placeholder="••••"
                      className="mt-1 w-full rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-3 font-['Consolas'] text-[24px] leading-none tracking-[2.4px] text-[#1D293D] placeholder:font-['Consolas'] placeholder:text-[24px] placeholder:leading-none placeholder:tracking-[2.4px] placeholder:text-[#0A0A0A80] focus:border-[#155DFC] focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20"
                    />
                    <label className="mt-4 block font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158]">
                      Amount (Rs.)
                    </label>
                    <input
                      value={cardAmount}
                      onChange={(e) => setCardAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1 w-full rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-3 font-['Inter'] text-[#1D293D] placeholder:font-['Inter'] placeholder:text-[20px] placeholder:leading-none placeholder:tracking-normal placeholder:text-[#0A0A0A80] focus:border-[#155DFC] focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddCard}
                      className="mt-4 w-full rounded-[14px] bg-[#155DFC] py-3 font-['Inter'] text-base font-bold leading-6 tracking-normal text-white transition-colors duration-300 ease-out hover:bg-[#1248c9]"
                    >
                      + Add Card Payment
                    </button>

                    {cards.length > 0 && (
                      <div className="mt-4 border-t border-[#BEDBFF] pt-4">
                        <p className="mb-3 font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158]">
                          Added Cards
                        </p>
                        <div className="space-y-3">
                          {cards.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-3"
                            >
                              <div>
                                <p className="font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158]">
                                  {c.cardType.toUpperCase()}
                                </p>
                                <p className="font-['Consolas'] text-base leading-none tracking-[1.6px] text-[#62748E]">
                                  •••• {c.last4}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="font-['Inter'] text-base font-bold leading-6 tracking-normal text-[#155DFC]">
                                  {formatRs(c.amount)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCards((prev) => prev.filter((x) => x.id !== c.id))
                                  }
                                  className="rounded-md p-1 text-[#EF4444] transition-colors hover:bg-[#FEE2E2]"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeMethod === "voucher" && (
                <>
                  <p className="mb-3 font-['Inter'] text-[18px] font-bold leading-7 tracking-normal text-[#1D293D]">
                    Gift Voucher
                  </p>
                  <div className="rounded-[16px] border border-[#E9D4FF] bg-[#FAF5FF] px-[25px] pt-[25px] pb-4">
                    <p className="mb-3 font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158]">
                      Redemption Method
                    </p>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVoucherMode("promo")}
                        className={`flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 px-3 py-4 font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158] text-center transition-colors duration-300 ease-out ${voucherMode === "promo" ? "border-[#AD46FF] bg-[#F3E8FF]" : "border-[#E2E8F0] bg-white"}`}
                      >
                        <PromoMethodIcon color={voucherMode === "promo" ? "#9810FA" : "#90A1B9"} />
                        Promo Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoucherMode("scan")}
                        className={`flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 px-3 py-4 font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158] text-center transition-colors duration-300 ease-out ${voucherMode === "scan" ? "border-[#AD46FF] bg-[#F3E8FF]" : "border-[#E2E8F0] bg-white"}`}
                      >
                        <ScanMethodIcon color={voucherMode === "scan" ? "#9810FA" : "#90A1B9"} />
                        <span>Scan Barcode</span>
                      </button>
                    </div>
                    <label className="font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158]">
                      {voucherMode === "promo" ? "Promo Code" : "Scanned Code"}
                    </label>
                    <input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="GV25-ABCD-1234"
                      className="mt-2 w-full rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-3 font-['Consolas'] text-[20px] leading-none tracking-[1px] text-[#1D293D] placeholder:font-['Consolas'] placeholder:text-[20px] placeholder:leading-none placeholder:tracking-[1px] placeholder:uppercase placeholder:text-[#0A0A0A80] focus:border-[#9810FA] focus:outline-none focus:ring-2 focus:ring-[#9810FA]/20"
                    />
                    <button
                      type="button"
                      onClick={handleRedeemVoucher}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#9810FA] py-3 font-['Inter'] text-base font-bold leading-6 tracking-normal text-white transition-colors duration-300 ease-out hover:bg-[#7d0cd0]"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          d="M16.6667 6.66666H3.33333C2.8731 6.66666 2.5 7.03975 2.5 7.49999V9.16666C2.5 9.62689 2.8731 9.99999 3.33333 9.99999H16.6667C17.1269 9.99999 17.5 9.62689 17.5 9.16666V7.49999C17.5 7.03975 17.1269 6.66666 16.6667 6.66666Z"
                          stroke="white"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 6.66666V17.5"
                          stroke="white"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15.8332 10V15.8333C15.8332 16.2754 15.6576 16.6993 15.345 17.0118C15.0325 17.3244 14.6085 17.5 14.1665 17.5H5.83317C5.39114 17.5 4.96722 17.3244 4.65466 17.0118C4.3421 16.6993 4.1665 16.2754 4.1665 15.8333V10"
                          stroke="white"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.24984 6.66666C5.6973 6.66666 5.1674 6.44717 4.7767 6.05647C4.386 5.66577 4.1665 5.13587 4.1665 4.58333C4.1665 4.0308 4.386 3.50089 4.7767 3.11019C5.1674 2.71949 5.6973 2.5 6.24984 2.5C7.05374 2.48599 7.84152 2.87605 8.51045 3.6193C9.17938 4.36255 9.6984 5.4245 9.99984 6.66666C10.3013 5.4245 10.8203 4.36255 11.4892 3.6193C12.1581 2.87605 12.9459 2.48599 13.7498 2.5C14.3024 2.5 14.8323 2.71949 15.223 3.11019C15.6137 3.50089 15.8332 4.0308 15.8332 4.58333C15.8332 5.13587 15.6137 5.66577 15.223 6.05647C14.8323 6.44717 14.3024 6.66666 13.7498 6.66666"
                          stroke="white"
                          strokeWidth="1.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Redeem Voucher</span>
                    </button>
                    <p className="mt-3 rounded-[10px] bg-[#F3E8FF] px-3 py-3 font-['Inter'] text-xs font-normal leading-4 tracking-normal text-[#8200DB]">
                      <span className="font-bold">Code Format:</span> GV25-ABCD-1234 (Rs.5000),
                      BX25-ABCD-1234 (Rs.8000)
                    </p>
                  </div>
                </>
              )}

              {activeMethod === "loyalty" && (
                <>
                  <p className="mb-3 font-['Inter'] text-[18px] font-bold leading-7 tracking-normal text-[#1D293D]">
                    Loyalty Points
                  </p>
                  <div className="rounded-[16px] border border-[#FEE685] bg-[#FFFBEB] px-[25px] pt-[25px] pb-4">
                    {!hasCustomerForPoints ? (
                      <p className="rounded-[10px] bg-white px-3 py-3 text-sm text-[#92400E]">
                        No registered customer found for this order. Loyalty points can be used only
                        for registered customers.
                      </p>
                    ) : (
                      <>
                        <div className="rounded-[14px] bg-white px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-['Inter'] text-sm font-normal leading-5 tracking-normal text-[#45556C]">Available Points</p>
                              <p className="font-['Inter'] text-[30px] font-bold leading-9 tracking-normal text-[#E17100]">
                                {availablePoints.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-['Inter'] text-sm font-normal leading-5 tracking-normal text-[#45556C]">Points Value</p>
                              <p className="font-['Inter'] text-[20px] font-bold leading-7 tracking-normal text-[#314158]">
                                {formatRs(availablePoints * pointsRate)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 rounded-[10px] bg-[#FEF3C6] px-3 py-3 text-center font-['Inter'] text-xs font-normal leading-4 tracking-normal text-[#BB4D00]">
                          1 point = Rs.1.00
                        </p>
                        <label className="mt-3 block font-['Inter'] text-sm font-bold leading-5 tracking-normal text-[#314158]">
                          Points to Use
                        </label>
                        <input
                          value={pointsToUse}
                          onChange={(e) => setPointsToUse(e.target.value)}
                          placeholder="Enter points"
                          className="mt-3 w-full rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-3 font-['Inter'] text-[#1D293D] placeholder:font-['Inter'] placeholder:text-[20px] placeholder:leading-none placeholder:tracking-normal placeholder:text-[#0A0A0A80] focus:border-[#E17100] focus:outline-none focus:ring-2 focus:ring-[#E17100]/20"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPoints}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#E17100] py-3 font-['Inter'] text-base font-bold leading-6 tracking-normal text-white transition-colors duration-300 ease-out hover:bg-[#c76000]"
                        >
                          <Star className="h-5 w-5 text-white" />
                          <span>Apply Points</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-[#E2E8F0] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-[14px] border-2 border-[#E2E8F0] bg-white px-8 py-3 font-['Inter'] text-base font-bold leading-6 tracking-normal text-[#45556C] text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirmPayment()}
            disabled={!canConfirm || isSubmitting}
            className={`flex-1 rounded-[14px] py-3 font-['Inter'] text-base font-bold leading-6 tracking-normal text-white text-center shadow-[0px_8px_10px_-6px_#0000001A,0px_20px_25px_-5px_#0000001A] transition-colors duration-300 ease-out ${canConfirm ? "bg-[#EA580C]" : "bg-[#94A3B8]"} disabled:opacity-70`}
          >
            {isSuccess
              ? "Payment Confirmed"
              : canConfirm
                ? "Confirm Payment"
                : `${formatRs(Math.max(remaining, 0))} Remaining`}
          </button>
        </div>
      </div>
    </div>
  );
}
