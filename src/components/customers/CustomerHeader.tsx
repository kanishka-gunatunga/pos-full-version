"use client";

import { Search, UserPlus, Megaphone, Percent } from "lucide-react";

interface CustomerHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onSendPromotionClick: () => void;
  onDiscountClick: () => void;
}

export default function CustomerHeader({
  searchTerm,
  onSearchChange,
  onAddClick,
  onSendPromotionClick,
  onDiscountClick,
}: CustomerHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-[24px] font-bold text-[#1D293D]">Customer Database</h1>
        <p className="mt-1 text-[14px] text-[#62748E]">
          Directory of registered customers and their contact details.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:min-w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
          <input
            type="text"
            placeholder="Search by name or status..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 w-full text-[#1D293D] rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-4 text-[14px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button
          onClick={onSendPromotionClick}
          className="flex h-11 items-center gap-2 rounded-xl bg-white border border-[#E2E8F0] text-[#1D293D] cursor-pointer px-5 text-[14px] font-bold shadow-sm transition-all hover:bg-[#F8FAFC] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Megaphone className="h-4 w-4" />
          Send Promotion
        </button>
        <button
          onClick={onDiscountClick}
          className="flex h-11 items-center gap-2 rounded-xl bg-white border border-[#E2E8F0] text-[#1D293D] cursor-pointer px-5 text-[14px] font-bold shadow-sm transition-all hover:bg-[#F8FAFC] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Percent className="h-4 w-4" />
          Discounts
        </button>
        <button
          onClick={onAddClick}
          className="flex h-11 items-center gap-2 rounded-xl bg-[#EA580C] cursor-pointer px-5 text-[14px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          New Customer
        </button>
      </div>
    </div>
  );
}
