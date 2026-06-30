"use client";

import { useState, useMemo } from "react";
import {
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  Percent,
  DollarSign,
  Calendar,
  Package,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  type Discount,
  type Product,
  type VariationOption,
  type CreateDiscountPayload,
  type UpdateDiscountPayload,
} from "@/types/product";
import { useGetAllProducts } from "@/hooks/useProduct";
import { useCreateDiscount, useUpdateDiscount } from "@/hooks/useDiscount";
import { useGetAllBranches } from "@/hooks/useBranch";

type DiscountType = "percentage" | "fixed";

type SelectedDiscount = {
  productId: number;
  variantId?: number;
  productName: string;
  variantName?: string;
  basePrice: number;
  type: DiscountType;
  value: number;
  branchId?: number;
};

type AddDiscountModalProps = {
  open: boolean;
  overlayVisible: boolean;
  onClose: () => void;
  editingDiscount?: Discount | null;
};

function formatPrice(value: number): string {
  return `Rs.${Number(value).toFixed(2)}`;
}

function discountExpiryToInputValue(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === "") return "";
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const t = new Date(s);
  if (Number.isNaN(t.getTime())) return "";
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const day = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildSelectedDiscountsFromEditing(
  editing: Discount | null | undefined,
  products: Product[] | undefined
): SelectedDiscount[] {
  if (!editing?.items?.length) return [];
  return editing.items.map((item) => {
    const variantId = item.variationOptionId ?? undefined;
    const branchId = item.branchId ?? undefined;
    const product = products?.find((p) => p.id === item.productId);
    const variant = product?.variations?.[0]?.options?.find((o) => o.id === variantId);
    const basePrice = Number(
      variant?.prices?.[0]?.price ||
        product?.variations?.[0]?.options?.[0]?.prices?.[0]?.price ||
        item.variationOption?.prices?.[0]?.price ||
        item.product?.variations?.[0]?.options?.[0]?.prices?.[0]?.price ||
        0
    );
    return {
      productId: item.productId!,
      variantId,
      productName: item.product?.name || product?.name || "Product",
      variantName: item.variationOption?.name || variant?.name,
      basePrice,
      type: item.discountType as DiscountType,
      value: Number(item.discountValue),
      branchId,
    };
  });
}

export default function AddDiscountModal({
  open,
  overlayVisible,
  onClose,
  editingDiscount,
}: AddDiscountModalProps) {
  const { data: products } = useGetAllProducts({ status: "active" });
  const { data: branches } = useGetAllBranches("active");
  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount();

  const [step, setStep] = useState(1);
  const [discountName, setDiscountName] = useState(() => editingDiscount?.name ?? "");
  const [expiryDate, setExpiryDate] = useState(() =>
    discountExpiryToInputValue(editingDiscount?.expiryDate)
  );
  const [isForAllBranches, setIsForAllBranches] = useState(
    () => editingDiscount?.isForAllBranches ?? true
  );
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>(
    () => editingDiscount?.branches?.map((b) => b.branchId) ?? []
  );
  const [activeBranchId, setActiveBranchId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [selectedDiscounts, setSelectedDiscounts] = useState<SelectedDiscount[]>(() =>
    buildSelectedDiscountsFromEditing(editingDiscount, products)
  );

  const isEditing = !!editingDiscount;
  const isLoading = createMutation.isPending || updateMutation.isPending;


  const selectedDiscountsResolved = useMemo((): SelectedDiscount[] => {
    if (!products?.length) return selectedDiscounts;
    return selectedDiscounts.map((item) => {
      if (item.basePrice > 0) return item;
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variations?.[0]?.options?.find((o) => o.id === item.variantId);
      const price = Number(
        variant?.prices?.[0]?.price ||
          product?.variations?.[0]?.options?.[0]?.prices?.[0]?.price ||
          0
      );
      return price > 0 ? { ...item, basePrice: price } : item;
    });
  }, [products, selectedDiscounts]);

  const effectiveBranchId = useMemo((): number | null => {
    if (isForAllBranches || step !== 2 || selectedBranchIds.length === 0) {
      return activeBranchId;
    }
    if (activeBranchId === -1) return -1;
    if (activeBranchId != null && selectedBranchIds.includes(activeBranchId)) {
      return activeBranchId;
    }
    return selectedBranchIds[0];
  }, [step, isForAllBranches, selectedBranchIds, activeBranchId]);

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleToggleExpand = (productId: number) => {
    setExpandedProduct((prev: number | null) => (prev === productId ? null : productId));
  };

  const isSelected = (productId: number, variantId?: number) => {
    const currentBranchContext = isForAllBranches ? undefined : (effectiveBranchId === -1 ? null : effectiveBranchId);
    return selectedDiscounts.some(
      (s) => s.productId === productId && s.variantId === variantId && s.branchId === (currentBranchContext || undefined)
    );
  };

  const handleToggleSelect = (
    product: Product,
    variant?: VariationOption
  ) => {
    const variantId = variant?.id;
    const currentBranchContext = isForAllBranches ? undefined : (effectiveBranchId === -1 ? null : effectiveBranchId);
    if (isSelected(product.id, variantId)) {
      setSelectedDiscounts((prev: SelectedDiscount[]) =>
        prev.filter(
          (s: SelectedDiscount) => !(s.productId === product.id && s.variantId === variantId && s.branchId === (currentBranchContext || undefined))
        )
      );
    } else {
      const basePrice = Number(variant?.prices?.[0]?.price || product.variations?.[0]?.options?.[0]?.prices?.[0]?.price || 0);
      setSelectedDiscounts((prev) => [
        ...prev,
        {
          productId: product.id,
          variantId,
          productName: product.name,
          variantName: variant?.name,
          basePrice,
          type: "percentage" as DiscountType,
          value: 10,
          branchId: isForAllBranches ? undefined : (effectiveBranchId === -1 ? undefined : (effectiveBranchId || undefined)),
        },
      ]);
    }
  };

  const handleRemove = (productId: number, variantId?: number) => {
    const currentBranchContext = isForAllBranches ? undefined : (effectiveBranchId === -1 ? null : effectiveBranchId);
    setSelectedDiscounts((prev: SelectedDiscount[]) =>
      prev.filter(
        (s: SelectedDiscount) => !(s.productId === productId && s.variantId === variantId && s.branchId === (currentBranchContext || undefined))
      )
    );
  };

  const handleUpdateDiscount = (
    productId: number,
    variantId: number | undefined,
    field: "type" | "value",
    value: DiscountType | number
  ) => {
    const currentBranchContext = isForAllBranches ? undefined : (effectiveBranchId === -1 ? null : effectiveBranchId);
    setSelectedDiscounts((prev: SelectedDiscount[]) =>
      prev.map((s: SelectedDiscount) =>
        s.productId === productId && s.variantId === variantId && s.branchId === (currentBranchContext || undefined)
          ? { ...s, [field]: value }
          : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!discountName.trim()) return;
    if (step === 1) {
      setStep(2);
      return;
    }
    if (selectedDiscounts.length === 0) return;

    // Group items by unique product/variant combination
    const uniqueItems = Array.from(new Set(selectedDiscounts.map(s => `${s.productId}-${s.variantId || 'base'}`)));

    const payload: CreateDiscountPayload = {
      name: discountName.trim(),
      expiryDate: expiryDate || undefined,
      isForAllBranches,
      branches: isForAllBranches ? undefined : selectedBranchIds,
      items: uniqueItems.map(key => {
        const [pId, vIdStr] = key.split('-');
        const pIdNum = parseInt(pId);
        const vIdNum = vIdStr === 'base' ? undefined : parseInt(vIdStr);
        
        const configs = selectedDiscounts.filter(s => s.productId === pIdNum && s.variantId === vIdNum);
        const first = configs[0];

        if (!first) {
          console.warn(`No config found for item ${key}`);
          return null;
        }

        if (isForAllBranches) {
          return {
            productId: pIdNum,
            variationOptionId: vIdNum,
            discountType: first.type,
            discountValue: first.value,
          };
        } else {
          return {
            productId: pIdNum,
            variationOptionId: vIdNum,
            discountType: first.type,
            branchDiscounts: configs.map(c => ({
              branchId: c.branchId!,
              discountValue: c.value
            }))
          };
        }
      }).filter((item): item is NonNullable<typeof item> => item !== null)
    };

    try {
      if (isEditing && editingDiscount) {
        await updateMutation.mutateAsync({ id: editingDiscount.id, payload: payload as UpdateDiscountPayload });
        toast.success("Discount updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Discount created successfully");
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to save discount:", err);
      toast.error(err?.response?.data?.message || "Failed to save discount");
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-discount-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ease-out"
      style={{ opacity: overlayVisible ? 1 : 0 }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex shrink-0 items-start justify-between">
          <div>
            <h2
              id="add-discount-title"
              className="font-['Inter'] text-xl font-bold text-[#1D293D]"
            >
              Create New Discount
            </h2>
            <p className="mt-1 font-['Inter'] text-sm text-[#90A1B9]">
              Configure discounts for products and variants
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden"
        >
          {step === 1 ? (
            <div className="flex flex-col gap-6 overflow-hidden">
              <div className="grid shrink-0 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                    Discount Name <span className="text-[#EC003F]">*</span>
                  </label>
                  <input
                    type="text"
                    value={discountName}
                    onChange={(e) => setDiscountName(e.target.value)}
                    placeholder="e.g. Summer Sale, Weekend Special"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                    Expiry Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      onClick={(e) => {
                        (e.currentTarget as HTMLInputElement).showPicker?.();
                      }}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 pl-10 pr-4 font-['Inter'] text-sm text-[#1D293D] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col overflow-hidden">
                <label className="mb-3 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                  Select Branches <span className="text-[#EC003F]">*</span>
                </label>
                <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin] sm:grid-cols-2 lg:grid-cols-3">
                  <div
                    onClick={() => {
                      setIsForAllBranches(true);
                      setSelectedBranchIds([]);
                    }}
                    className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all ${isForAllBranches
                        ? "border-[#EA580C] bg-[#EA580C]/5 shadow-sm"
                        : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8FAFC]">
                        <Package className={`h-5 w-5 ${isForAllBranches ? "text-[#EA580C]" : "text-[#64748B]"}`} />
                      </div>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${isForAllBranches ? "border-[#EA580C] bg-[#EA580C]" : "border-[#CBD5E1]"
                        }`}>
                        {isForAllBranches && <Check className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                    <p className="mt-4 font-['Inter'] text-sm font-bold text-[#1D293D]">All Branches</p>
                    <p className="mt-1 font-['Inter'] text-xs text-[#90A1B9]">Apply to all locations</p>
                  </div>

                  {branches?.map((branch) => {
                    const isSelected = !isForAllBranches && selectedBranchIds.includes(branch.id);
                    return (
                      <div
                        key={branch.id}
                        onClick={() => {
                          setIsForAllBranches(false);
                          setSelectedBranchIds(prev =>
                            isSelected ? prev.filter(id => id !== branch.id) : [...prev, branch.id]
                          );
                        }}
                        className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all ${isSelected
                            ? "border-[#EA580C] bg-[#EA580C]/5 shadow-sm"
                            : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8FAFC]">
                            <Package className={`h-5 w-5 ${isSelected ? "text-[#EA580C]" : "text-[#64748B]"}`} />
                          </div>
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? "border-[#EA580C] bg-[#EA580C]" : "border-[#CBD5E1]"
                            }`}>
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                        </div>
                        <p className="mt-4 font-['Inter'] text-sm font-bold text-[#1D293D]">{branch.name}</p>
                        <p className="mt-1 font-['Inter'] text-xs text-[#90A1B9] truncate">{branch.location || "123 Main St"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin]">
              <label className="mb-2 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">CONFIGURE DISCOUNTS FOR EACH BRANCH</label>
              
              {(isForAllBranches ? [{ id: -1, name: "All Branches", location: "Global configuration" }] : selectedBranchIds.map(id => branches?.find(b => b.id === id)).filter(Boolean)).map((branch, idx) => {
                const bId = branch?.id === -1 ? null : branch?.id;
                const isExpanded = effectiveBranchId === (bId || -1);
                const branchDiscounts = selectedDiscountsResolved.filter((s) =>
                  isForAllBranches ? s.branchId === undefined : s.branchId === bId
                );

                return (
                  <div key={branch?.id} className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
                    <div 
                      className={`flex cursor-pointer items-center justify-between p-5 transition-colors ${isExpanded ? "bg-[#F8FAFC]" : "hover:bg-[#F8FAFC]"}`}
                      onClick={() => setActiveBranchId(isExpanded ? null : (bId || -1))}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B]">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-['Inter'] text-sm font-bold text-[#1D293D]">{branch?.name}</p>
                          <p className="font-['Inter'] text-xs text-[#90A1B9]">{branch?.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {branchDiscounts.length > 0 && (
                          <span className="rounded-full bg-[#EA580C]/10 px-3 py-1 font-['Inter'] text-xs font-bold text-[#EA580C]">
                            {branchDiscounts.length} item(s) configured
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-[#90A1B9]" /> : <ChevronDown className="h-5 w-5 text-[#90A1B9]" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="grid grid-cols-1 gap-6 border-t border-[#E2E8F0] p-6 lg:grid-cols-2">
                        {/* Left Panel: Select Products */}
                        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                          <label className="mb-3 block font-['Inter'] text-xs font-bold text-[#45556C]">SELECT PRODUCTS <span className="text-[#EC003F]">*</span></label>
                          <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search products..."
                              className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                            />
                          </div>
                          <div className="max-h-[400px] space-y-2 overflow-y-auto [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin]">
                            {filteredProducts.map((product) => {
                              const variants = product.variations?.[0]?.options || [];
                              const hasVariants = variants.length > 1;
                              const isProdExpanded = expandedProduct === product.id;

                              return (
                                <div key={product.id} className="rounded-xl border border-[#E2E8F0] bg-white">
                                  <div className="flex cursor-pointer items-center gap-3 p-3" onClick={() => handleToggleExpand(product.id)}>
                                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                                      <img src={product.image || ""} alt={product.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-['Inter'] text-sm font-bold text-[#1D293D]">{product.name}</p>
                                      <p className="font-['Inter'] text-xs text-[#90A1B9]">
                                        {formatPrice(Number(product.variations?.[0]?.options?.[0]?.prices?.[0]?.price || 0))}
                                        {hasVariants && ` • ${variants.length} variants`}
                                      </p>
                                    </div>
                                    <button type="button" className="shrink-0 text-[#90A1B9] bg-[#EA580C1A] rounded-[14px] p-2 cursor-pointer">
                                      {isProdExpanded ? <ChevronUp className="h-4 w-4 text-[#EA580C]" /> : <ChevronDown className="h-4 w-4 text-[#EA580C]" />}
                                    </button>
                                  </div>
                                  {isProdExpanded && (
                                    <div className="space-y-2 border-t border-[#E2E8F0] p-3">
                                      {!hasVariants ? (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleSelect(product)}
                                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${isSelected(product.id) ? "border-[#EA580C] bg-[#EA580C]/5" : "border-[#E2E8F0] hover:border-[#CBD5E1]"}`}
                                        >
                                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 ${isSelected(product.id) ? "border-[#EA580C] bg-[#EA580C]" : "border-[#CBD5E1]"}`}>
                                            {isSelected(product.id) && <Check className="h-3 w-3 text-white" />}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="flex-1 font-['Inter'] text-sm font-medium text-[#314158]">{product.name}</span>
                                            <span className="font-['Inter'] text-xs text-[#90A1B9]">{formatPrice(Number(product.variations?.[0]?.options?.[0]?.prices?.[0]?.price || 0))}</span>
                                          </div>
                                        </button>
                                      ) : (
                                        variants.map((v) => (
                                          <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => handleToggleSelect(product, v)}
                                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${isSelected(product.id, v.id) ? "border-[#EA580C] bg-[#EA580C0D]" : "border-[#E2E8F0] hover:border-[#CBD5E1]"}`}
                                          >
                                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg cursor-pointer border-2 ${isSelected(product.id, v.id) ? "border-[#EA580C] bg-[#EA580C]" : "border-[#CBD5E1]"}`}>
                                              {isSelected(product.id, v.id) && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="flex-1 font-['Inter'] text-sm font-medium text-[#314158]">{v.name}</span>
                                              <span className="font-['Inter'] text-xs text-[#90A1B9]">{formatPrice(Number(v.prices?.[0]?.price || 0))}</span>
                                            </div>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Right Panel: Selected Items */}
                        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                          <label className="mb-1 block font-['Inter'] text-xs font-bold text-[#45556C]">SELECTED PRODUCTS & DISCOUNTS</label>
                          <p className="mb-4 font-['Inter'] text-xs text-[#90A1B9]">{branchDiscounts.length} item(s) selected</p>
                          <div className="max-h-[500px] space-y-4 overflow-y-auto pr-1 [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin]">
                            {branchDiscounts.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Percent className="mb-2 h-10 w-10 text-[#E2E8F0]" />
                                <p className="font-['Inter'] text-sm font-medium text-[#90A1B9]">No products selected</p>
                                <p className="font-['Inter'] text-xs text-[#90A1B9]">Select products from the left panel</p>
                              </div>
                            ) : (
                              branchDiscounts.map((config) => {
                                const discountAmount = config.type === "percentage" ? (config.basePrice * config.value) / 100 : config.value;
                                const finalPrice = Math.max(0, config.basePrice - discountAmount);
                                return (
                                  <div key={`${config.productId}-${config.variantId}-${config.branchId}`} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                                    <div className="mb-4 flex items-start justify-between">
                                      <div>
                                        <p className="font-['Inter'] text-sm font-bold text-[#1D293D]">{config.productName}</p>
                                        {config.variantName && <p className="font-['Inter'] text-[11px] text-[#90A1B9]">Variant: {config.variantName}</p>}
                                      </div>
                                      <button type="button" onClick={() => handleRemove(config.productId, config.variantId)} className="text-[#90A1B9] hover:text-[#EC003F]">
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <div className="mb-4 flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateDiscount(config.productId, config.variantId, "type", "percentage")}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 font-['Inter'] text-xs font-bold transition-all ${config.type === "percentage" ? "border-[#EA580C] bg-[#EA580C]/5 text-[#EA580C]" : "border-[#E2E8F0] bg-white text-[#90A1B9]"}`}
                                      >
                                        <Percent className="h-3.5 w-3.5" /> Percentage
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateDiscount(config.productId, config.variantId, "type", "fixed")}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 font-['Inter'] text-xs font-bold transition-all ${config.type === "fixed" ? "border-[#EA580C] bg-[#EA580C]/5 text-[#EA580C]" : "border-[#E2E8F0] bg-white text-[#90A1B9]"}`}
                                      >
                                        <DollarSign className="h-3.5 w-3.5" /> Fixed Price
                                      </button>
                                    </div>
                                    <div className="mb-4">
                                      <label className="mb-1 block font-['Inter'] text-[10px] font-bold text-[#90A1B9]">DISCOUNT ({config.type === "percentage" ? "%" : "Rs."})</label>
                                      <input
                                        type="number"
                                        value={config.value}
                                        onChange={(e) => handleUpdateDiscount(config.productId, config.variantId, "value", parseFloat(e.target.value) || 0)}
                                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 font-['Inter'] text-[#0A0A0A] text-sm focus:border-[#EA580C] focus:outline-none"
                                      />
                                    </div>
                                    <div className="rounded-xl border border-[#D0FAE5] bg-[#D0FAE5]/20 p-3">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-[#64748B]">Original:</span>
                                        <span className="text-[#90A1B9] line-through">{formatPrice(config.basePrice)}</span>
                                      </div>
                                      <div className="mt-1 flex justify-between text-sm font-bold">
                                        <span className="text-[#1D293D]">Final Price:</span>
                                        <span className="text-[#009966]">{formatPrice(finalPrice)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex shrink-0 justify-end gap-3 border-t border-[#E2E8F0] pt-6">
            <button
              type="button"
              onClick={step === 1 ? onClose : () => setStep(1)}
              className="rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-bold text-[#45556C] hover:bg-[#F8FAFC]"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            {step === 1 ? (
              <button
                type="submit"
                disabled={!discountName.trim() || (!isForAllBranches && selectedBranchIds.length === 0)}
                className="flex items-center gap-2 rounded-[14px] bg-[#EA580C] px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] hover:bg-[#c2410c] disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || selectedDiscounts.length === 0}
                className="flex items-center gap-2 rounded-[14px] bg-[#EA580C] px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] hover:bg-[#c2410c] disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Update Discount" : "Create Discount"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
