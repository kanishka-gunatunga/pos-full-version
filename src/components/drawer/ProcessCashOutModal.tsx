"use client";

import { useState, useEffect } from "react";
import { isInvalidManagerPasscodeError } from "@/lib/api/managerPasscodeError";
import ManagerVerificationModal from "./ManagerVerificationModal";

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

interface ProcessCashOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  onVerify: (amount: number, reason: string, passcode: string) => void | Promise<void>;
}

export default function ProcessCashOutModal({
  isOpen,
  onClose,
  defaultAmount,
  onVerify,
}: ProcessCashOutModalProps) {
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toFixed(2) : "");
  const [reason, setReason] = useState("");
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount ? defaultAmount.toFixed(2) : "");
      setReason("");
      setPasscode("");
    }
  }, [isOpen, defaultAmount]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseAmount(amount);
  const isValid = amountNum > 0 && reason.trim().length > 0 && passcode.trim().length > 0;

  const handleAmountChange = (value: string) => {
    const sanitized = value
      .replace(/[^0-9.]/g, "")
      .replace(/^\./, "0.")
      .replace(/(\..*)\./g, "$1")
      .replace(/(\.\d{2})\d+$/, "$1");
    setAmount(sanitized);
  };

  const handleVerify = async () => {
    if (!isValid) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await Promise.resolve(onVerify(amountNum, reason.trim(), passcode.trim()));
      onClose();
    } catch (err: unknown) {
      const raw =
        (err as { response?: { status?: number; data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Verification failed.");
      if (isInvalidManagerPasscodeError(err)) {
        setError("Wrong passcode.");
      } else if (/request failed|status code|ECONNREFUSED|ECONNRESET|ENOTFOUND/i.test(String(raw))) {
        setError("Unable to process. Please try again or contact support.");
      } else {
        setError(raw || "Verification failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagerVerificationModal
      isOpen={isOpen}
      onClose={onClose}
      subtitle="Process cash out"
      onVerify={handleVerify}
      isSubmitting={isSubmitting}
      disableVerify={!isValid}
    >
      <>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-['Inter'] text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label className="block font-['Inter'] text-sm font-bold leading-5 text-[#314158]">
            Cash Out Amount
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="Enter amount (e.g. 4000.00)"
            className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 font-['Consolas'] text-base text-[#45556C] placeholder:text-[#90A1B9] outline-none transition-all focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10"
          />
        </div>
        <div className="space-y-2">
          <label className="block font-['Inter'] text-sm font-bold leading-5 text-[#314158]">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter Reason"
            rows={3}
            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 font-['Inter'] text-base text-[#1D293D] placeholder:text-[#90A1B9] outline-none transition-all focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10 resize-none"
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
      </>
    </ManagerVerificationModal>
  );
}
