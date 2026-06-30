"use client";

import { X, Lock } from "lucide-react";

interface ManagerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitle: string;
  children: React.ReactNode;
  onVerify: () => void;
  verifyLabel?: string;
  isSubmitting?: boolean;
  disableVerify?: boolean;
}

export default function ManagerVerificationModal({
  isOpen,
  onClose,
  subtitle,
  children,
  onVerify,
  verifyLabel = "Verify & Continue",
  isSubmitting = false,
  disableVerify = false,
}: ManagerVerificationModalProps) {
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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFEDD4]">
            <Lock className="h-6 w-6 text-[#EA580C]" />
          </div>
          <div>
            <h2 className="font-['Inter'] text-2xl font-bold leading-8 text-[#1D293D]">
              Manager Verification
            </h2>
            <p className="mt-1 font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {children}
          <button
            type="button"
            onClick={onVerify}
            disabled={isSubmitting || disableVerify}
            className="h-14 w-full max-w-[384px] rounded-2xl bg-[#EA580C] font-['Inter'] text-base font-bold leading-6 text-center text-white shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A] transition-all hover:bg-[#DC4C04] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
          >
            {isSubmitting ? "Verifying..." : verifyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
