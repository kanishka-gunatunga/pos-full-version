"use client";

import { useState, useEffect } from "react";
import { X, Wallet } from "lucide-react";
import { getSessionCloseErrorMessage } from "@/lib/drawer/sessionCloseErrors";

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

interface CloseTheDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDrawerAmount: number;
  onConfirm: (amount: number, passcode: string) => void | Promise<void>;
}

export default function CloseTheDrawerModal({
  isOpen,
  onClose,
  initialDrawerAmount,
  onConfirm,
}: CloseTheDrawerModalProps) {
  const [amount, setAmount] = useState(initialDrawerAmount ? initialDrawerAmount.toFixed(2) : "");
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount(initialDrawerAmount ? initialDrawerAmount.toFixed(2) : "");
      setPasscode("");
    }
  }, [isOpen, initialDrawerAmount]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseAmount(amount);
  const isValid = amountNum > 0 && passcode.trim().length > 0;

  const handleAmountChange = (value: string) => {
    const sanitized = value
      .replace(/[^0-9.]/g, "")
      .replace(/^\./, "0.")
      .replace(/(\..*)\./g, "$1")
      .replace(/(\.\d{2})\d+$/, "$1");
    setAmount(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await Promise.resolve(onConfirm(amountNum, passcode.trim()));
      onClose();
    } catch (err: unknown) {
      setError(getSessionCloseErrorMessage(err, "drawer_modal"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-[448px] flex-col gap-6 overflow-hidden rounded-[24px] bg-white p-8 shadow-[0px_25px_50px_-12px_#00000040] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-[#90A1B9] transition-colors hover:bg-[#F8FAFC]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D0FAE5]">
            <Wallet className="h-6 w-6 text-[#10B981]" />
          </div>
          <div>
            <h2 className="font-['Inter'] text-xl font-bold leading-7 text-[#1D293D]">
              Close the Drawer
            </h2>
            <p className="mt-1 font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
              Enter the current cash in your drawer
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-['Inter'] text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="block font-['Inter'] text-sm font-bold leading-5 text-[#314158]">
              Initial Drawer Amount
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Rs.0.00"
              className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 font-['Consolas'] text-base text-[#1D293D] placeholder:text-[#90A1B9] outline-none transition-all focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10"
            />
          </div>
          <div className="space-y-2">
            <label className="block font-['Inter'] text-sm font-bold leading-5 text-[#314158]">
              Manager Passcode
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 font-['Inter'] text-base text-[#1D293D] placeholder:text-[#90A1B9] outline-none transition-all focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="h-14 flex-1 rounded-2xl bg-[#F1F5F9] font-['Inter'] text-base font-bold leading-6 text-[#45556C] transition-all hover:bg-[#E2E8F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="h-14 flex-1 rounded-2xl bg-[#F97316] font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A] transition-all hover:bg-[#EA580C] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
            >
              {isSubmitting ? "Closing..." : "Close Drawer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
