"use client";

import { useState, useEffect } from "react";
import { Lock, X } from "lucide-react";
import { isInvalidManagerPasscodeError } from "@/lib/api/managerPasscodeError";

type Props = {
  orderNo: string;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (passcode: string) => void | Promise<void>;
};

export default function ManagerAuthorizationModal({ orderNo, isOpen, onClose, onVerify }: Props) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPasscode("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length !== 4) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await Promise.resolve(onVerify(passcode));
      setPasscode("");
    } catch (err: unknown) {
      const raw =
        (err as { response?: { status?: number; data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Verification failed.");
      if (isInvalidManagerPasscodeError(err)) {
        setError("Wrong passcode.");
      } else if (/request failed|status code|ECONNREFUSED|ECONNRESET|ENOTFOUND/i.test(String(raw))) {
        setError("Unable to verify. Please try again or contact support.");
      } else {
        setError(raw || "Verification failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[32px] border border-[#FFFFFF33] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFE6EB]">
              <Lock className="h-6 w-6 text-[#FF476E]" />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-[#90A1B9] transition-colors hover:bg-[#F1F5F9] hover:text-[#45556C]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 mt-5">
          <h2 className="font-['Inter'] text-[20px] font-bold leading-[28px] text-[#1D293D]">
            Manager Authorization
          </h2>
          <p className="mt-2 font-['Inter'] text-sm font-bold leading-[22.75px] text-[#62748E]">
            To cancel order{" "}
            <span className="font-['Inter'] text-sm font-bold leading-[22.75px] text-[#314158]">
              #{orderNo}
            </span>
            , please enter the manager passcode for verification.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-['Inter'] text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={passcode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 4) setPasscode(value);
            }}
            placeholder="Enter 4-digit passcode"
            className="w-full rounded-[16px] border-2 border-[#F3E4E1C9] bg-[#FAFBFD] pl-[15px] pr-4 py-3 text-center font-['Inter'] text-base font-bold leading-[100%] tracking-[3px] text-[#0A0A0A54] placeholder:font-medium placeholder:text-[#90A1B9] placeholder:tracking-normal focus:border-[#FF476E] focus:outline-none focus:ring-1 focus:ring-[#FF476E]/20"
            autoFocus
          />

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[16px] bg-[#F1F5F9] px-4 py-3 text-center font-['Inter'] text-base font-bold leading-6 text-[#45556C] transition-colors hover:bg-[#E2E8F0]"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={passcode.length !== 4 || isSubmitting}
              className="flex-1 rounded-[16px] bg-[#FF2056] px-4 py-3 text-center font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#FFCCD3,0px_10px_15px_-3px_#FFCCD3] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            >
              {isSubmitting ? "Verifying…" : "Verify & Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
