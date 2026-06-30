"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  X,
  Search,
  Check,
  Calendar,
  Package,
  Loader2,
  Trash2,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { type Product, type VariationOption } from "@/types/product";
import { useGetAllBranches } from "@/hooks/useBranch";
import {
  useCreateComboPack,
  useUpdateComboPack,
  useGetComboPackById,
} from "@/hooks/useComboPack";
import { ComboPack, CreateComboPackPayload, UpdateComboPackPayload } from "@/types/comboPack";
import { useGetProductsByBranch } from "@/hooks/useProduct";
import { useGetAllModifications } from "@/hooks/useModification";
import { collectAddOns } from "../menu/menuItemMapper";

type AddComboModalProps = {
  open: boolean;
  overlayVisible: boolean;
  onClose: () => void;
  editingCombo?: ComboPack | null;
};

function formatPrice(value: number): string {
  return `Rs. ${Number(value).toFixed(2)}`;
}

export default function AddComboModal({
  open,
  overlayVisible,
  onClose,
  editingCombo,
}: AddComboModalProps) {
  const { data: branches } = useGetAllBranches("active");

  const [step, setStep] = useState(1);
  const [comboName, setComboName] = useState(() => editingCombo?.name ?? "");
  const [expiryDate, setExpiryDate] = useState(() => editingCombo?.expire_date ?? "");
  const [description, setDescription] = useState(() => editingCombo?.description ?? "");
  const [isForAllBranches, setIsForAllBranches] = useState(
    () => !(editingCombo?.branches && editingCombo.branches.length > 0)
  );
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>(
    () => editingCombo?.branches?.map((b: any) => b.branchId) ?? []
  );

  const [selectedProductsByBranch, setSelectedProductsByBranch] = useState<Record<number, any[]>>(
    {}
  );
  const [comboPricesByBranch, setComboPricesByBranch] = useState<Record<number, number>>({});
  const [expandedBranchId, setExpandedBranchId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [addOnSearch, setAddOnSearch] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(() => editingCombo?.image ?? "");
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview && !imagePreview.startsWith("http")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const { data: fetchedCombo, isLoading: isFetching } = useGetComboPackById(editingCombo?.id || 0);

  const createComboPackMutation = useCreateComboPack();
  const updateComboPackMutation = useUpdateComboPack();
  const { data: allModifications = [] } = useGetAllModifications("active");

  const isEditing = !!editingCombo;
  const isLoading =
    createComboPackMutation.isPending || updateComboPackMutation.isPending || isFetching;

  useEffect(() => {
    if (isEditing && !fetchedCombo) return;

    if (fetchedCombo) {
      setComboName(fetchedCombo.name || "");
      setExpiryDate(fetchedCombo.expire_date ? fetchedCombo.expire_date.slice(0, 10) : "");
      setDescription(fetchedCombo.description || "");
      setImagePreview(fetchedCombo.image || "");

      const hasBranches = (fetchedCombo.branches && fetchedCombo.branches.length > 0) || false;
      setIsForAllBranches(!hasBranches);
      const branchIds = hasBranches ? fetchedCombo.branches?.map((b: any) => b.branchId) || [] : [];
      setSelectedBranchIds(branchIds);

      const itemsByBase = new Map<string, any>();

      fetchedCombo.items?.forEach((item: any) => {
        const key = `${item.productId}-${item.variationOptionId}`;
        if (!item.modificationItemId) {
          const variant =
            item.variationOption ||
            item.product?.variations?.[0]?.options?.find(
              (o: any) => o.id === item.variationOptionId
            );
          const price = Number(variant?.prices?.find((p: any) => p.branchId === expandedBranchId)?.price || variant?.prices?.[0]?.price || 0);
          
          itemsByBase.set(key, {
            productId: item.productId,
            variationOptionId: item.variationOptionId,
            name: item.product?.name,
            variantName: variant?.name,
            price,
            qty: item.quantity,
            image: item.product?.image,
            modifications: []
          });
        }
      });

      fetchedCombo.items?.forEach((item: any) => {
        const key = `${item.productId}-${item.variationOptionId}`;
        if (item.modificationItemId && itemsByBase.has(key)) {
          const modItem = item.modificationItem;
          itemsByBase.get(key).modifications.push({
            id: item.modificationItemId,
            name: modItem?.title || "Unknown",
            price: Number(modItem?.price || 0),
            qty: item.quantity
          });
        }
      });

      const mappedItems = Array.from(itemsByBase.values());

      const productsMap: Record<number, any[]> = {};
      const pricesMap: Record<number, number> = {};

      (hasBranches ? branchIds : branches?.map((b) => b.id) || []).forEach((bid) => {
        productsMap[bid] = [...mappedItems];
        const branchConfig = fetchedCombo.branches?.find((b: any) => b.branchId === bid);
        pricesMap[bid] = Number(branchConfig?.price || fetchedCombo.price || 0);
      });

      setSelectedProductsByBranch(productsMap);
      setComboPricesByBranch(pricesMap);
    } else {
      setStep(1);
      setComboName("");
      setExpiryDate("");
      setDescription("");
      setIsForAllBranches(true);
      setSelectedBranchIds([]);
      setSelectedProductsByBranch({});
      setComboPricesByBranch({});
      setImageFile(null);
      setImagePreview("");
    }
  }, [fetchedCombo, branches, isEditing]);

  const activeBranches = useMemo(() => {
    if (isForAllBranches) return branches || [];
    return branches?.filter((b) => selectedBranchIds.includes(b.id)) || [];
  }, [branches, isForAllBranches, selectedBranchIds]);

  const getOriginalPriceForBranch = (branchId: number, branchProducts: any[]) => {
    return branchProducts.reduce((sum, item) => {
      const baseTotal = item.price * (item.qty || 1);
      const modsTotal = (item.modifications || []).reduce(
        (mSum: number, m: any) => mSum + m.price * m.qty,
        0
      );
      return sum + baseTotal + modsTotal * (item.qty || 1);
    }, 0);
  };

  const handleToggleSelect = (
    product: Product,
    variant: VariationOption | undefined,
    branchId: number,
    currentPrice: number
  ) => {
    const variationOptionId = variant?.id;
    const branchProducts = selectedProductsByBranch[branchId] || [];
    const isSelected = branchProducts.some(
      (s) => s.productId === product.id && s.variationOptionId === variationOptionId
    );

    if (isSelected) {
      setSelectedProductsByBranch((prev) => ({
        ...prev,
        [branchId]: prev[branchId].filter(
          (s) => !(s.productId === product.id && s.variationOptionId === variationOptionId)
        ),
      }));
    } else {
      setSelectedProductsByBranch((prev) => ({
        ...prev,
        [branchId]: [
          ...(prev[branchId] || []),
          {
            productId: product.id,
            variationOptionId,
            name: product.name,
            variantName: variant?.name,
            price: currentPrice,
            qty: 1,
            image: product.image,
          },
        ],
      }));
    }
  };

  const updateQty = (
    productId: number,
    variationOptionId: number | undefined,
    delta: number,
    branchId: number
  ) => {
    setSelectedProductsByBranch((prev) => ({
      ...prev,
      [branchId]: prev[branchId].map((p) =>
        p.productId === productId && p.variationOptionId === variationOptionId
          ? { ...p, qty: Math.max(1, p.qty + delta) }
          : p
      ),
    }));
  };

  const toggleAddOn = (branchId: number, productIndex: number, addOn: any) => {
    setSelectedProductsByBranch((prev) => {
      const branchProducts = [...(prev[branchId] || [])];
      const product = branchProducts[productIndex];
      const modifications = [...(product.modifications || [])];
      const existingIdx = modifications.findIndex((m) => m.id === Number(addOn.id));

      if (existingIdx > -1) {
        modifications.splice(existingIdx, 1);
      } else {
        modifications.push({
          id: Number(addOn.id),
          name: addOn.name,
          price: addOn.price,
          qty: 1,
        });
      }

      branchProducts[productIndex] = { ...product, modifications };
      return { ...prev, [branchId]: branchProducts };
    });
  };

  const updateAddOnQty = (
    branchId: number,
    productIndex: number,
    addOnId: string | number,
    delta: number
  ) => {
    setSelectedProductsByBranch((prev) => {
      const branchProducts = [...(prev[branchId] || [])];
      const product = branchProducts[productIndex];
      const modifications = (product.modifications || []).map((m: any) => {
        if (m.id === Number(addOnId)) {
          return { ...m, qty: Math.max(1, m.qty + delta) };
        }
        return m;
      });

      branchProducts[productIndex] = { ...product, modifications };
      return { ...prev, [branchId]: branchProducts };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeBranches.length === 0) {
      toast.error("Please select at least one branch.");
      return;
    }

    if (step === 1) {
      setStep(2);
      if (activeBranches.length > 0) {
        setExpandedBranchId(activeBranches[0].id);
      }
      return;
    }

    const invalidBranches = activeBranches.filter((b) => {
      const branchProducts = selectedProductsByBranch[b.id] || [];
      const totalQty = branchProducts.reduce((sum, p) => sum + (p.qty || 0), 0);
      return totalQty < 2;
    });
    if (invalidBranches.length > 0) {
      toast.error(
        `Please select at least 2 products for: ${invalidBranches.map((b) => b.name).join(", ")}`
      );
      return;
    }

    const branchesWithoutPrice = activeBranches.filter((b) => {
      const price = comboPricesByBranch[b.id] || 0;
      return price <= 0;
    });

    if (branchesWithoutPrice.length > 0) {
      toast.error(
        `Please enter a valid offer price for: ${branchesWithoutPrice.map((b) => b.name).join(", ")}`
      );
      return;
    }

    try {

      const configGroups: Record<string, number[]> = {};

      activeBranches.forEach((branch) => {
        const branchItems: any[] = [];
        (selectedProductsByBranch[branch.id] || []).forEach((p) => {
          // Base product
          branchItems.push({
            productId: p.productId,
            variationOptionId: p.variationOptionId,
            modificationItemId: null,
            quantity: p.qty,
          });

          // Modifications
          if (p.modifications && p.modifications.length > 0) {
            p.modifications.forEach((m: any) => {
              branchItems.push({
                productId: p.productId,
                variationOptionId: p.variationOptionId,
                modificationItemId: m.id,
                quantity: m.qty,
              });
            });
          }
        });

        const sortedItems = branchItems.sort(
          (a, b) =>
            a.productId - b.productId ||
            (a.variationOptionId || 0) - (b.variationOptionId || 0) ||
            (a.modificationItemId || 0) - (b.modificationItemId || 0)
        );

        const groupKey = JSON.stringify({ items: sortedItems });

        if (!configGroups[groupKey]) configGroups[groupKey] = [];
        configGroups[groupKey].push(branch.id);
      });

      const groupEntries = Object.entries(configGroups);

      for (let i = 0; i < groupEntries.length; i++) {
        const [key, branchIds] = groupEntries[i];
        const { items } = JSON.parse(key);

        const branchPayload = branchIds.map((bid) => {
          const price = comboPricesByBranch[bid] || 0;
          const originalPrice = getOriginalPriceForBranch(
            bid,
            selectedProductsByBranch[bid] || []
          );
          const saves = Math.max(0, originalPrice - price);

          return {
            branchId: bid,
            original_price: Number(originalPrice),
            price: Number(price),
            customer_saves: Number(saves),
          };
        });

        const commonPayload: CreateComboPackPayload = {
          name: comboName,
          description,
          expire_date: expiryDate || undefined,
          branches: branchPayload,
          items: items,
          image: imagePreview && imagePreview.startsWith("http") ? imagePreview : undefined
        };

        if (isEditing && editingCombo) {
          if (i === 0) {
            await updateComboPackMutation.mutateAsync({
              id: editingCombo.id,
              data: { ...commonPayload },
              imageFile: imageFile || undefined,
            });
          } else {
            await createComboPackMutation.mutateAsync({ 
              data: { ...commonPayload }, 
              imageFile: imageFile || undefined 
            });
          }
        } else {
          await createComboPackMutation.mutateAsync({ 
            data: { ...commonPayload }, 
            imageFile: imageFile || undefined 
          });
        }
      }

      toast.success(isEditing ? "Combo pack(s) updated!" : "Combo pack(s) created!");
      onClose();
    } catch (error: any) {
      console.error("Failed to save combo pack:", error);
      toast.error(
        error.response?.data?.message || `Failed to ${isEditing ? "update" : "create"} combo pack.`
      );
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ease-out"
      style={{ opacity: overlayVisible ? 1 : 0 }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-5xl flex-col rounded-[24px] border border-[#E2E8F0] bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex shrink-0 items-start justify-between">
          <div>
            <h2 className="font-['Inter'] text-2xl font-bold text-[#1D293D]">
              {isEditing ? "Update Combo Pack" : "Create Combo Pack"}
            </h2>
            <p className="mt-1 font-['Inter'] text-sm text-[#94A3B8]">
              {isEditing
                ? "Modify your bundled products"
                : "Bundle products together for special pricing"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#45556C]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden relative"
        >
          {isFetching && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 rounded-b-[24px]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-[#EA580C]" />
                <p className="text-sm font-medium text-[#45556C]">Loading combo details...</p>
              </div>
            </div>
          )}
          {step === 1 ? (
            <div className="flex flex-1 flex-col gap-6 overflow-hidden">
              {/* Name and Expiry Row */}
              <div className="grid grid-cols-2 gap-6 shrink-0">
                <div className="flex flex-col gap-2">
                  <label className="font-['Inter'] text-[12px] font-bold uppercase tracking-wider text-[#90A1B9]">
                    Combo Name <span className="text-[#F43F5E]">*</span>
                  </label>
                  <input
                    type="text"
                    value={comboName}
                    onChange={(e) => setComboName(e.target.value)}
                    placeholder="e.g. Family Feast, Lunch Combo"
                    className="h-[46px] w-full rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#0A0A0A80] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] transition-all"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-['Inter'] text-[12px] font-bold uppercase tracking-wider text-[#90A1B9]">
                    Expiry Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="h-[46px] w-full rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] pl-11 pr-4 font-['Inter'] text-sm text-[#1D293D] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Description Row */}
              <div className="flex flex-col gap-2">
                <label className="font-['Inter'] text-[12px] font-bold uppercase tracking-wider text-[#90A1B9]">
                  Description <span className="text-[#F43F5E]">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the combo pack..."
                  rows={2}
                  className="w-full rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 py-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#0A0A0A80] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] transition-all resize-none"
                  required
                />
              </div>

              {/* Image Upload Row */}
              <div className="flex flex-col gap-2">
                <label className="font-['Inter'] text-[12px] font-bold uppercase tracking-wider text-[#90A1B9]">
                  Combo Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (imagePreview && !imagePreview.startsWith("http")) URL.revokeObjectURL(imagePreview);
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 h-[46px] font-['Inter'] text-sm text-left transition-all hover:border-[#EA580C]/30 focus:border-[#EA580C] focus:outline-none"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <ImageIcon className="h-3.5 w-3.5 text-[#EA580C]" />
                    </div>
                    <span className={imageFile || (imagePreview && imagePreview.startsWith("http")) ? "min-w-0 truncate text-[#1D293D]" : "text-[#90A1B9]"}>
                      {imageFile ? imageFile.name : (imagePreview && imagePreview.startsWith("http") ? "Change existing image" : "Attach image (Optional)")}
                    </span>
                  </button>
                  {imagePreview && (
                    <div className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[14px] border border-[#F1F5F9] shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Branch Selection Area */}
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="mb-3 flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-[#90A1B9]" />
                  <label className="font-['Inter'] text-[12px] font-bold uppercase tracking-wider text-[#90A1B9]">
                    Select Branches <span className="text-[#F43F5E]">*</span>
                  </label>
                </div>

                <div className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-[17px] pb-1 overflow-y-auto .scrollbar-subtle">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {/* All Branches Option */}
                    <div
                      onClick={() => {
                        setIsForAllBranches(true);
                        setSelectedBranchIds([]);
                      }}
                      className={`flex h-16 cursor-pointer items-center gap-3 rounded-[10px] border-2 px-3 transition-all ${
                        isForAllBranches
                          ? "border-[#EA580C] bg-white shadow-sm"
                          : "border-[#E2E8F0] bg-white hover:border-[#EA580C]/30"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 shrink-0 rounded-full border-2 transition-all flex items-center justify-center ${
                          isForAllBranches ? "border-[#EA580C]" : "border-[#CAD5E2]"
                        }`}
                      >
                        {isForAllBranches && (
                          <div className="h-2.5 w-2.5 rounded-full bg-[#EA580C]" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="font-['Inter'] text-sm font-bold text-[#314158]">
                          All Branches
                        </p>
                        <p className="font-['Inter'] text-[12px] font-medium text-[#90A1B9]">
                          Apply everywhere
                        </p>
                      </div>
                    </div>

                    {/* Individual Branches */}
                    {branches?.map((branch) => {
                      const isSelected = !isForAllBranches && selectedBranchIds.includes(branch.id);
                      return (
                        <div
                          key={branch.id}
                          onClick={() => {
                            setIsForAllBranches(false);
                            setSelectedBranchIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== branch.id)
                                : [...prev, branch.id]
                            );
                          }}
                          className={`flex h-16 cursor-pointer items-center gap-3 rounded-[10px] border-2 px-3 transition-all ${
                            isSelected
                              ? "border-[#EA580C] bg-white shadow-sm"
                              : "border-[#E2E8F0] bg-white hover:border-[#EA580C]/30"
                          }`}
                        >
                          <div
                            className={`h-5 w-5 shrink-0 rounded-full border-2 transition-all flex items-center justify-center ${
                              isSelected ? "border-[#EA580C]" : "border-[#CAD5E2]"
                            }`}
                          >
                            {isSelected && (
                              <div className="h-2.5 w-2.5 rounded-full bg-[#EA580C]" />
                            )}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <p className="font-['Inter'] text-sm font-bold text-[#314158] truncate">
                              {branch.name}
                            </p>
                            <p className="font-['Inter'] text-[12px] font-medium text-[#90A1B9] truncate">
                              {branch.location || "Branch Address"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 1 Footer Actions */}
              <div className="shrink-0 flex items-center gap-4 mt-auto border-t border-[#F1F5F9] pt-6 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-[58px] flex-[0.5] rounded-[16px] border border-[#E2E8F0] bg-white font-['Inter'] text-[16px] font-bold text-[#45556C] transition-all hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[58px] flex-[0.5] rounded-[16px] bg-[#EA580C] font-['Inter'] text-[16px] font-bold text-white shadow-[0px_20px_25px_-5px_rgba(234,88,12,0.2),0px_8px_10px_-6px_rgba(234,88,12,0.2)] transition-all hover:bg-[#c2410c]"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2 scrollbar-subtle">
                {activeBranches.map((branch) => (
                  <BranchAccordionContent
                    key={branch.id}
                    branch={branch}
                    isExpanded={expandedBranchId === branch.id}
                    onToggleExpand={() =>
                      setExpandedBranchId(expandedBranchId === branch.id ? null : branch.id)
                    }
                    selectedProducts={selectedProductsByBranch[branch.id] || []}
                    onToggleSelect={(p, v, price) => handleToggleSelect(p, v, branch.id, price)}
                    onRemoveItem={(pid, vid) => {
                      setSelectedProductsByBranch((prev) => ({
                        ...prev,
                        [branch.id]: prev[branch.id].filter(
                          (s: any) => !(s.productId === pid && s.variationOptionId === vid)
                        ),
                      }));
                    }}
                    onUpdateQty={(pid, vid, d) => updateQty(pid, vid, d, branch.id)}
                    comboPrice={comboPricesByBranch[branch.id] || 0}
                    onPriceChange={(val) =>
                      setComboPricesByBranch((prev) => ({ ...prev, [branch.id]: val }))
                    }
                    onSyncItems={(items) =>
                      setSelectedProductsByBranch((prev) => ({ ...prev, [branch.id]: items }))
                    }
                    originalPrice={getOriginalPriceForBranch(
                      branch.id,
                      selectedProductsByBranch[branch.id] || []
                    )}
                    allModifications={allModifications}
                    expandedItems={expandedItems}
                    setExpandedItems={setExpandedItems}
                    addOnSearch={addOnSearch}
                    setAddOnSearch={setAddOnSearch}
                    onToggleAddOn={(pIdx, addOn) => toggleAddOn(branch.id, pIdx, addOn)}
                    onUpdateAddOnQty={(pIdx, addOnId, d) => updateAddOnQty(branch.id, pIdx, addOnId, d)}
                  />
                ))}
              </div>

              {/* Step 2 Footer Actions */}
              <div className="shrink-0 flex items-center gap-4 border-t border-[#F1F5F9] pt-6 w-full">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-[58px] flex-[0.5] rounded-[16px] border border-[#E2E8F0] bg-white font-['Inter'] text-[16px] font-bold text-[#45556C] transition-all hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-[58px] flex-[0.5] rounded-[16px] bg-[#EA580C] font-['Inter'] text-[16px] font-bold text-white shadow-[0px_20px_25px_-5px_rgba(234,88,12,0.2),0px_8px_10px_-6px_rgba(234,88,12,0.2)] transition-all hover:bg-[#c2410c] disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
                  {isEditing ? "Update Combo Pack" : "Create Combo Pack"}
                </button>
              </div>
            </>
          )}

          <button type="submit" className="hidden" />
        </form>
      </div>
    </div>
  );
}

function BranchAccordionContent({
  branch,
  isExpanded,
  onToggleExpand,
  selectedProducts,
  onToggleSelect,
  onRemoveItem,
  onUpdateQty,
  comboPrice,
  onPriceChange,
  originalPrice,
  onSyncItems,
  allModifications,
  expandedItems,
  setExpandedItems,
  addOnSearch,
  setAddOnSearch,
  onToggleAddOn,
  onUpdateAddOnQty,
}: {
  branch: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedProducts: any[];
  onToggleSelect: (product: Product, variant: VariationOption | undefined, price: number) => void;
  onRemoveItem: (pid: number, vid: number | undefined) => void;
  onUpdateQty: (pid: number, vid: number | undefined, d: number) => void;
  comboPrice: number;
  onPriceChange: (val: number) => void;
  originalPrice: number;
  onSyncItems: (items: any[]) => void;
  allModifications: any[];
  expandedItems: Record<string, boolean>;
  setExpandedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  addOnSearch: string;
  setAddOnSearch: React.Dispatch<React.SetStateAction<string>>;
  onToggleAddOn: (pIdx: number, addOn: any) => void;
  onUpdateAddOnQty: (pIdx: number, addOnId: string | number, d: number) => void;
}) {
  const { data: products, isLoading } = useGetProductsByBranch(branch.id, { status: "active" });
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  const getPriceForBranch = useCallback(
    (product: Product, variationOptionId: number | undefined, fallbackPrice: number = 0) => {
      const variant =
        product.variations?.[0]?.options?.find((o) => o.id === variationOptionId) ||
        product.variations?.[0]?.options?.[0];
      const branchPrice = variant?.prices?.find((p) => p.branchId === branch.id);

      return Number(branchPrice?.price || variant?.prices?.[0]?.price || fallbackPrice || 0);
    },
    [branch.id]
  );

  const branchTotal = useMemo(() => {
    const calculatedTotal = selectedProducts.reduce((sum, p) => {
      const product = products?.find((prod) => prod.id === p.productId);
      const currentPrice = product
        ? getPriceForBranch(product, p.variationOptionId, p.price)
        : p.price;

      const baseTotal = currentPrice * p.qty;
      const modsTotal = (p.modifications || []).reduce(
        (mSum: number, m: any) => mSum + m.price * m.qty,
        0
      );

      return sum + baseTotal + modsTotal * p.qty;
    }, 0);

    return calculatedTotal || originalPrice || 0;
  }, [selectedProducts, products, getPriceForBranch, originalPrice]);


  useEffect(() => {
    if (products && products.length > 0 && selectedProducts.length > 0) {
      let needsSync = false;
      const updatedProducts = selectedProducts.map((p) => {
        const product = products.find((prod) => prod.id === p.productId);
        if (product) {
          const currentPrice = getPriceForBranch(product, p.variationOptionId, p.price);
          if (currentPrice !== p.price) {
            needsSync = true;
            return { ...p, price: currentPrice };
          }
        }
        return p;
      });

      if (needsSync) {
        onSyncItems(updatedProducts);
      }
    }
  }, [products, selectedProducts, getPriceForBranch, onSyncItems]);

  return (
    <div className="flex flex-col overflow-hidden rounded-[16px] border border-[#E2E8F0]">
      {/* Branch Accordion Header */}
      <div
        onClick={onToggleExpand}
        className={`flex cursor-pointer items-center justify-between py-3 px-6 transition-all ${
          isExpanded
            ? "h-[86px] bg-white shadow-[0px_10px_30px_rgba(0,0,0,0.08)] border-b border-[#F1F5F9]"
            : "h-[110px] bg-[#F8FAFC] hover:bg-[#F1F5F9]"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center justify-center rounded-xl bg-white text-[#45556C] shadow-sm transition-all ${isExpanded ? "h-12 w-12" : "h-10 w-10"}`}
          >
            <svg
              width={isExpanded ? "22" : "18"}
              height={isExpanded ? "22" : "18"}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 21H21M3 7V17H4V21M20 21V17H21V7H20M12 3L2 7V10H3V17H4M4 17V10H20V17M12 3L22 7V10H21V17M20 17H21M4 17H20M15 10V17M12 10V17M9 10V17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span
              className={`font-['Inter'] font-bold text-[#1D293D] transition-all ${isExpanded ? "text-lg" : "text-base"}`}
            >
              {branch.name}
            </span>
            <span
              className={`font-['Inter'] font-medium text-[#62748E] transition-all ${isExpanded ? "text-sm" : "text-xs"}`}
            >
              {branch.location || "Branch Address"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {selectedProducts.length > 0 && !isExpanded && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase text-[#94A3B8]">
                Branch Original Value
              </span>
              <span className="text-sm font-bold text-[#1D293D]">
                Rs. {branchTotal.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex h-5 w-5 items-center justify-center text-[#0A0A0A]">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-6 p-6 bg-white border-t border-[#E2E8F0] max-h-[600px] overflow-y-auto scrollbar-subtle scroll-smooth">
          <div className="flex gap-6">
            {/* Left Panel: Available Products */}
            <div className="flex w-[528px] h-[408px] flex-col gap-[12px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-[16px]">
              <div className="flex flex-col gap-[8px] shrink-0">
                <h3 className="font-['Inter'] text-[12px] font-bold uppercase text-[#314158] leading-[16px]">
                  Available Products
                </h3>
                <div className="relative">
                  <Search className="absolute left-[12px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-[#90A1B9]" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-[38px] w-full rounded-[10px] border border-[#E2E8F0] bg-[#FFFFFF] pl-[36px] pr-[16px] font-['Inter'] text-[14px] text-[#1D293D] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#EA580C] focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#EA580C]" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-subtle flex flex-col gap-[8px]">
                  {products
                    ?.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((p) => {
                      const variants = p.variations?.[0]?.options || [];
                      const hasVariants = variants.length > 1;
                      const isProductExpanded = expandedProduct === p.id;
                      const isProductSelected = (productId: number, variantId?: number) =>
                        selectedProducts.some(
                          (s) => s.productId === productId && s.variationOptionId === variantId
                        );

                      const anySelected = hasVariants
                        ? variants.some((v) => isProductSelected(p.id, v.id))
                        : isProductSelected(p.id, variants[0]?.id);

                      return (
                        <div key={p.id} className="flex flex-col gap-[8px]">
                          <div
                            onClick={() => {
                              if (hasVariants) setExpandedProduct(isProductExpanded ? null : p.id);
                              else
                                onToggleSelect(
                                  p,
                                  variants[0],
                                  getPriceForBranch(p, variants[0]?.id)
                                );
                            }}
                            className={`flex h-[74px] cursor-pointer items-center justify-between rounded-[10px] border px-[12px] transition-all shrink-0 ${
                              anySelected && !hasVariants
                                ? "border-[#E2E8F0] bg-[#F1F5F9] opacity-70"
                                : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                            }`}
                          >
                            <div className="flex items-center gap-[12px] overflow-hidden">
                              <div className="h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[10px] border border-[#E2E8F0] bg-[#F1F5F9]">
                                {p.image ? (
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[#94A3B8]">
                                    <Package className="h-[20px] w-[20px]" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="truncate font-['Inter'] text-[14px] font-bold text-[#1D293D] leading-[20px]">
                                  {p.name}
                                </span>
                                <span className="font-['Inter'] text-[12px] font-medium text-[#90A1B9] leading-[16px]">
                                  {hasVariants
                                    ? `${variants.length} Options`
                                    : `Rs. ${getPriceForBranch(p, variants[0]?.id).toFixed(2)}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {anySelected && !hasVariants && (
                                <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#009966] text-[#009966]">
                                  <Check className="h-[12px] w-[12px]" strokeWidth={3} />
                                </div>
                              )}
                              {hasVariants && (
                                <div
                                  className={`transition-transform duration-200 ${isProductExpanded ? "rotate-180" : ""}`}
                                >
                                  <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
                                </div>
                              )}
                            </div>
                          </div>

                          {hasVariants && isProductExpanded && (
                            <div className="ml-[20px] flex flex-col gap-[8px] border-l-2 border-[#F1F5F9] pl-[12px] py-[4px]">
                              {variants.map((v) => {
                                const isVariantSelected = isProductSelected(p.id, v.id);
                                const branchPrice = getPriceForBranch(p, v.id);
                                return (
                                  <div
                                    key={v.id}
                                    onClick={() => onToggleSelect(p, v, branchPrice)}
                                    className={`flex h-[54px] cursor-pointer items-center justify-between rounded-[10px] border px-[12px] transition-all shrink-0 ${
                                      isVariantSelected
                                        ? "border-[#E2E8F0] bg-[#F1F5F9] opacity-70"
                                        : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                                    }`}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-['Inter'] text-[13px] font-bold text-[#45556C]">
                                        {v.name}
                                      </span>
                                      <span className="font-['Inter'] text-[11px] font-medium text-[#90A1B9]">
                                        Rs. {branchPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    {isVariantSelected && (
                                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#009966] text-[#009966]">
                                        <Check className="h-[12px] w-[12px]" strokeWidth={3} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Right Panel: Selected Combo Products */}
            <div className="flex w-[528px] h-[408px] flex-col gap-[12px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-[16px]">
              <div className="flex flex-col gap-[4px] shrink-0">
                <h3 className="font-['Inter'] text-[12px] font-bold uppercase text-[#314158] leading-[16px]">
                  Combo Products
                </h3>
                <p className="font-['Inter'] text-[12px] font-normal text-[#62748E] leading-[16px]">
                  {selectedProducts.length} product(s) selected
                </p>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 scrollbar-subtle flex flex-col gap-[12px]">
                {selectedProducts.map((p, pIdx) => {
                  const product = products?.find((prod) => prod.id === p.productId);
                  const currentPrice = product
                    ? getPriceForBranch(product, p.variationOptionId)
                    : p.price;

                  const expansionKey = `${branch.id}-${p.productId}-${p.variationOptionId}`;
                  const isExpanded = expandedItems[expansionKey];

                  const availableAddOns = product ? collectAddOns(product, allModifications) : [];
                  const filteredAddOns = availableAddOns.filter((a) =>
                    a.name.toLowerCase().includes(addOnSearch.toLowerCase())
                  );

                  return (
                    <div
                      key={`${p.productId}-${p.variationOptionId}`}
                      className="flex flex-col gap-[12px] rounded-[14px] border border-[#E2E8F0] bg-[#FFFFFF] p-[13px] shrink-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-[4px]">
                          <span className="font-['Inter'] text-[14px] font-bold text-[#1D293D] leading-[20px]">
                            {p.name}
                          </span>
                          <span className="font-['Inter'] text-[12px] font-normal text-[#62748E] leading-[16px]">
                            Rs. {currentPrice.toFixed(2)} each
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(p.productId, p.variationOptionId)}
                          className="p-[4px] text-[#90A1B9] hover:text-[#EC003F] transition-colors"
                        >
                          <X className="h-[16px] w-[16px]" strokeWidth={2.5} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[8px]">
                          <span className="font-['Inter'] text-[12px] font-bold text-[#62748E]">
                            Quantity:
                          </span>
                          <div className="flex h-[32px] w-[104px] items-center rounded-[10px] bg-[#F1F5F9] px-[4px] gap-[8px]">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(p.productId, p.variationOptionId, -1)}
                              className="flex h-[24px] w-[24px] items-center justify-center rounded-[4px] hover:bg-white transition-all text-[#45556C]"
                            >
                              <Minus className="h-[14px] w-[14px]" />
                            </button>
                            <span className="flex-1 text-center font-['Inter'] text-[14px] font-bold text-[#1D293D]">
                              {p.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(p.productId, p.variationOptionId, 1)}
                              className="flex h-[24px] w-[24px] items-center justify-center rounded-[4px] hover:bg-white transition-all text-[#45556C]"
                            >
                              <Plus className="h-[14px] w-[14px]" />
                            </button>
                          </div>
                        </div>

                        {availableAddOns.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedItems((prev) => ({
                                ...prev,
                                [expansionKey]: !isExpanded,
                              }))
                            }
                            className="flex items-center gap-1 text-[12px] font-bold text-primary hover:opacity-80"
                          >
                            Add-ons{" "}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        <p className="font-['Inter'] text-[14px] font-bold text-[#1D293D] text-right">
                          Rs.{" "}
                          {(
                            (currentPrice +
                              (p.modifications || []).reduce(
                                (mSum: number, m: any) => mSum + m.price * m.qty,
                                0
                              )) *
                            p.qty
                          ).toFixed(2)}
                        </p>
                      </div>

                      {isExpanded && availableAddOns.length > 0 && (
                        <div className="mt-4 border-t border-[#E2E8F0] pt-4 animate-in slide-in-from-top-2 duration-200">
                          <div className="mb-3 flex items-center gap-3">
                            <p className="shrink-0 font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#90A1B9]">
                              ADD-ONS
                            </p>
                            <div className="relative flex-1">
                              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                              <input
                                type="text"
                                placeholder="Search..."
                                value={addOnSearch}
                                onChange={(e) => setAddOnSearch(e.target.value)}
                                className="w-full rounded-[10px] border border-[#E2E8F0] bg-[#F1F5F9] py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-hide">
                            {filteredAddOns.map((addOn) => {
                              const selected = (p.modifications || []).find(
                                (m: any) => m.id === Number(addOn.id)
                              );
                              return (
                                <div
                                  key={addOn.id}
                                  className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                                    selected
                                      ? "border-primary bg-primary-muted"
                                      : "border-[#E2E8F0] bg-white hover:border-zinc-300"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => onToggleAddOn(pIdx, addOn)}
                                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                                  >
                                    <div
                                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                        selected ? "border-primary bg-primary" : "border-zinc-300"
                                      }`}
                                    >
                                      {selected && <Check className="h-2.5 w-2.5 text-white" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-bold text-zinc-800">
                                        {addOn.name}
                                      </p>
                                      <p className="text-[10px] font-medium text-zinc-500">
                                        +{addOn.price.toFixed(2)} LKR
                                      </p>
                                    </div>
                                  </button>

                                  {selected && (
                                    <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-1.5 py-0.5 shadow-sm">
                                      <button
                                        type="button"
                                        onClick={() => onUpdateAddOnQty(pIdx, addOn.id, -1)}
                                        className="py-0.5 text-[#90A1B9] hover:text-zinc-700 transition-colors"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span className="min-w-[14px] text-center text-[11px] font-black text-[#1D293D]">
                                        {selected.qty}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => onUpdateAddOnQty(pIdx, addOn.id, 1)}
                                        className="py-0.5 text-[#90A1B9] hover:text-primary transition-colors"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Panel Footer: Total Value */}
              <div className="shrink-0 pt-[13px] border-t border-[#E2E8F0] mt-auto flex items-center justify-between">
                <span className="font-['Inter'] text-[14px] font-bold text-[#45556C]">
                  Total Value:
                </span>
                <span className="font-['Inter'] text-[14px] font-bold text-[#1D293D]">
                  Rs. {branchTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Bar */}
          <div className="shrink-0 mt-6 flex items-center p-6 rounded-[16px] border border-[#E2E8F0] bg-gradient-to-r from-[#ECFDF5] to-[#EFF6FF] w-full">
            <div className="flex-1">
              <p className="text-[12px] font-bold uppercase text-[#45556C]">Original Price</p>
              <p className="text-[24px] font-bold text-[#94A3B8] line-through">
                Rs. {branchTotal.toFixed(2)}
              </p>
            </div>

            <div className="flex-[1.5] px-6 border-x border-[#E2E8F0]">
              <label className="text-[12px] font-bold uppercase text-[#45556C]">
                Combo Price *
              </label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#94A3B8]">
                  Rs.
                </span>
                <input
                  type="number"
                  value={comboPrice || ""}
                  onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="h-[54px] w-full rounded-[14px] border border-[#E2E8F0] bg-white pl-12 pr-4 text-[18px] font-bold text-[#1D293D] focus:border-[#EA580C] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 text-right pl-6">
              <p className="text-[12px] font-bold uppercase text-[#45556C]">Customer Saves</p>
              <p className="text-[20px] font-bold text-[#059669]">
                Rs. {Math.max(0, branchTotal - comboPrice).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
