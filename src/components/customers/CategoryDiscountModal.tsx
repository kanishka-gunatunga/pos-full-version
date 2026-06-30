"use client";

import { useState, useEffect } from "react";
import { X, Percent, Save } from "lucide-react";
import { CategoryDiscount } from "@/types/customer";
import { useGetCategoryDiscounts, useUpdateCategoryDiscounts } from "@/hooks/useCategoryDiscount";
import { toast } from "sonner";

interface CategoryDiscountModalProps {
  onClose: () => void;
}

export default function CategoryDiscountModal({ onClose }: CategoryDiscountModalProps) {
  const { data: discounts, isLoading } = useGetCategoryDiscounts();
  const updateMutation = useUpdateCategoryDiscounts();
  const [localDiscounts, setLocalDiscounts] = useState<CategoryDiscount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (discounts) {
      setLocalDiscounts(discounts);
    }
  }, [discounts]);

  const handlePercentageChange = (category: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) && value !== "") return;
    
    setLocalDiscounts((prev) =>
      prev.map((d) =>
        d.category === category ? { ...d, discount_percentage: value === "" ? 0 : Math.min(100, Math.max(0, numValue)) } : d
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(localDiscounts);
      toast.success("Category discounts updated successfully");
      onClose();
    } catch (error) {
      console.error("Failed to update discounts:", error);
      toast.error("Failed to update discounts");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "management": return "text-purple-600 bg-purple-50 border-purple-100";
      case "staff": return "text-blue-600 bg-blue-50 border-blue-100";
      default: return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[500px] overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-[#90A1B9] hover:bg-[#F8FAFC] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EA580C]/10 text-[#EA580C]">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-[#1D293D]">Category Discounts</h2>
            <p className="text-[13px] text-[#62748E]">Set default discount percentages by category</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-[14px] text-[#62748E]">Loading discounts...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {localDiscounts.map((item) => (
                <div key={item.category} className="group relative flex items-center justify-between p-4 rounded-2xl border border-[#E2E8F0] hover:border-primary/30 transition-all">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    <span className="text-[14px] font-semibold text-[#314158] capitalize">{item.category} Discount</span>
                  </div>
                  <div className="relative w-32">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={item.discount_percentage}
                      onChange={(e) => handlePercentageChange(item.category, e.target.value)}
                      className="h-11 w-full rounded-xl bg-[#F8FAFC] pr-8 pl-4 text-[14px] font-bold text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10 text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#90A1B9]">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                type="button"
                onClick={onClose}
                className="h-12 flex-1 rounded-xl cursor-pointer border border-[#E2E8F0] text-[14px] font-bold text-[#62748E] transition-all hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 flex-1 rounded-xl cursor-pointer bg-[#EA580C] text-[14px] font-bold text-white shadow-lg shadow-[#EA580C]/20 transition-all hover:bg-[#DC4C04] hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Saving..." : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Discounts
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
