"use client";

import { X } from "lucide-react";
import { toast } from "sonner";
import type { StockItem, Material, Supplier, CreateStockBody } from "@/types/supply";

const SELECT_CLASS =
  "mt-1 h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] pl-3.5 pr-10 font-['Inter'] text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] [background-position:right_1rem_center] [background-repeat:no-repeat] [background-size:12px]";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchIdForNewStock: number;
  branchNameForNewStock: string;
  materials: Material[];
  suppliers: Supplier[];
  initialStock?: StockItem | null;
  onSave: (body: CreateStockBody) => void | Promise<void>;
  isSaving?: boolean;
}

function toDateInputFormat(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  if (dateStr.includes("-")) return dateStr.slice(0, 10);
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    const month = m.padStart(2, "0");
    const day = d.padStart(2, "0");
    return `${y}-${month}-${day}`;
  }
  return "";
}

export default function AddStockModal({
  isOpen,
  onClose,
  branchIdForNewStock,
  branchNameForNewStock,
  materials,
  suppliers,
  initialStock,
  onSave,
  isSaving = false,
}: AddStockModalProps) {
  const isEditing = !!initialStock;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[560px] overflow-hidden rounded-[32px] bg-white px-8 pb-8 pt-7 shadow-2xl"
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

        <div className="mb-6">
          <h2 className="font-['Inter'] text-[20px] font-bold leading-7 text-[#1D293D]">
            {isEditing ? "Edit Stock" : "Add New Stock"}
          </h2>
          <p className="mt-1 font-['Inter'] text-sm leading-5 text-[#90A1B9]">
            {isEditing ? "Update stock entry" : `Add stock entry for ${branchNameForNewStock}`}
          </p>
        </div>

        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);

            const materialIdRaw = (formData.get("materialId") as string)?.trim();
            const supplierIdRaw = (formData.get("supplierId") as string)?.trim();
            const quantityValueRaw = (formData.get("quantityValue") as string)?.trim();
            const batchNo = (formData.get("batchNo") as string)?.trim() || undefined;
            const expiryDate = (formData.get("expiryDate") as string)?.trim() || undefined;

            if (!materialIdRaw || !supplierIdRaw || quantityValueRaw === "") {
              toast.error("Please fill in Material, Supplier and Quantity.");
              return;
            }

            const branchId = isEditing ? initialStock!.branchId : branchIdForNewStock;
            const materialId = Number(materialIdRaw);
            const supplierId = Number(supplierIdRaw);
            const quantityValue = Number(quantityValueRaw);

            if (Number.isNaN(materialId) || Number.isNaN(supplierId) || Number.isNaN(quantityValue) || quantityValue < 0) {
              toast.error("Invalid material, supplier or quantity.");
              return;
            }

            const body: CreateStockBody = {
              branchId,
              materialId,
              supplierId,
              quantityValue,
              ...(batchNo && { batchNo }),
              ...(expiryDate && { expiryDate }),
            };
            await onSave(body);
            onClose();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Material */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                MATERIAL<span className="text-[#EC003F]"> *</span>
              </label>
              <select name="materialId" className={SELECT_CLASS} defaultValue={initialStock?.materialId ?? ""} required>
                <option value="" disabled>
                  Select material
                </option>
                {materials.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                SUPPLIER<span className="text-[#EC003F]"> *</span>
              </label>
              <select name="supplierId" className={SELECT_CLASS} defaultValue={initialStock?.supplierId ?? ""} required>
                <option value="" disabled>
                  Select supplier
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                QUANTITY<span className="text-[#EC003F]"> *</span>
              </label>
              <input
                name="quantityValue"
                type="number"
                min={0}
                step="any"
                defaultValue={initialStock?.quantityValue ?? 0}
                className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                required
              />
            </div>

            {/* Expiry date */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                EXPIRY DATE
              </label>
              <input
                name="expiryDate"
                type="date"
                defaultValue={toDateInputFormat(initialStock?.expiryDate ?? null)}
                className="mt-1 h-10 w-full cursor-pointer rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60"
              />
            </div>

            {/* Batch number */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                BATCH NUMBER
              </label>
              <input
                name="batchNo"
                type="text"
                placeholder="Enter batch number"
                defaultValue={initialStock?.batchNo ?? ""}
                className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>
          </div>

          <div className="mt-6 flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 flex-1 items-center justify-center rounded-[16px] border border-[#E2E8F0] bg-white p-2.5 font-['Inter'] text-base font-bold leading-6 text-[#45556C] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex h-11 flex-1 items-center justify-center rounded-[16px] bg-[#EA580C] p-2.5 font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_8px_10px_-6px_#EA580C33,0px_20px_25px_-5px_#EA580C33] hover:bg-[#DC4C04] disabled:opacity-70"
            >
              {isEditing ? (isSaving ? "Saving..." : "Save changes") : isSaving ? "Adding..." : "Add stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

