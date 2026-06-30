"use client";

import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type { BranchOption, DeliveryFeeItem } from "@/domains/extra-fee/types";

type DeliveryFeeFormValue = {
  branchId: number;
  feeName: string;
  price: string;
};

type Props = {
  isOpen: boolean;
  branches: BranchOption[];
  editingFee: DeliveryFeeItem | null;
  onClose: () => void;
  onSubmit: (payload: { branchId: number; feeName: string; price: number }) => void;
};

function toInitialValue(
  branches: BranchOption[],
  editingFee: DeliveryFeeItem | null
): DeliveryFeeFormValue {
  if (editingFee) {
    return {
      branchId: editingFee.branchId,
      feeName: editingFee.zoneName,
      price: String(editingFee.price),
    };
  }
  return {
    branchId: branches[0]?.id ?? 0,
    feeName: "",
    price: "",
  };
}

export default function AddDeliveryFeeModal({
  isOpen,
  branches,
  editingFee,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<DeliveryFeeFormValue>(() => toInitialValue(branches, editingFee));
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editingFee;
  const canSubmit = useMemo(() => {
    if (!form.branchId) return false;
    if (!form.feeName.trim()) return false;
    const parsed = Number(form.price);
    return Number.isFinite(parsed) && parsed > 0;
  }, [form]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[448px] rounded-[24px] bg-white px-8 pt-8 pb-8 shadow-[0px_25px_50px_-12px_#00000040]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-['Inter'] text-[20px] font-bold leading-7 tracking-[0px] text-[#1D293D]">
            {isEdit ? "Edit Delivery Fee" : "Add Delivery Fee"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#90A1B9] transition-colors hover:bg-[#F1F5F9] hover:text-[#45556C]"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-7 space-y-4">
          <div>
            <label className="font-['Inter'] text-xs font-bold uppercase leading-4 tracking-[0px] text-[#90A1B9]">
              Branch <span className="text-[#EC003F]">*</span>
            </label>
            <div className="relative mt-2">
              <select
                value={form.branchId ? String(form.branchId) : ""}
                onChange={(e) => setForm((prev) => ({ ...prev, branchId: Number(e.target.value) }))}
                className="h-[49px] w-full appearance-none rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 pr-11 font-['Inter'] text-base font-normal leading-[100%] tracking-[0px] text-[#0A0A0A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              >
                {branches.length === 0 && <option value="">No branches available</option>}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0A0A0A]" />
            </div>
          </div>

          <div>
            <label className="font-['Inter'] text-xs font-bold uppercase leading-4 tracking-[0px] text-[#90A1B9]">
              Fee Name <span className="text-[#EC003F]">*</span>
            </label>
            <input
              type="text"
              value={form.feeName}
              onChange={(e) => setForm((prev) => ({ ...prev, feeName: e.target.value }))}
              placeholder="e.g. City Center Zone"
              className="mt-2 h-[49px] w-full rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 font-['Inter'] text-base font-normal leading-[100%] tracking-[0px] text-[#0A0A0A] placeholder:text-[#0A0A0A80] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
            />
          </div>

          <div>
            <label className="font-['Inter'] text-xs font-bold uppercase leading-4 tracking-[0px] text-[#90A1B9]">
              Price (Rs) <span className="text-[#EC003F]">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
              className="mt-2 h-[49px] w-full rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 font-['Inter'] text-base font-normal leading-[100%] tracking-[0px] text-[#0A0A0A] placeholder:text-[#0A0A0A80] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
            />
          </div>
        </div>

        {error && <p className="mt-4 font-['Inter'] text-sm text-[#EC003F]">{error}</p>}

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-[13px] text-center font-['Inter'] text-base font-bold leading-6 tracking-[0px] text-[#45556C] transition-colors hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              const feeName = form.feeName.trim();
              const price = Number(form.price);
              if (!form.branchId || !feeName || !Number.isFinite(price) || price <= 0) {
                setError("Please fill all required fields with valid values.");
                return;
              }
              onSubmit({ branchId: form.branchId, feeName, price });
              onClose();
            }}
            className="rounded-[14px] bg-[#EA580C] px-4 py-[13px] text-center font-['Inter'] text-base font-bold leading-6 tracking-[0px] text-white shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A] transition-colors hover:bg-[#DC4C04] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEdit ? "Save Fee" : "Add Fee"}
          </button>
        </div>
      </div>
    </div>
  );
}
