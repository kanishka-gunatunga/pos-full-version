"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import type { IssuedVoucherRow } from "@/domains/vouchers/types";

type EditIssuedVoucherValidityModalProps = {
  isOpen: boolean;
  voucher: IssuedVoucherRow | null;
  onClose: () => void;
  onSave: (voucherId: string, nextMonths: 6 | 12) => void;
};

function getValidityMonths(label: string): 6 | 12 {
  return label.toLowerCase().includes("12") ? 12 : 6;
}

export default function EditIssuedVoucherValidityModal({
  isOpen,
  voucher,
  onClose,
  onSave,
}: EditIssuedVoucherValidityModalProps) {
  const currentMonths = getValidityMonths(voucher?.validityLabel ?? "6 months");
  const [selectedMonths, setSelectedMonths] = useState<6 | 12>(currentMonths);

  if (!isOpen || !voucher) return null;

  const cannotDowngrade = currentMonths === 12;
  const hasChanges = selectedMonths !== currentMonths;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-issued-voucher-title"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 pb-4 pt-6">
          <div className="min-w-0 pr-6">
            <h2
              id="edit-issued-voucher-title"
              className="font-['Inter'] text-[22px] font-bold leading-7 text-[#1D293D]"
            >
              Edit Voucher Validity
            </h2>
            <p className="mt-1 font-['Inter'] text-[14px] leading-5 text-[#62748E]">
              Voucher: {voucher.code}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#90A1B9] transition-colors hover:bg-[#F1F5F9] hover:text-[#45556C]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="font-['Inter'] text-[13px] font-medium text-[#62748E]">
            Validity can only be extended from 6 months to 12 months.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMonths(6)}
              disabled={cannotDowngrade}
              className={`rounded-[14px] border-2 py-3 font-['Inter'] text-[14px] font-bold transition-colors ${
                selectedMonths === 6
                  ? "border-primary bg-primary-muted text-primary"
                  : "border-[#E2E8F0] bg-white text-[#314158]"
              } ${cannotDowngrade ? "cursor-not-allowed opacity-50" : "hover:bg-[#F8FAFC]"}`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setSelectedMonths(12)}
              className={`rounded-[14px] border-2 py-3 font-['Inter'] text-[14px] font-bold transition-colors ${
                selectedMonths === 12
                  ? "border-primary bg-primary-muted text-primary"
                  : "border-[#E2E8F0] bg-white text-[#314158] hover:bg-[#F8FAFC]"
              }`}
            >
              12 Months
            </button>
          </div>
          {cannotDowngrade && (
            <p className="font-['Inter'] text-[12px] leading-4 text-[#90A1B9]">
              This voucher is already at 12 months and cannot be reduced.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-[14px] border-2 border-[#E2E8F0] px-5 font-['Inter'] text-[14px] font-bold text-[#314158] transition-colors hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasChanges}
            onClick={() => {
              onSave(voucher.id, selectedMonths);
              onClose();
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-primary px-5 font-['Inter'] text-[14px] font-bold text-white shadow-primary transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
