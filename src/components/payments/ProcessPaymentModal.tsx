"use client";

import { useState, useEffect, useRef } from "react";
import { X, Banknote, CreditCard, Check, Calculator, ArrowRight, Loader2 } from "lucide-react";
import { Payment } from "@/types/payment";
import { useCreatePayment } from "@/hooks/usePayment";
import { toast } from "sonner";
import { fetchOrderStateForPaymentCreate } from "@/services/paymentService";
import {
  buildCreatePaymentDraftFromOrder,
  ORDER_MONEY_EPS,
} from "@/domains/orders/orderCollectionAmount";

interface ProcessPaymentModalProps {
    payment: Payment;
    onClose: () => void;
    amountCaption?: string;
}

type Step = "METHOD" | "INPUT" | "SUCCESS";

export default function ProcessPaymentModal({
    payment,
    onClose,
    amountCaption = "Total",
}: ProcessPaymentModalProps) {
    const [step, setStep] = useState<Step>("METHOD");
    const [method, setMethod] = useState<"cash" | "card" | null>(null);
    const [amountGiven, setAmountGiven] = useState<string>(payment.amount.toString());
    const [changeToReturn, setChangeToReturn] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitGuardRef = useRef(false);

    const createPaymentMutation = useCreatePayment();
    const isBusy = isSubmitting || createPaymentMutation.isPending;

    useEffect(() => {
        const given = parseFloat(amountGiven) || 0;
        setChangeToReturn(Math.max(0, given - payment.amount));
    }, [amountGiven, payment.amount]);

    const handleComplete = async (explicitMethod?: "cash" | "card") => {
        const payMethod = explicitMethod ?? method;
        if (!payMethod) return;
        if (submitGuardRef.current || createPaymentMutation.isPending) return;
        submitGuardRef.current = true;
        setIsSubmitting(true);
        try {
            let fresh;
            try {
                fresh = await fetchOrderStateForPaymentCreate(payment.id);
            } catch {
                toast.error("Could not reload the order. Check your connection and try again.");
                return;
            }
            const draft = buildCreatePaymentDraftFromOrder(fresh);
            if (draft.amount <= ORDER_MONEY_EPS) {
                toast.message(
                    "Nothing to collect — this order is already covered on the server."
                );
                onClose();
                return;
            }
            await createPaymentMutation.mutateAsync({
                orderId: Number(payment.id),
                paymentMethod: payMethod,
                amount: draft.amount,
                paidAmount: payMethod === "cash" ? (Number((parseFloat(String(amountGiven).replace(/[^0-9.]/g, "")) || draft.amount).toFixed(2))) : draft.amount,
                paid_amount: payMethod === "cash" ? (Number((parseFloat(String(amountGiven).replace(/[^0-9.]/g, "")) || draft.amount).toFixed(2))) : draft.amount,
                status: "paid",
                ...(draft.paymentRole === "balance_due" ? { paymentRole: "balance_due" as const } : {}),
            });
            setStep("SUCCESS");
        } catch (error: unknown) {
            console.error("Payment failed:", error);
            const msg =
                error &&
                typeof error === "object" &&
                "response" in error &&
                error.response &&
                typeof error.response === "object" &&
                "data" in error.response &&
                error.response.data &&
                typeof error.response.data === "object" &&
                "message" in error.response.data
                    ? String((error.response.data as { message?: unknown }).message)
                    : error instanceof Error
                      ? error.message
                      : "Payment could not be saved.";
            toast.error(msg);
        } finally {
            submitGuardRef.current = false;
            setIsSubmitting(false);
        }
    };

    const requestClose = () => {
        if (isBusy) return;
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={requestClose}>
            <div
                className="relative w-full max-w-[550px] overflow-hidden rounded-[32px] bg-white shadow-2xl transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between bg-[#F8FAFC80] border-b border-[#E2E8F0] px-8 py-4 mb-2">
                    <div>
                        <h2 className="text-[24px] font-bold text-[#314158]">Process Payment</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[14px] text-[#62748E] font-normal">{payment.customerName}</span>
                            <span className="text-[#90A1B9]">•</span>
                            <span className="text-[14px] text-[#62748E] font-normal">
                                {amountCaption}: Rs.{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={requestClose}
                        disabled={isBusy}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#90A1B9] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-[300px] flex flex-col justify-center p-8">
                    {step === "METHOD" && (
                        <div className="space-y-8 text-center">
                            <h3 className="text-[18px] font-bold text-[#314158]">Select Payment Method</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMethod("cash");
                                        setStep("INPUT");
                                    }}
                                    disabled={isBusy}
                                    className="group flex flex-col items-center gap-4 rounded-[24px] border-2 border-[#A4F4CF] bg-[#D0FAE580] p-8 transition-all hover:border-[#00BC7D] hover:bg-[#F1FDF9] disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#00BC7D] text-white shadow-lg shadow-[#00BC7D]/20 transition-transform group-hover:scale-110">
                                        <Banknote className="h-8 w-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[20px] font-bold text-[#1D293D]">Cash</p>
                                        <p className="text-[14px] font-medium text-[#62748E]">Pay with cash</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMethod("card");
                                        void handleComplete("card");
                                    }}
                                    disabled={isBusy}
                                    className="group flex flex-col items-center gap-4 rounded-[24px] border-2 bg-[#DBEAFE80] border-[#BEDBFF] p-8 transition-all hover:border-[#2B7FFF] hover:bg-[#F1F7FF] disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#2B7FFF] text-white shadow-lg shadow-[#2B7FFF]/20 transition-transform group-hover:scale-110">
                                        {isBusy && step === "METHOD" ? (
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        ) : (
                                            <CreditCard className="h-8 w-8" />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[20px] font-bold text-[#1D293D]">Card</p>
                                        <p className="text-[14px] font-medium text-[#62748E]">Pay with card</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === "INPUT" && (
                        <div className="space-y-6">
                            <div className="rounded-[20px] bg-[#F8FAFC] border border-[#F1F5F9] p-6 flex justify-between items-center">
                                <span className="text-[14px] font-bold uppercase tracking-wider text-[#62748E]">ORDER TOTAL</span>
                                <span className="text-[30px] font-bold text-[#1D293D]">Rs.{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 text-[#009966]">
                                        <Banknote className="h-4 w-4" />
                                    </div>
                                    <label className="text-[14px] font-bold uppercase text-[#314158]">Amount Given by Customer</label>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[30px] font-bold text-[#1D293D]">Rs.</span>
                                    <input
                                        type="number"
                                        value={amountGiven}
                                        onChange={(e) => setAmountGiven(e.target.value)}
                                        disabled={isBusy}
                                        autoFocus
                                        className="h-20 w-full rounded-[16px] border-2 border-[#E2E8F0] bg-white pl-18 pr-6 text-[30px] font-bold text-[#1D293D] outline-none transition-all focus:border-[#00BC7D] focus:ring-4 focus:ring-[#00BC7D]/5 disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div className="rounded-[16px] border-2 border-[#A4F4CF] bg-[#D0FAE580] p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#00BC7D] text-white">
                                        <Calculator className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-widest text-[#007A55]">CHANGE TO RETURN</p>
                                        <p className="text-[30px] font-bold text-[#007A55]">Rs.{changeToReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setStep("METHOD")}
                                    disabled={isBusy}
                                    className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-[#E2E8F0] text-[16px] font-bold text-[#314158] transition-all hover:bg-[#E2E8F0] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleComplete()}
                                    disabled={isBusy || parseFloat(amountGiven) < payment.amount}
                                    className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-[#00BC7D] text-[16px] font-bold text-white shadow-lg shadow-[#00BC7D]/20 transition-all hover:bg-[#009966] active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:scale-100"
                                >
                                    {isBusy ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Complete Payment <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === "SUCCESS" && (
                        <div className="text-center py-8 space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#00BC7D] text-white shadow-xl shadow-[#00BC7D]/30">
                                <Check className="h-12 w-12 stroke-[4px]" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-[28px] font-black text-[#1D293D]">Payment Successful!</h3>
                                <p className="text-[16px] text-[#62748E] font-medium">
                                    Change returned: Rs.{changeToReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="mt-4 inline-flex px-8 h-12 items-center justify-center rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[14px] font-bold text-[#62748E] transition-all hover:bg-white hover:shadow-md"
                            >
                                Close Receipt
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
