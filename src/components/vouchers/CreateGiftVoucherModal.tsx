"use client";

import { useEffect, useState } from "react";
import { X, ImageIcon, Save } from "lucide-react";
import { toast } from "sonner";
import type { CreatedVoucherTemplate } from "@/domains/vouchers/types";

export type CreateGiftVoucherPayload = {
  valueFormatted: string;
  validityMonths: 6 | 12;
  imageFile: File | null;
};

/** When `templateId` is set, parent should update an existing row; otherwise create. */
export type GiftVoucherSavePayload = CreateGiftVoucherPayload & {
  templateId?: string;
};

type CreateGiftVoucherModalProps = {
  open: boolean;
  onClose: () => void;
  /** When set, modal opens in edit mode with fields prefilled. */
  editingTemplate: CreatedVoucherTemplate | null;
  onSave: (data: GiftVoucherSavePayload) => void;
};

function formatVoucherValue(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const hasPrefix = /^rs\.?\s*/i.test(trimmed);
  const numeric = trimmed.replace(/[^\d.]/g, "");
  const num = parseFloat(numeric);
  if (!Number.isNaN(num) && numeric !== "") {
    const formatted = `Rs. ${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    return formatted;
  }
  return hasPrefix ? trimmed : `Rs. ${trimmed}`;
}

function initialValidityMonths(t: CreatedVoucherTemplate | null): 6 | 12 {
  if (!t) return 6;
  return t.validityLabel.toLowerCase().includes("12") ? 12 : 6;
}

export default function CreateGiftVoucherModal({
  open,
  onClose,
  editingTemplate,
  onSave,
}: CreateGiftVoucherModalProps) {
  const [value, setValue] = useState(() => editingTemplate?.valueFormatted ?? "");
  const [validityMonths, setValidityMonths] = useState<6 | 12>(() =>
    initialValidityMonths(editingTemplate)
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    () => editingTemplate?.imageUrl ?? null
  );

  const isEdit = editingTemplate !== null;

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setImageFile(f);
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      if (f) return URL.createObjectURL(f);
      return editingTemplate?.imageUrl ?? null;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Enter a voucher value");
      return;
    }
    const numeric = trimmed.replace(/[^\d.]/g, "");
    const num = parseFloat(numeric);
    if (numeric === "" || Number.isNaN(num)) {
      toast.error("Enter a valid voucher amount");
      return;
    }
    const valueFormatted = formatVoucherValue(trimmed);
    onSave({
      valueFormatted,
      validityMonths,
      imageFile,
      ...(editingTemplate ? { templateId: editingTemplate.id } : {}),
    });
    toast.success(isEdit ? "Gift voucher updated" : "Gift voucher created");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-voucher-modal-title"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 pb-4 pt-6">
          <div className="min-w-0 pr-8">
            <h2
              id="gift-voucher-modal-title"
              className="font-['Inter'] text-xl font-bold leading-7 text-[#1E293B]"
            >
              {isEdit ? "Edit Gift Voucher" : "Create Gift Voucher"}
            </h2>
            <p className="mt-1 font-['Inter'] text-sm leading-5 text-[#64748B]">
              {isEdit
                ? "Update voucher value, image and validity"
                : "Set voucher value, quantity and validity"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#1E293B]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="scrollbar-subtle flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <label
                htmlFor="voucher-value"
                className="block font-['Inter'] text-sm font-bold text-[#1E293B]"
              >
                Voucher Value
              </label>
              <input
                id="voucher-value"
                type="text"
                value={value}
                onChange={(ev) => setValue(ev.target.value)}
                placeholder="Rs. 2000.00"
                autoComplete="off"
                className="h-11 w-full rounded-[14px] border-2 border-[#E2E8F0] bg-white px-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#94A3B8] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="space-y-2">
              <span className="block font-['Inter'] text-sm font-bold text-[#1E293B]">Image</span>
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative flex h-[52px] min-w-0 w-full flex-1 cursor-pointer items-center gap-2 overflow-hidden rounded-[14px] border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 box-border transition-colors hover:border-[#CBD5E1] sm:w-auto">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={handleFileChange}
                  />
                  <span
                    title={
                      imageFile
                        ? imageFile.name
                        : isEdit && previewUrl && !imageFile
                          ? "Current image"
                          : undefined
                    }
                    className={`min-w-0 flex-1 truncate font-['Inter'] text-sm leading-5 ${
                      imageFile || (isEdit && previewUrl)
                        ? "text-[#334155]"
                        : "text-[#94A3B8]"
                    }`}
                  >
                    {imageFile
                      ? imageFile.name
                      : isEdit && previewUrl
                        ? "Current image — choose file to replace"
                        : "Attach Image here"}
                  </span>
                  <ImageIcon className="h-5 w-5 shrink-0 text-[#64748B]" aria-hidden />
                </label>
                <div className="relative h-[52px] w-24 shrink-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#FFF7ED]">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-1 text-center font-['Inter'] text-[10px] leading-tight text-[#94A3B8]">
                      Preview
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block font-['Inter'] text-sm font-bold text-[#1E293B]">
                Validity Period
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValidityMonths(6)}
                  className={`rounded-[14px] border-2 py-3 font-['Inter'] text-sm font-bold transition-colors ${
                    validityMonths === 6
                      ? "border-primary bg-primary-muted text-primary"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  6 Months
                </button>
                <button
                  type="button"
                  onClick={() => setValidityMonths(12)}
                  className={`rounded-[14px] border-2 py-3 font-['Inter'] text-sm font-bold transition-colors ${
                    validityMonths === 12
                      ? "border-primary bg-primary-muted text-primary"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                  }`}
                >
                  12 Months
                </button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-[#E2E8F0] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 min-w-[100px] rounded-[14px] border-2 border-[#E2E8F0] bg-white font-['Inter'] text-sm font-bold text-[#314158] transition-colors hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-[14px] bg-primary px-4 font-['Inter'] text-sm font-bold text-white shadow-primary transition-opacity hover:opacity-95"
            >
              <Save className="h-4 w-4" aria-hidden />
              {isEdit ? "Save changes" : "Create Voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
