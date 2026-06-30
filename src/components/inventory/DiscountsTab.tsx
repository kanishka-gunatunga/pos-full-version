"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Pencil, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useGetAllDiscounts, useActivateDiscount, useDeactivateDiscount } from "@/hooks/useDiscount";
import { useGetAllBranches } from "@/hooks/useBranch";
import { Discount, DiscountItem } from "@/types/product";
import AddDiscountModal from "./AddDiscountModal";

function DiscountCard({ offer, onEdit }: { offer: Discount; onEdit: (offer: Discount) => void }) {
  const { data: branches } = useGetAllBranches("active");
  const activateMutation = useActivateDiscount();
  const deactivateMutation = useDeactivateDiscount();

  const handleToggleActive = async () => {
    try {
      if (offer.status === "active") {
        await deactivateMutation.mutateAsync(offer.id);
        toast.success("Discount deactivated successfully");
      } else {
        await activateMutation.mutateAsync(offer.id);
        toast.success("Discount activated successfully");
      }
    } catch (err: any) {
      console.error("Failed to toggle discount status:", err);
      toast.error(err?.response?.data?.message || "Failed to change discount status");
    }
  };

  const isToggling = activateMutation.isPending || deactivateMutation.isPending;
  const isActive = offer.status === "active";

  const productCount = offer.items?.reduce((acc, item) => {
    if (item.productId) acc.add(item.productId);
    return acc;
  }, new Set()).size || 0;

  const variantCount = offer.items?.length || 0;

  // Group items by branch
  const groupedItems = offer.items?.reduce((acc: Record<string, DiscountItem[]>, item) => {
    const key = item.branchId ? item.branchId.toString() : "all";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {}) || {};

  return (
    <div className={`rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC] p-6 shadow-sm transition-opacity ${!isActive ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h3 className="font-['Inter'] text-[18px] font-bold leading-[28px] tracking-normal text-[#1D293D]">
              {offer.name}
            </h3>
            <span
              className={`rounded-[10px] px-2 py-1 font-['Inter'] text-xs font-bold leading-4 ${isActive ? "bg-[#D0FAE5] text-[#009966]" : "bg-[#F1F5F9] text-[#64748B]"
                }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-2 font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
            {productCount} product(s) • {variantCount} variant(s) with discounts
          </p>
        </div>
        <div className="flex items-center">
          <button 
            onClick={handleToggleActive}
            disabled={isToggling}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            isActive 
              ? "bg-[#F1F5F9] text-[#314158] hover:bg-[#E2E8F0]" 
              : "bg-[#EA580C] text-white hover:bg-[#c2410c]"
          }`}>
            {isToggling && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            onClick={() => onEdit(offer)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#64748B]"
            aria-label="Edit"
          >
            <Pencil className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {Object.entries(groupedItems).map(([branchKey, items]) => {
          const branchId = branchKey === "all" ? null : parseInt(branchKey);
          const branch = branchId ? branches?.find(b => b.id === branchId) : null;
          
          return (
            <div key={branchKey} className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#EA580C]" />
                <p className="font-['Inter'] text-sm font-bold text-[#45556C]">
                  {branch ? branch.name : "All Branches"}
                </p>
                <div className="h-px flex-1 bg-[#E2E8F0]"></div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-1 rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm hover:border-[#EA580C]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-['Inter'] text-sm font-bold text-[#1D293D] leading-tight">
                        {item.product?.name || "Product"}
                        {item.variationOption?.name && (
                          <span className="block text-[11px] font-normal text-[#90A1B9] mt-0.5">
                            {item.variationOption.name}
                          </span>
                        )}
                      </p>
                      <span className="rounded-lg bg-[#EA580C]/10 px-2 py-1 font-['Inter'] text-[10px] font-bold text-[#EA580C] whitespace-nowrap">
                        {item.discountType === "percentage" ? `${item.discountValue}% OFF` : `Rs.${item.discountValue} OFF`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DiscountsTabProps {
  onEdit: (discount: Discount) => void;
  onAdd?: () => void;
}

export default function DiscountsTab({ onEdit, onAdd }: DiscountsTabProps) {
  const { data: discounts, isLoading } = useGetAllDiscounts({ status: "all" });
  const handleEdit = (offer: Discount) => {
    onEdit(offer);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#EA580C]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-['Inter'] text-[16px] font-bold leading-6 text-[#314158]">
          Discount Products
        </h2>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-[14px] bg-[#EA580C] px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] transition-opacity hover:bg-[#c2410c]"
            style={{ transitionDuration: "300ms", transitionTimingFunction: "ease-out" }}
          >
            <Plus className="h-4 w-4" />
            Add Discount
          </button>
        )}
      </div>
      {discounts && discounts.length > 0 ? (
        <div className="space-y-4">
          {discounts.map((offer) => (
            <DiscountCard key={offer.id} offer={offer} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center">
          <Tag className="mx-auto h-12 w-12 text-[#90A1B9]" />
          <p className="mt-3 font-['Inter'] text-sm text-[#62748E]">
            No discounts configured yet. Add discounts to apply to products or orders.
          </p>
        </div>
      )}

    </div>
  );
}
