"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Wallet } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { getSessionCloseErrorMessage } from "@/lib/drawer/sessionCloseErrors";

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

interface CloseDrawerBeforeLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseAndLogout?: (actualBalance: number, passcode: string) => Promise<void>;
}

export default function CloseDrawerBeforeLogoutModal({
  isOpen,
  onClose,
  onCloseAndLogout,
}: CloseDrawerBeforeLogoutModalProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [actualBalance, setActualBalance] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoToDrawer = () => {
    onClose();
    router.push(ROUTES.DASHBOARD_DRAWER);
  };

  const actualNum = parseAmount(actualBalance);
  const canSubmit = actualNum > 0 && passcode.trim().length > 0 && onCloseAndLogout;

  const handleCloseAndLogout = async () => {
    if (!canSubmit || !onCloseAndLogout) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onCloseAndLogout(actualNum, passcode.trim());
      onClose();
    } catch (err: unknown) {
      setError(getSessionCloseErrorMessage(err, "logout_modal"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setActualBalance("");
    setPasscode("");
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="relative flex w-full max-w-[448px] flex-col gap-6 overflow-hidden rounded-[24px] bg-white p-8 shadow-[0px_25px_50px_-12px_#00000040] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-[#90A1B9] transition-colors hover:bg-[#F8FAFC]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FEF3C7]">
            <Wallet className="h-6 w-6 text-[#D97706]" />
          </div>
          <div>
            <h2 className="font-['Inter'] text-xl font-bold leading-7 text-[#1D293D]">
              Close Drawer Before Logout
            </h2>
            <p className="mt-1 font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
              You have an active drawer session. Please close it before logging out.
            </p>
          </div>
        </div>

        {!showForm ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="h-14 flex-1 rounded-2xl bg-[#F1F5F9] font-['Inter'] text-base font-bold leading-6 text-[#45556C] transition-all hover:bg-[#E2E8F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGoToDrawer}
                className="h-14 flex-1 rounded-2xl bg-[#F97316] font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A] transition-all hover:bg-[#EA580C] active:scale-95"
              >
                Go to Drawer
              </button>
            </div>
            {onCloseAndLogout && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="h-14 rounded-2xl border-2 border-[#EA580C] bg-white font-['Inter'] text-base font-bold leading-6 text-[#EA580C] transition-all hover:bg-[#FFF7ED]"
              >
                Close session and logout
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-['Inter'] text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block font-['Inter'] text-sm font-bold leading-5 text-[#314158]">Actual balance (closing amount)</label>
              <input
                type="text"
                inputMode="decimal"
                value={actualBalance}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "").replace(/^\./, "0.").replace(/(\..*)\./g, "$1").replace(/(\.\d{2})\d+$/, "$1");
                  setActualBalance(v);
                }}
                placeholder="0.00"
                className="mt-1 h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 font-['Inter'] text-base text-[#45556C] outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10"
              />
            </div>
            <div>
              <label className="block font-['Inter'] text-sm font-bold leading-5 text-[#314158]">Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                className="mt-1 h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 font-['Inter'] text-base text-[#1D293D] outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-14 flex-1 rounded-2xl bg-[#F1F5F9] font-['Inter'] text-base font-bold leading-6 text-[#45556C] transition-all hover:bg-[#E2E8F0]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCloseAndLogout}
                disabled={!canSubmit || isSubmitting}
                className="h-14 flex-1 rounded-2xl bg-[#EA580C] font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A] transition-all hover:bg-[#DC4C04] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Closing…" : "Close session and logout"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
