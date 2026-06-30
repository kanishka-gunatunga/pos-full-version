"use client";

import { useState, useEffect } from "react";
import { X, Percent, Banknote } from "lucide-react";
import type { ManualDiscount } from "@/contexts/OrderContext";

type Props = {
  onSave: (discount: ManualDiscount | null) => void;
  onClose: () => void;
  initialDiscount?: ManualDiscount | null;
  subtotal: number;
};

export default function ManualDiscountModal({
  onSave,
  onClose,
  initialDiscount,
  subtotal,
}: Props) {
  const [value, setValue] = useState<string>(
    initialDiscount ? String(initialDiscount.value) : ""
  );
  const [type, setType] = useState<"percentage" | "amount">(
    initialDiscount?.type ?? "percentage"
  );

  const discountValue = parseFloat(value) || 0;
  const calculatedDiscount =
    type === "percentage" ? (subtotal * discountValue) / 100 : discountValue;
  const finalTotal = Math.max(0, subtotal - calculatedDiscount);

  const handleSave = () => {
    if (!value || discountValue <= 0) {
      onSave(null);
    } else {
      onSave({
        value: discountValue,
        type,
      });
    }
    onClose();
  };

  const labelClass = "font-['Arial'] text-sm leading-5 text-[#62748E]";
  const inputClass =
    "w-full rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] py-3 px-4 font-['Arial'] text-base leading-[100%] text-[#0A0A0A] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]/20";

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[16px] border border-[#F1F5F9] bg-white px-8 py-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[#90A1B9] transition-colors hover:bg-[#F1F5F9] hover:text-[#45556C]"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-['Arial'] text-2xl font-bold leading-8 text-[#1D293D]">
          Manual Discount
        </h2>

        <div className="mt-6">
          <label className={labelClass}>Discount Type</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("percentage")}
              className={`flex items-center justify-center gap-2 rounded-[14px] border py-3 transition-all duration-300 ${
                type === "percentage"
                  ? "border-[#EA580C] bg-[#EA580C0D] text-[#EA580C]"
                  : "border-[#E2E8F0] bg-white text-[#62748E] hover:bg-zinc-50"
              }`}
            >
              <Percent className="h-4 w-4" />
              <span className="font-['Arial'] text-sm font-bold">Percentage</span>
            </button>
            <button
              type="button"
              onClick={() => setType("amount")}
              className={`flex items-center justify-center gap-2 rounded-[14px] border py-3 transition-all duration-300 ${
                type === "amount"
                  ? "border-[#EA580C] bg-[#EA580C0D] text-[#EA580C]"
                  : "border-[#E2E8F0] bg-white text-[#62748E] hover:bg-zinc-50"
              }`}
            >
              <Banknote className="h-4 w-4" />
              <span className="font-['Arial'] text-sm font-bold">Amount</span>
            </button>
          </div>
        </div>

        <div className="mt-6">
          <label className={labelClass}>
            {type === "percentage" ? "Discount Percentage (%)" : "Discount Amount (Rs.)"}
          </label>
          <div className="relative mt-1.5">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percentage" ? "e.g. 10" : "e.g. 500"}
              className={inputClass}
              autoFocus
            />
          </div>
        </div>

        <div className="mt-8 space-y-3 rounded-[14px] bg-[#F8FAFC] p-4">
          <div className="flex justify-between font-['Arial'] text-sm leading-5 text-[#62748E]">
            <span>Current Subtotal</span>
            <span>Rs.{subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between font-['Arial'] text-sm font-bold leading-5 text-[#EA580C]">
            <span>Discount Amount</span>
            <span>- Rs.{calculatedDiscount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between border-t border-[#E2E8F0] pt-2 font-['Arial'] text-base font-bold leading-6 text-[#1D293D]">
            <span>New Total</span>
            <span>Rs.{finalTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[14px] border border-[#E2E8F0] bg-white py-3 font-['Arial'] text-base font-bold leading-6 text-[#62748E] hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-[14px] bg-[#EA580C] py-3 font-['Arial'] text-base font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#EA580C4D,0px_10px_15px_-3px_#EA580C4D] hover:bg-[#DC4C04]"
          >
            Apply Discount
          </button>
        </div>
      </div>
    </div>
  );
}
