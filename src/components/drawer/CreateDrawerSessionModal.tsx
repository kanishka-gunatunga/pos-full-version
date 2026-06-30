"use client";

import { useState } from "react";
import { X, Wallet } from "lucide-react";

interface CreateDrawerSessionModalProps {
  onClose: () => void;
  onCreate: (openingAmount: number) => void | Promise<void>;
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

export default function CreateDrawerSessionModal({
  onClose,
  onCreate,
}: CreateDrawerSessionModalProps) {
  const [initialAmount, setInitialAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseAmount(initialAmount);
  const isValid = amountNum > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await Promise.resolve(onCreate(amountNum));
      onClose();
    } catch (err: unknown) {
      const raw =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to create session.");
      if (/request failed|status code|ECONNREFUSED|ECONNRESET|ENOTFOUND/i.test(String(raw))) {
        setError("Unable to create session. Please try again or contact support.");
      } else {
        setError(raw || "Failed to create session.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw
      .replace(/[^0-9.]/g, "")
      .replace(/^\./, "0.")
      .replace(/(\..*)\./g, "$1")
      .replace(/(\.\d{2})\d+$/, "$1");
    setInitialAmount(sanitized);
  };

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
            <Wallet className="h-6 w-6 text-[#009966]" />
          </div>
          <div>
            <h2 className="font-['Inter'] text-2xl font-bold leading-8 text-[#1D293D]">
              Create Drawer Session
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
              placeholder="Rs.5,230.00"
              value={initialAmount}
              onChange={handleAmountChange}
              className="h-16 w-full rounded-2xl border-2 border-[#E2E8F0] bg-white py-4 pl-6 pr-4 font-['Consolas'] text-lg leading-[100%] text-[#0A0A0A] placeholder:text-[#0A0A0A]/25 outline-none transition-all focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="h-14 flex-1 rounded-2xl bg-[#F1F5F9] font-['Inter'] text-base font-bold leading-6 text-[#314158] transition-all hover:bg-[#E2E8F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="h-14 flex-1 rounded-2xl bg-[#EA580C] font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A] transition-all hover:bg-[#DC4C04] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
            >
              {isSubmitting ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
