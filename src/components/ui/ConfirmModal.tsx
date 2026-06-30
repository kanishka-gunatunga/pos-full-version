"use client";

import { X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: Props) {
  if (!isOpen) return null;

  const isDanger = variant === "danger";

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
          <h2 className="font-['Inter'] text-[20px] font-bold leading-[28px] text-[#1D293D]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-[#90A1B9] transition-colors hover:bg-[#F1F5F9] hover:text-[#45556C]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 font-['Inter'] text-sm leading-[22px] text-[#62748E]">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[16px] bg-[#F1F5F9] px-4 py-3 text-center font-['Inter'] text-base font-bold leading-6 text-[#45556C] transition-colors hover:bg-[#E2E8F0]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-[16px] px-4 py-3 text-center font-['Inter'] text-base font-bold leading-6 text-white transition-opacity hover:opacity-90 ${
              isDanger
                ? "bg-[#FF2056] shadow-[0px_4px_6px_-4px_#FFCCD3,0px_10px_15px_-3px_#FFCCD3]"
                : "bg-[#EA580C] shadow-[0px_4px_6px_-4px_#EA580C4D,0px_10px_15px_-3px_#EA580C4D]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
