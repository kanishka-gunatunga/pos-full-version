"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { getSessionCloseErrorMessage } from "@/lib/drawer/sessionCloseErrors";
import ManagerVerificationModal from "./ManagerVerificationModal";

function formatRs(n: number) {
  return `Rs.${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

interface CloseDrawerSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedBalance: number;
  initialAmount: number;
  cashSales: number;
  cashOuts: number;
  onVerify: (actualBalance: number, passcode: string) => void | Promise<void>;
}

export default function CloseDrawerSessionModal({
  isOpen,
  onClose,
  expectedBalance,
  initialAmount,
  cashSales,
  cashOuts,
  onVerify,
}: CloseDrawerSessionModalProps) {
  const [actualBalance, setActualBalance] = useState("");
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActualBalance("");
      setPasscode("");
    }
  }, [isOpen]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actualNum = parseAmount(actualBalance);
  const balanceMatches = Math.abs(actualNum - expectedBalance) < 0.01;
  const isValid = actualNum > 0 && passcode.trim().length > 0;

  const handleAmountChange = (value: string) => {
    const sanitized = value
      .replace(/[^0-9.]/g, "")
      .replace(/^\./, "0.")
      .replace(/(\..*)\./g, "$1")
      .replace(/(\.\d{2})\d+$/, "$1");
    setActualBalance(sanitized);
  };

  const handleVerify = async () => {
    if (!isValid) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await Promise.resolve(onVerify(actualNum, passcode.trim()));
      onClose();
    } catch (err: unknown) {
      setError(getSessionCloseErrorMessage(err, "drawer_modal"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagerVerificationModal
      isOpen={isOpen}
      onClose={onClose}
      subtitle="Close drawer session"
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
        <div className="flex min-h-[134px] w-full max-w-[384px] flex-col gap-2 rounded-2xl border border-[#BEDBFF] bg-[#EFF6FF] p-[17px]">
          <p className="font-['Inter'] text-sm font-normal leading-5 text-[#1447E6]">
            Expected Balance
          </p>
          <div className="scrollbar-subtle min-w-0 overflow-x-auto">
            <p className="whitespace-nowrap font-['Inter'] text-2xl font-bold leading-8 text-[#1C398E]">
              {formatRs(expectedBalance)}
            </p>
          </div>
          <div className="scrollbar-subtle min-w-0 overflow-x-auto">
            <p className="whitespace-nowrap font-['Inter'] text-xs font-normal leading-4 text-[#155DFC]">
              Initial: {formatRs(initialAmount)} + Sales: {formatRs(cashSales)} - Cash Outs: {formatRs(cashOuts)}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block font-['Inter'] text-sm font-bold leading-5 text-[#314158]">
            Actual Drawer Balance (Manual Count)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={actualBalance}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="Rs.0.00"
            className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 font-['Consolas'] text-base text-[#1D293D] placeholder:text-[#90A1B9] outline-none transition-all focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10"
          />
          {balanceMatches && actualNum > 0 && (
            <p className="flex items-center gap-2 font-['Inter'] text-sm font-bold text-[#009966]">
              <Check className="h-4 w-4" />
              Balance matches!
            </p>
          )}
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
