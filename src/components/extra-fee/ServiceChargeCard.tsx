"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatAddedOn } from "@/domains/extra-fee/mockData";
import type { ServiceChargeItem } from "@/domains/extra-fee/types";

type Props = {
  item: ServiceChargeItem;
  onEdit: (item: ServiceChargeItem) => void;
  onDelete: (item: ServiceChargeItem) => void;
};

export default function ServiceChargeCard({ item, onEdit, onDelete }: Props) {
  return (
    <article className="rounded-[14px] border border-[#F1F5F9] bg-white p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#ECFDF3]">
          <span className="font-['Inter'] text-2xl font-bold leading-none text-[#039855]">%</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg p-2 text-[#3B82F6] transition-colors hover:bg-[#EFF6FF]"
            aria-label={`Edit ${item.title}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="rounded-lg p-2 text-[#FB2C36] transition-colors hover:bg-[#FEF2F2]"
            aria-label={`Delete ${item.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <h3 className="mt-4 font-['Inter'] text-2xl font-bold leading-7 text-[#1D293D]">{item.title}</h3>
      <p className="mt-1 font-['Inter'] text-sm leading-5 text-[#62748E]">{item.location}</p>
      <div className="mt-4 rounded-[12px] border border-[#B2F5EA] bg-[#ECFDF3] px-3 py-2">
        <p className="font-['Inter'] text-3xl font-bold leading-8 text-[#039855]">{item.rate}%</p>
        <p className="font-['Inter'] text-xs tracking-[0.04em] text-[#039855] mt-1">
          Service Charge Rate
        </p>
      </div>
      <p className="mt-6 font-['Inter'] text-xs leading-5 text-[#90A1B9]">{formatAddedOn(item.addedOn)}</p>
    </article>
  );
}
