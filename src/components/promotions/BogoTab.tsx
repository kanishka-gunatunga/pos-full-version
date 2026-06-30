"use client";

import { 
  Gift, 
  Pencil, 
  Trash2, 
  MapPin, 
  Calendar,
  Plus as PlusIcon,
  Package,
  Loader2
} from "lucide-react";
import { useGetAllBogoPromotions, useActivateBogoPromotion, useDeactivateBogoPromotion } from "@/hooks/useBogoPromotion";
import { BogoPromotion } from "@/types/bogoPromotion";
import { toast } from "sonner";

function BogoCard({ offer, onEdit }: { offer: BogoPromotion; onEdit?: (bogo: BogoPromotion) => void }) {
  const isActive = offer.status === "active";
  
  const { mutate: activate, isPending: isActivating } = useActivateBogoPromotion();
  const { mutate: deactivate, isPending: isDeactivating } = useDeactivateBogoPromotion();

  const handleToggleStatus = () => {
    if (isActive) {
      deactivate(offer.id, {
        onSuccess: () => toast.success("Promotion deactivated!"),
        onError: () => toast.error("Failed to deactivate promotion"),
      });
    } else {
      activate(offer.id, {
        onSuccess: () => toast.success("Promotion activated!"),
        onError: () => toast.error("Failed to activate promotion"),
      });
    }
  };

  const branchNames = offer.branches && offer.branches.length > 0
    ? offer.branches.map(b => b.branch?.name).join(", ")
    : "All Branches";

  return (
    <div className={`flex flex-col rounded-[16px] bg-white p-6 pb-0 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] transition-all ${!isActive ? "opacity-75" : ""}`}>
      {/* Top Section */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Main Gift Icon */}
          <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#FDF2F8]">
            <Gift className="h-7 w-7 text-[#E60076]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h3 className="font-['Inter'] text-[18px] font-bold leading-[28px] text-[#1D293D]">
                {offer.name}
              </h3>
              <span className={`flex items-center justify-center rounded-full px-3 py-1 font-['Inter'] text-[12px] font-bold leading-4 ${
                isActive ? "bg-[#D0FAE5] text-[#007A55]" : "bg-[#F1F5F9] text-[#64748B]"
              }`}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-2 flex gap-x-12">
              <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[#45556C]">
                    <Package className="h-3.5 w-3.5" />
                    <span className="font-['Inter'] text-sm font-medium">{offer.buyQuantity}x {offer.buyProduct?.name || "Unknown Product"}</span>
                  </div>
              </div>
              <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[#45556C]">
                    <Package className="h-3.5 w-3.5" />
                    <span className="font-['Inter'] text-sm font-medium">{offer.getQuantity}x {offer.getProduct?.name || "Unknown Product"}</span>
                  </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#45556C]">
                <MapPin className="h-3.5 w-3.5" />
                <span className="font-['Inter'] text-sm font-normal">{branchNames}</span>
              </div>
              {offer.expiryDate && (
                <div className="flex items-center gap-2 text-[#45556C]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="font-['Inter'] text-sm font-normal text-[#45556C]">Expires: {offer.expiryDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleToggleStatus}
            disabled={isActivating || isDeactivating}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            isActive 
              ? "bg-[#F1F5F9] text-[#314158] hover:bg-[#E2E8F0]" 
              : "bg-[#EA580C] text-white hover:bg-[#c2410c]"
          }`}>
            {(isActivating || isDeactivating) && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {isActive ? "Deactivate" : "Activate"}
          </button>
          <button 
            onClick={() => onEdit?.(offer)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-[#155DFC] transition-all hover:bg-[#F1F5F9]"
          >
            <Pencil className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          {/* <button className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-[#EC003F] transition-all hover:bg-[#F1F5F9]">
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
          </button> */}
        </div>
      </div>

      {/* Gradient Summary Bar */}
      <div className="mx-[-1px] rounded-[14px] bg-gradient-to-r from-[#FDF2F8] to-[#FAF5FF] p-4">
        <div className="flex items-center justify-center gap-12">
          <div className="flex flex-col items-center">
            <span className="font-['Inter'] text-[30px] font-bold leading-9 text-[#E60076]">{offer.buyQuantity}</span>
            <span className="font-['Inter'] text-[12px] leading-4 text-[#45556C]">Buy</span>
          </div>
          <div className="flex pt-1">
            <PlusIcon className="h-6 w-6 text-[#90A1B9]" strokeWidth={2} />
          </div>
          <div className="flex flex-col items-center">
            <span className="font-['Inter'] text-[30px] font-bold leading-9 text-[#9810FA]">{offer.getQuantity}</span>
            <span className="font-['Inter'] text-[12px] leading-4 text-[#45556C]">Get Free</span>
          </div>
        </div>
      </div>
      <div className="h-6" /> {/* Bottom spacing */}
    </div>
  );
}

interface BogoTabProps {
  searchQuery?: string;
  onEdit?: (bogo: BogoPromotion) => void;
}

export default function BogoTab({ searchQuery = "", onEdit }: BogoTabProps) {
  const { data: bogoPromotions, isLoading, isError } = useGetAllBogoPromotions("all");

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#94A3B8]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-['Inter'] text-sm text-[#EC003F]">Failed to load BOGO promotions.</p>
      </div>
    );
  }

  const filteredData = (bogoPromotions || []).filter((promo) => {
    const q = searchQuery.toLowerCase();
    return (
      promo.name?.toLowerCase().includes(q) ||
      promo.buyProduct?.name?.toLowerCase().includes(q) ||
      promo.getProduct?.name?.toLowerCase().includes(q)
    );
  });

  if (filteredData.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-white">
        <div className="text-center">
          <Gift className="mx-auto h-8 w-8 text-[#90A1B9] opacity-50" />
          <p className="mt-2 font-['Inter'] text-sm font-medium text-[#45556C]">No BOGO promotions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredData.map(offer => (
        <BogoCard key={offer.id} offer={offer} onEdit={onEdit} />
      ))}
    </div>
  );
}
