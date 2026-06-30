"use client";

import { useMemo, useState } from "react";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  useGetAllComboPacks,
  useActivateComboPack,
  useDeactivateComboPack,
} from "@/hooks/useComboPack";
import { ComboPack } from "@/types/comboPack";
import { format } from "date-fns";
import Image from "next/image";
import { toast } from "sonner";

interface ComboPacksTabProps {
  searchQuery?: string;
  onEdit: (combo: ComboPack) => void;
}

function ComboPackCard({
  combo,
  onEdit,
}: {
  combo: ComboPack;
  onEdit: (combo: ComboPack) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activateMutation = useActivateComboPack();
  const deactivateMutation = useDeactivateComboPack();

  const priceStats = useMemo(() => {
    const branches = combo.branches || [];
    if (branches.length === 0) {
      const rootPrice = Number(combo.price || 0);
      const rootOriginal =
        Number(combo.original_price) ||
        (combo.items?.reduce((sum, item) => {
          const itemPrice = Number(
            item.product?.variations?.[0]?.options?.[0]?.prices?.[0]?.price || 0
          );
          return sum + itemPrice * item.quantity;
        }, 0) || 0);
      const rootSavings = combo.customer_saves
        ? Number(combo.customer_saves)
        : Math.max(0, rootOriginal - rootPrice);

      return {
        minPrice: rootPrice,
        maxPrice: rootPrice,
        minOriginal: rootOriginal,
        maxOriginal: rootOriginal,
        minSavings: rootSavings,
        maxSavings: rootSavings,
      };
    }

    const prices = branches.map((b) => Number(b.price || 0));
    const originals = branches.map((b) => Number(b.original_price || 0));
    const savingsItems = branches.map((b) => Number(b.customer_saves || 0));

    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minOriginal: Math.min(...originals),
      maxOriginal: Math.max(...originals),
      minSavings: Math.min(...savingsItems),
      maxSavings: Math.max(...savingsItems),
    };
  }, [combo]);

  const formatRange = (min: number, max: number) => {
    if (min === 0 && max === 0) return "N/A";
    if (min === max) return `Rs. ${min.toFixed(2)}`;
    return `Rs. ${min.toFixed(2)} - ${max.toFixed(2)}`;
  };

  const isActive = combo.status === "active";
  const isToggling = activateMutation.isPending || deactivateMutation.isPending;

  const handleToggleStatus = async () => {
    try {
      if (isActive) {
        await deactivateMutation.mutateAsync(combo.id);
        toast.success("Combo pack deactivated");
      } else {
        await activateMutation.mutateAsync(combo.id);
        toast.success("Combo pack activated");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const branchesLabel =
    combo.branches && combo.branches.length > 0
      ? combo.branches.map((b) => b.branch?.name || "Unknown Branch").join(", ")
      : "No branches assigned";

  return (
    <div className="rounded-2xl border border-[#F1F5F9] bg-white shadow-sm overflow-hidden transition-all duration-300">
      {/* Header Section */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#FFF7ED] text-[#EA580C]">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-['Inter'] text-[18px] font-bold leading-[28px] text-[#1D293D]">
                  {combo.name}
                </h3>
                <span className={`rounded-[10px] px-2 py-1 font-['Inter'] text-xs font-bold leading-4 ${
                  isActive
                    ? "bg-[#D0FAE5] text-[#009966]"
                    : "bg-[#F1F5F9] text-[#64748B]"
                }`}>
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-1 font-['Inter'] text-sm font-normal text-[#64748B]">
                {combo.description}
              </p>
              <div className="mt-2 flex items-center gap-4 text-[#64748B]">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">{branchesLabel}</span>
                </div>
                {combo.expire_date && (
                   <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    Expires: {format(new Date(combo.expire_date), "MMM dd, yyyy")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-[#94A3B8] hover:bg-[#F8FAFC] rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                isActive
                  ? "bg-[#F1F5F9] text-[#314158] hover:bg-[#E2E8F0]"
                  : "bg-[#EA580C] text-white hover:bg-[#c2410c]"
              }`}
            >
              {isToggling && <Loader2 className="h-3 w-3 animate-spin" />}
              {isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={() => onEdit(combo)}
              className="p-2 text-[#155DFC] hover:bg-[#F1F5F9] rounded-lg transition-colors"
            >
              <Pencil className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-0 border-t border-[#F1F5F9] bg-[#ECFDF5] rounded-[14px] p-6">
          <div className="border-r border-[#F1F5F9] pr-6">
            <p className="font-['Inter'] text-xs font-medium text-[#90A1B9]">Original Price</p>
            <p className="mt-1 font-['Inter'] text-[16px] font-bold text-[#90A1B9] line-through">
              {formatRange(priceStats.minOriginal, priceStats.maxOriginal)}
            </p>
          </div>
          <div className="border-r border-[#F1F5F9] px-6">
            <p className="font-['Inter'] text-xs font-medium text-[#90A1B9]">Combo Price</p>
            <p className="mt-1 font-['Inter'] text-[20px] font-bold text-[#009966]">
              {formatRange(priceStats.minPrice, priceStats.maxPrice)}
            </p>
          </div>
          <div className="pl-6">
            <p className="font-['Inter'] text-xs font-medium text-[#90A1B9]">You Save</p>
            <p className="mt-1 font-['Inter'] text-[16px] font-bold text-[#155DFC]">
              {formatRange(priceStats.minSavings, priceStats.maxSavings)}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Section: Included Products */}
      {isExpanded && (
        <div className="border-t border-[#F1F5F9] bg-[#FAFAFA] px-6 py-6 transition-all">
          <h4 className="font-['Inter'] text-[12px] font-bold uppercase tracking-wider text-[#314158] mb-4">
            Included Products
          </h4>
          <div className="space-y-2">
            {combo.items?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-[#F1F5F9]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-[#F1F5F9]">
                    {item.product?.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-[#94A3B8]" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Inter'] text-sm font-bold text-[#314158]">
                      {item.product?.name}
                    </span>
                    {item.variationOption && (
                      <span className="font-['Inter'] text-[11px] text-[#64748B]">
                        {item.variationOption.name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-['Inter'] text-sm font-bold text-[#314158]">
                  Qty: {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComboPacksTab({
  searchQuery = "",
  onEdit
}: ComboPacksTabProps) {
  const { data: combos = [], isLoading, isError } = useGetAllComboPacks("all");

  const filteredCombos = combos.filter(combo =>
    combo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    combo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#64748B]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="font-['Inter'] text-sm font-medium">Loading combo packs...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#EC003F]">
        <AlertCircle className="h-10 w-10 mb-4" />
        <p className="font-['Inter'] text-sm font-medium">Failed to load combo packs</p>
      </div>
    );
  }

  if (filteredCombos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#64748B]">
        <Package className="h-12 w-12 mb-4 opacity-20" />
        <p className="font-['Inter'] text-sm font-medium">No combo packs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredCombos.map(combo => (
        <ComboPackCard
          key={combo.id}
          combo={combo}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
