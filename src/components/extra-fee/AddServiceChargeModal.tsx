"use client";

import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type { BranchOption, ServiceChargeItem } from "@/domains/extra-fee/types";

type Props = {
  isOpen: boolean;
  branches: BranchOption[];
  initialCharge?: ServiceChargeItem | null;
  onClose: () => void;
  onSubmit: (payload: { branchId: number; percentage: number; chargeId?: number }) => void;
};

export default function AddServiceChargeModal({
  isOpen,
  branches,
  initialCharge = null,
  onClose,
  onSubmit,
}: Props) {
  const isEdit = !!initialCharge;
  const [branchId, setBranchId] = useState<string>(initialCharge ? String(initialCharge.branchId) : "");
  const [percentage, setPercentage] = useState(initialCharge ? String(initialCharge.rate) : "10.00");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const parsedBranchId = Number(branchId);
    const parsedPercentage = Number(percentage);
    return (
      Number.isFinite(parsedBranchId) &&
      parsedBranchId > 0 &&
      Number.isFinite(parsedPercentage) &&
      parsedPercentage >= 0 &&
      parsedPercentage <= 100
    );
  }, [branchId, percentage]);

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
            {isEdit ? "Edit Service Charge" : "Add Service Charge"}
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
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="h-[49px] w-full appearance-none rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 pr-11 font-['Inter'] text-base font-normal leading-[100%] tracking-[0px] text-[#0A0A0A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={String(branch.id)}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0A0A0A]" />
            </div>
          </div>

          <div>
            <label className="font-['Inter'] text-xs font-bold uppercase leading-4 tracking-[0px] text-[#90A1B9]">
              Percentage (%) <span className="text-[#EC003F]">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="10.00%"
              className="mt-2 h-[49px] w-full rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 font-['Inter'] text-base font-normal leading-[100%] tracking-[0px] text-[#0A0A0A] placeholder:text-[#0A0A0A80] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
            />
          </div>
        </div>

        <div className="mt-6 rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
          <p className="font-['Inter'] text-sm leading-5 text-[#2563EB]">
            <span className="font-bold">Note:</span> This percentage is used by POS to calculate the service
            charge amount when placing orders for this branch.
          </p>
        </div>

        {error && <p className="mt-4 font-['Inter'] text-sm text-[#EC003F]">{error}</p>}

        <div className="mt-6 grid grid-cols-2 gap-3">
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
              const parsedBranchId = Number(branchId);
              const parsedPercentage = Number(percentage);
              if (
                !Number.isFinite(parsedBranchId) ||
                parsedBranchId <= 0 ||
                !Number.isFinite(parsedPercentage) ||
                parsedPercentage < 0 ||
                parsedPercentage > 100
              ) {
                setError("Please select a branch and enter a valid percentage between 0 and 100.");
                return;
              }
              onSubmit({
                branchId: parsedBranchId,
                percentage: parsedPercentage,
                chargeId: initialCharge?.id,
              });
              onClose();
            }}
            className="rounded-[14px] bg-[#EA580C] px-4 py-[13px] text-center font-['Inter'] text-base font-bold leading-6 tracking-[0px] text-white shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A] transition-colors hover:bg-[#DC4C04] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEdit ? "Save Charge" : "Add Charge"}
          </button>
        </div>
      </div>
    </div>
  );
}
