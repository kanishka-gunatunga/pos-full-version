"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { StockItem } from "@/types/supply";

interface ExportStocksModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks?: StockItem[];
  onExport?: () => void;
}

const STATUS_OPTIONS: { label: string; status: "available" | "low" | "out" | "expired" }[] = [
  { label: "Available", status: "available" },
  { label: "Low Stock", status: "low" },
  { label: "Out of Stock", status: "out" },
  { label: "Expired", status: "expired" },
];

export default function ExportStocksModal({ isOpen, onClose, stocks = [], onExport }: ExportStocksModalProps) {
  const [selected, setSelected] = useState<string[]>(["Available"]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_OPTIONS.forEach(({ status }) => {
      counts[status] = stocks.filter((s) => s.status === status).length;
    });
    return counts;
  }, [stocks]);

  if (!isOpen) return null;

  const toggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] overflow-hidden rounded-[32px] bg-white px-8 pb-8 pt-7 shadow-2xl"
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

        <div className="mb-4">
          <h2 className="font-['Inter'] text-[20px] font-bold leading-7 text-[#1D293D]">
            Export Stocks to Excel
          </h2>
          <p className="mt-1 font-['Inter'] text-sm leading-5 text-[#90A1B9]">
            Select stock statuses to export for Maharagama
          </p>
        </div>

        <div className="space-y-3">
          {STATUS_OPTIONS.map(({ label, status }) => {
            const checked = selected.includes(label);
            const count = statusCounts[status] ?? 0;
            return (
              <div
                key={label}
                className="flex items-center justify-between rounded-[10px] px-1 py-1.5"
              >
                <label className="flex cursor-pointer items-center gap-3 font-['Inter'] text-sm font-medium leading-[14px] text-[#0A0A0A]">
                  <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(label)}
                      className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <span
                      className={`absolute inset-0 rounded-[4px] border p-[1px] shadow-[0px_1px_2px_0px_#0000000D] transition-colors ${
                        checked
                          ? "border-[#EA580C] bg-[#EA580C]"
                          : "border-[#E2E8F0] bg-white"
                      }`}
                    />
                    <svg
                      className={`pointer-events-none relative h-2.5 w-2.5 text-white transition-opacity ${
                        checked ? "opacity-100" : "opacity-0"
                      }`}
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 6l3 3 5-6" />
                    </svg>
                  </span>
                  <span>{label}</span>
                </label>
                <span className="inline-flex h-[22px] min-w-[23px] items-center justify-center gap-1 rounded-[8px] border border-[#0000001A] px-2 py-0.5 font-['Inter'] text-xs font-medium leading-4 text-[#0A0A0A]">
                  {count}
                </span>
              </div>
            );
          })}
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
            type="button"
            onClick={() => {
              onExport?.();
              onClose();
            }}
            className="flex h-11 flex-1 items-center justify-center rounded-[16px] bg-[#EA580C] p-2.5 font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_8px_10px_-6px_#EA580C33,0px_20px_25px_-5px_#EA580C33] hover:bg-[#DC4C04]"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

