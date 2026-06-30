"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  Search,
  Check,
  Calendar,
  Package,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { type Product } from "@/types/product";
import { useGetAllProducts } from "@/hooks/useProduct";
import { useGetAllBranches } from "@/hooks/useBranch";
import { useCreateBogoPromotion, useUpdateBogoPromotion, useGetBogoPromotionById } from "@/hooks/useBogoPromotion";
import { BogoPromotion } from "@/types/bogoPromotion";

type AddBogoModalProps = {
  open: boolean;
  overlayVisible: boolean;
  onClose: () => void;
  editingBogo?: BogoPromotion | null;
};

type SelectedBogoItem = {
  product: import("@/types/product").Product;
  variant?: import("@/types/product").VariationOption;
};

type SelectedBogoItemWithQty = SelectedBogoItem & {
  quantity: number;
};

export default function AddBogoModal({
  open,
  overlayVisible,
  onClose,
  editingBogo,
}: AddBogoModalProps) {
  const { data: products } = useGetAllProducts({ status: "active" });
  const { data: branches } = useGetAllBranches("active");

  const [step, setStep] = useState(1);
  const [promoName, setPromoName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isForAllBranches, setIsForAllBranches] = useState(true);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);

  const [buyQty, setBuyQty] = useState<number>(1);
  const [getQty, setGetQty] = useState<number>(1);

  const [buySearch, setBuySearch] = useState("");
  const [freeSearch, setFreeSearch] = useState("");
  
  const [selectedBuyItems, setSelectedBuyItems] = useState<SelectedBogoItemWithQty[]>([]);
  const [selectedFreeItems, setSelectedFreeItems] = useState<SelectedBogoItemWithQty[]>([]);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview && !imagePreview.startsWith("http")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);
  
  const createMutation = useCreateBogoPromotion();
  const updateMutation = useUpdateBogoPromotion();

  const bogoId = editingBogo?.id || 0;
  const { data: bogoDetails } = useGetBogoPromotionById(bogoId);

  useEffect(() => {
    if (!open) return;

    if (editingBogo) {
      const dataToUse = bogoDetails || editingBogo;
      setPromoName(dataToUse.name);
      setExpiryDate(dataToUse.expiryDate || "");
      setBuyQty(dataToUse.buyQuantity);
      setGetQty(dataToUse.getQuantity);
      
      const hasBranches = dataToUse.branches && dataToUse.branches.length > 0;
      setIsForAllBranches(!hasBranches);
      if (hasBranches) {
        setSelectedBranchIds(dataToUse.branches!.map(b => b.branchId));
      } else {
        setSelectedBranchIds([]);
      }

      if (dataToUse.buyProduct) {
        setSelectedBuyItems([{ 
          product: dataToUse.buyProduct, 
          variant: dataToUse.buyVariationOption, 
          quantity: dataToUse.buyQuantity 
        }]);
      }
      if (dataToUse.getProduct) {
        setSelectedFreeItems([{ 
          product: dataToUse.getProduct, 
          variant: dataToUse.getVariationOption, 
          quantity: dataToUse.getQuantity 
        }]);
      }
      if (dataToUse.image) {
        setImagePreview(dataToUse.image);
      }
    } else {
      setPromoName("");
      setExpiryDate("");
      setBuyQty(1);
      setGetQty(1);
      setIsForAllBranches(true);
      setSelectedBranchIds([]);
      setSelectedBuyItems([]);
      setSelectedFreeItems([]);
      setImageFile(null);
      setImagePreview("");
      setStep(1);
    }
  }, [editingBogo, bogoDetails, open]);

  const [expandedBuyProduct, setExpandedBuyProduct] = useState<number | null>(null);
  const [expandedFreeProduct, setExpandedFreeProduct] = useState<number | null>(null);

  const buyTotalSelected = selectedBuyItems.reduce((sum, item) => sum + item.quantity, 0);
  const freeTotalSelected = selectedFreeItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelectBuyItem = (product: Product, variant?: any) => {
    setSelectedBuyItems(prev => {
      const existingIndex = prev.findIndex(i => i.product.id === product.id && i.variant?.id === variant?.id);
      if (existingIndex > -1) {
        // Increment if space available
        if (buyTotalSelected < buyQty) {
          const newItems = [...prev];
          newItems[existingIndex].quantity += 1;
          return newItems;
        }
        return prev;
      }
      // Add new if space available
      if (buyTotalSelected < buyQty) {
        return [...prev, { product, variant, quantity: 1 }];
      }
      return prev;
    });
  };

  const handleSelectFreeItem = (product: Product, variant?: any) => {
    setSelectedFreeItems(prev => {
      const existingIndex = prev.findIndex(i => i.product.id === product.id && i.variant?.id === variant?.id);
      if (existingIndex > -1) {
        if (freeTotalSelected < getQty) {
          const newItems = [...prev];
          newItems[existingIndex].quantity += 1;
          return newItems;
        }
        return prev;
      }
      if (freeTotalSelected < getQty) {
        return [...prev, { product, variant, quantity: 1 }];
      }
      return prev;
    });
  };

  const updateBuyItemQty = (index: number, delta: number) => {
    setSelectedBuyItems(prev => {
      const newItems = [...prev];
      const newQty = newItems[index].quantity + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== index);
      if (delta > 0 && buyTotalSelected >= buyQty) return prev;
      newItems[index].quantity = newQty;
      return newItems;
    });
  };

  const updateFreeItemQty = (index: number, delta: number) => {
    setSelectedFreeItems(prev => {
      const newItems = [...prev];
      const newQty = newItems[index].quantity + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== index);
      if (delta > 0 && freeTotalSelected >= getQty) return prev;
      newItems[index].quantity = newQty;
      return newItems;
    });
  };

  const isEditing = !!editingBogo;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const filteredBuyProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(buySearch.toLowerCase())
  ) || [];

  const filteredFreeProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(freeSearch.toLowerCase())
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    
    if (selectedBuyItems.length === 0 || selectedFreeItems.length === 0) {
      toast.error("Please select at least one buy product and one free product.");
      return;
    }

    const payload = {
        name: promoName,
        expiryDate: expiryDate || undefined,
        buyQuantity: buyQty,
        getQuantity: getQty,
        buyProductId: selectedBuyItems[0].product.id,
        buyVariationOptionId: selectedBuyItems[0].variant?.id || undefined,
        getProductId: selectedFreeItems[0].product.id,
        getVariationOptionId: selectedFreeItems[0].variant?.id || undefined,
        branches: isForAllBranches ? [] : selectedBranchIds,
        image: imagePreview && imagePreview.startsWith("http") ? imagePreview : undefined
    };

    if (isEditing && editingBogo) {
        updateMutation.mutate({ id: editingBogo.id, data: payload, imageFile: imageFile || undefined }, {
            onSuccess: () => {
                toast.success("BOGO promotion updated successfully!");
                onClose();
            },
            onError: (error: any) => {
                const msg = error.response?.data?.message || "Failed to update promotion";
                toast.error(msg);
            }
        });
    } else {
        createMutation.mutate({ data: payload, imageFile: imageFile || undefined }, {
            onSuccess: () => {
                toast.success("BOGO promotion created successfully!");
                onClose();
            },
            onError: (error: any) => {
                const msg = error.response?.data?.message || "Failed to create promotion";
                toast.error(msg);
            }
        });
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
              Create BOGO Promotion
            </h2>
            <p className="mt-1 font-['Inter'] text-sm text-[#94A3B8]">
              Set up a Buy One Get One offer
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

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
          {step === 1 ? (
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2 scrollbar-subtle">
              <div className="grid shrink-0 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 font-['Inter'] text-[12px] font-bold uppercase leading-4 tracking-normal text-[#90A1B9]">
                    Promotion Name <span className="text-[#F43F5E]">*</span>
                  </label>
                  <input
                    type="text"
                    value={promoName}
                    onChange={(e) => setPromoName(e.target.value)}
                    placeholder="e.g. Pizza Tuesday, Burger Bonanza"
                    className="h-[46px] w-full rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#EA580C] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 font-['Inter'] text-[12px] font-bold uppercase leading-4 tracking-normal text-[#90A1B9]">
                    Expiry Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="h-[46px] w-full rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] pl-10 pr-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#EA580C] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 font-['Inter'] text-[12px] font-bold uppercase leading-4 tracking-normal text-[#90A1B9]">
                  Promotion Image
                </label>
                <div className="flex items-center gap-3">
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
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 h-[46px] font-['Inter'] text-sm text-left transition-colors hover:border-[#CAD5E2] focus:border-[#EA580C] focus:outline-none"
                  >
                    <span className={imageFile || (imagePreview && imagePreview.startsWith("http")) ? "min-w-0 truncate text-[#1D293D]" : "text-[#90A1B9]"}>
                      {imageFile ? imageFile.name : (imagePreview && imagePreview.startsWith("http") ? "Change existing image" : "Attach Image here")}
                    </span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-auto shrink-0">
                      <path d="M5 21C4.45 21 3.97933 20.8043 3.588 20.413C3.19667 20.0217 3.00067 19.5507 3 19V5C3 4.45 3.196 3.97933 3.588 3.588C3.98 3.19667 4.45067 3.00067 5 3H19C19.55 3 20.021 3.196 20.413 3.588C20.805 3.98 21.0007 4.45067 21 5V19C21 19.55 20.8043 20.413 20.413 20.413C20.0217 20.805 19.5507 21.0007 19 21H5ZM5 19H19V5H5V19ZM6 17H18L14.25 12L11.25 16L9 13L6 17Z" fill="#8F8F8F"/>
                    </svg>
                  </button>
                  {imagePreview && (
                    <div className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[14px] border border-[#F1F5F9]">
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

              <div className="flex shrink-0 flex-col overflow-hidden">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.5 1.16667V3.5M3.5 3.5H10.5M3.5 3.5L1.16667 7M10.5 3.5V1.16667M10.5 3.5L12.8333 7M1.16667 7V12.8333H12.8333V7M1.16667 7H12.8333M5.83333 7V12.8333M8.16667 7V12.8333" stroke="#90A1B9" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <label className="font-['Inter'] text-[12px] font-bold uppercase leading-4 tracking-normal text-[#90A1B9]">
                    Select Branches <span className="text-[#F43F5E]">*</span>
                  </label>
                </div>
                
                <div className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-[17px]">
                  <div className="grid grid-cols-2 gap-[12px] overflow-y-auto pr-2 pb-1 scrollbar-subtle">
                    <div
                      onClick={() => {
                        setIsForAllBranches(true);
                        setSelectedBranchIds([]);
                      }}
                      className={`flex h-[64px] cursor-pointer items-center gap-[12px] rounded-[10px] border-2 px-[12px] transition-all outline-none ${
                        isForAllBranches
                          ? "border-[#EA580C] bg-white shadow-sm"
                          : "border-[#E2E8F0] bg-white hover:border-[#EA580C]/30"
                      }`}
                    >
                      <div className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isForAllBranches ? "border-[#EA580C]" : "border-[#CAD5E2]"
                      }`}>
                        {isForAllBranches && <div className="h-[10px] w-[10px] rounded-full bg-[#EA580C]" />}
                      </div>
                      <div className="flex flex-col">
                        <p className="font-['Inter'] text-sm font-bold text-[#314158]">All Branches</p>
                        <p className="font-['Inter'] text-[12px] font-medium text-[#90A1B9]">Apply everywhere</p>
                      </div>
                    </div>

                    {branches?.map((branch: any) => {
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
                          className={`flex h-[64px] cursor-pointer items-center gap-[12px] rounded-[10px] border-2 px-[12px] transition-all outline-none ${
                            isSelected
                              ? "border-[#EA580C] bg-white shadow-sm"
                              : "border-[#E2E8F0] bg-white hover:border-[#EA580C]/30"
                          }`}
                        >
                          <div className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            isSelected ? "border-[#EA580C]" : "border-[#CAD5E2]"
                          }`}>
                            {isSelected && <div className="h-[10px] w-[10px] rounded-full bg-[#EA580C]" />}
                          </div>
                          <div className="flex flex-col">
                            <p className="font-['Inter'] text-sm font-bold text-[#314158]">{branch.name}</p>
                            <p className="font-['Inter'] text-[12px] font-medium text-[#90A1B9] truncate">
                              {branch.location || (branch.id === 1 ? "123 Main St" : branch.id === 5 ? "456 West Ave" : "789 Airport Rd")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BOGO Configuration Section */}
              <div className="flex flex-col gap-[12px]">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.75 4.66667V11.6667H12.25V4.66667M1.75 4.66667L7 1.75L12.25 4.66667M1.75 4.66667H12.25M7 4.66667V11.6667M2.91667 7H11.0833M2.91667 9.33333H11.0833" stroke="#90A1B9" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <label className="font-['Inter'] text-[12px] font-bold uppercase leading-4 tracking-normal text-[#90A1B9]">
                    BOGO Configuration <span className="text-[#F43F5E]">*</span>
                  </label>
                </div>
                
                <div className="rounded-[16px] border border-[#E2E8F0] bg-gradient-to-r from-[#FDF2F8] to-[#FAF5FF] p-[25px]">
                  <div className="grid grid-cols-2 gap-[32px]">
                    <div className="flex flex-col gap-2">
                      <p className="font-['Inter'] text-[12px] font-bold uppercase leading-4 tracking-normal text-[#45556C]">Buy Quantity</p>
                      <div className="flex h-[72px] items-center justify-center rounded-[14px] border-2 border-[#FCCEE8] bg-white px-4">
                        <input
                          type="number"
                          value={buyQty}
                          onChange={(e) => setBuyQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-transparent text-center font-['Inter'] text-[30px] font-bold leading-9 text-[#E60076] focus:outline-none"
                        />
                      </div>
                      <p className="text-center font-['Inter'] text-[12px] leading-4 text-[#45556C]">Customer must buy this many</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="font-['Inter'] text-[12px] font-bold uppercase leading-4 tracking-normal text-[#45556C]">Get Free Quantity</p>
                      <div className="flex h-[72px] items-center justify-center rounded-[14px] border-2 border-[#E9D4FF] bg-white px-4">
                        <input
                          type="number"
                          value={getQty}
                          onChange={(e) => setGetQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-transparent text-center font-['Inter'] text-[30px] font-bold leading-9 text-[#9810FA] focus:outline-none"
                        />
                      </div>
                      <p className="text-center font-['Inter'] text-[12px] leading-4 text-[#45556C]">Customer gets this many free</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
           ) : (
            <div className="flex flex-1 flex-col gap-[24px] overflow-y-auto pr-2 scrollbar-subtle">
              {/* Select Buy Product */}
              <div className="flex flex-col gap-[12px]">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.75 4.66667L1.75 12.25H12.25V4.66667M1.75 4.66667L7 1.75L12.25 4.66667M1.75 4.66667H12.25M7 7V12.25M1.91917 4.08333L12.0808 6.91667M4.375 2.16667L4.375 2.5C4.375 3.19036 4.93464 3.75 5.625 3.75H8.375C9.06536 3.75 9.625 3.19036 9.625 2.5V2.16667" stroke="#90A1B9" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <label className="font-['Inter'] text-[12px] font-bold uppercase leading-4 tracking-normal text-[#90A1B9]">
                    Select Buy Product <span className="text-[#F43F5E]">*</span>
                  </label>
                </div>

                <div className="flex flex-col gap-3 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-[17px]">
                  <div className="relative">
                    <Search className="absolute left-[12px] top-[11px] h-4 w-4 text-[#90A1B9]" />
                    <input
                      type="text"
                      value={buySearch}
                      onChange={(e) => setBuySearch(e.target.value)}
                      placeholder="Search products..."
                      className="h-[38px] w-full rounded-[10px] border border-[#E2E8F0] bg-white pl-10 pr-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#EA580C] focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-[12px] max-h-[400px] overflow-y-auto pr-2 pb-1 scrollbar-subtle">
                    <div className="flex flex-1 flex-col gap-[12px]">
                      {filteredBuyProducts.filter((_, i) => i % 2 === 0).map((p) => {
                        const variants = p.variations?.[0]?.options || [];
                        const hasVariants = variants.length > 1;
                        const isExpanded = expandedBuyProduct === p.id;
                        const selectedInstances = selectedBuyItems.filter(i => i.product.id === p.id);
                        const totalQtyForProduct = selectedInstances.reduce((sum, i) => sum + i.quantity, 0);
                        const isPartiallySelected = totalQtyForProduct > 0;
                        const isFullySelected = !hasVariants && totalQtyForProduct >= buyQty;
                        
                        return (
                          <div key={p.id} className="flex flex-col gap-2">
                            <div 
                              onClick={() => {
                                if (hasVariants) setExpandedBuyProduct(isExpanded ? null : p.id);
                                else handleSelectBuyItem(p);
                              }}
                              className={`flex min-h-[76px] cursor-pointer items-center gap-[12px] rounded-[10px] border-2 px-[12px] py-3 transition-all ${
                                isPartiallySelected 
                                  ? "border-[#E60076] bg-[rgba(230,0,118,0.05)] shadow-sm" 
                                  : "border-[#E2E8F0] bg-white hover:border-[#E60076]/20"
                              }`}
                            >
                              <div className="h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[10px] border border-[#E2E8F0]">
                                <Image 
                                  src={p.image || "/product-placeholder.jpg"} 
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover" 
                                  alt={p.name} 
                                  unoptimized
                                />
                              </div>
                              <div className="flex flex-1 flex-col overflow-hidden">
                                  <p className="truncate font-['Inter'] text-sm font-bold text-[#1D293D]">{p.name}</p>
                                  {hasVariants && <p className="font-['Inter'] text-[12px] font-medium text-[#90A1B9]">{variants.length} Variants</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                {isPartiallySelected && (
                                    <div className="flex items-center gap-1.5 rounded-full bg-[#E60076] px-2 py-0.5 text-[10px] font-bold text-white">
                                      {totalQtyForProduct}
                                    </div>
                                  )}
                                  {hasVariants && (
                                    <div className="shrink-0 text-[#90A1B9] bg-[#EA580C1A] rounded-[10px] p-1.5 cursor-pointer">
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-[#EA580C]" /> : <ChevronDown className="h-4 w-4 text-[#EA580C]" />}
                                    </div>
                                  )}
                              </div>
                            </div>
                            
                            {isExpanded && hasVariants && (
                              <div className="ml-2 flex flex-col gap-2 border-l-2 border-[#E2E8F0] pl-3 pb-2">
                                {variants.map(v => {
                                  const selectedVariant = selectedBuyItems.find(i => i.product.id === p.id && i.variant?.id === v.id);
                                  const vQty = selectedVariant?.quantity || 0;
                                  return (
                                    <div 
                                      key={v.id}
                                      onClick={() => handleSelectBuyItem(p, v)}
                                      className={`flex min-h-[50px] cursor-pointer items-center justify-between gap-3 rounded-[10px] border-2 px-3 py-2 transition-all ${
                                        vQty > 0 ? "border-[#E60076] bg-[rgba(230,0,118,0.05)]" : "border-[#E2E8F0] bg-white hover:border-[#E60076]/15"
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <p className="font-['Inter'] text-xs font-bold text-[#1D293D]">{v.name}</p>
                                      </div>
                                      {vQty > 0 && (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E60076] text-[10px] font-bold text-white">
                                          {vQty}
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
                    <div className="flex flex-1 flex-col gap-[12px]">
                      {filteredBuyProducts.filter((_, i) => i % 2 !== 0).map((p) => {
                        const variants = p.variations?.[0]?.options || [];
                        const hasVariants = variants.length > 1;
                        const isExpanded = expandedBuyProduct === p.id;
                        const selectedInstances = selectedBuyItems.filter(i => i.product.id === p.id);
                        const totalQtyForProduct = selectedInstances.reduce((sum, i) => sum + i.quantity, 0);
                        const isPartiallySelected = totalQtyForProduct > 0;
                        
                        return (
                          <div key={p.id} className="flex flex-col gap-2">
                            <div 
                              onClick={() => {
                                if (hasVariants) setExpandedBuyProduct(isExpanded ? null : p.id);
                                else handleSelectBuyItem(p);
                              }}
                              className={`flex min-h-[76px] cursor-pointer items-center gap-[12px] rounded-[10px] border-2 px-[12px] py-3 transition-all ${
                                isPartiallySelected 
                                  ? "border-[#E60076] bg-[rgba(230,0,118,0.05)] shadow-sm" 
                                  : "border-[#E2E8F0] bg-white hover:border-[#E60076]/20"
                              }`}
                            >
                              <div className="h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[10px] border border-[#E2E8F0]">
                                <Image 
                                  src={p.image || "/product-placeholder.jpg"} 
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover" 
                                  alt={p.name} 
                                  unoptimized
                                />
                              </div>
                              <div className="flex flex-1 flex-col overflow-hidden">
                                  <p className="truncate font-['Inter'] text-sm font-bold text-[#1D293D]">{p.name}</p>
                                  {hasVariants && <p className="font-['Inter'] text-[12px] font-medium text-[#90A1B9]">{variants.length} Variants</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                {isPartiallySelected && (
                                    <div className="flex items-center gap-1.5 rounded-full bg-[#E60076] px-2 py-0.5 text-[10px] font-bold text-white">
                                      {totalQtyForProduct}
                                    </div>
                                  )}
                                  {hasVariants && (
                                    <div className="shrink-0 text-[#90A1B9] bg-[#EA580C1A] rounded-[10px] p-1.5 cursor-pointer">
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-[#EA580C]" /> : <ChevronDown className="h-4 w-4 text-[#EA580C]" />}
                                    </div>
                                  )}
                              </div>
                            </div>
                            
                            {isExpanded && hasVariants && (
                              <div className="ml-2 flex flex-col gap-2 border-l-2 border-[#E2E8F0] pl-3 pb-2">
                                {variants.map(v => {
                                  const selectedVariant = selectedBuyItems.find(i => i.product.id === p.id && i.variant?.id === v.id);
                                  const vQty = selectedVariant?.quantity || 0;
                                  return (
                                    <div 
                                      key={v.id}
                                      onClick={() => handleSelectBuyItem(p, v)}
                                      className={`flex min-h-[50px] cursor-pointer items-center justify-between gap-3 rounded-[10px] border-2 px-3 py-2 transition-all ${
                                        vQty > 0 ? "border-[#E60076] bg-[rgba(230,0,118,0.05)]" : "border-[#E2E8F0] bg-white hover:border-[#E60076]/15"
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <p className="font-['Inter'] text-xs font-bold text-[#1D293D]">{v.name}</p>
                                      </div>
                                      {vQty > 0 && (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E60076] text-[10px] font-bold text-white">
                                          {vQty}
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
                  </div>
                </div>
              </div>

              {/* Select Free Product */}
              <div className="flex flex-col gap-[12px]">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.75 4.66667L1.75 12.25H12.25V4.66667M1.75 4.66667L7 1.75L12.25 4.66667M1.75 4.66667H12.25M7 7V12.25M1.91917 4.08333L12.0808 6.91667M4.375 2.16667L4.375 2.5C4.375 3.19036 4.93464 3.75 5.625 3.75H8.375C9.06536 3.75 9.625 3.19036 9.625 2.5V2.16667" stroke="#90A1B9" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <label className="font-['Inter'] text-[12px] font-bold uppercase leading-4 tracking-normal text-[#90A1B9]">
                    Select Free Product <span className="text-[#F43F5E]">*</span>
                  </label>
                </div>

                <div className="flex flex-col gap-3 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-[17px]">
                  <div className="relative">
                    <Search className="absolute left-[12px] top-[11px] h-4 w-4 text-[#90A1B9]" />
                    <input
                      type="text"
                      value={freeSearch}
                      onChange={(e) => setFreeSearch(e.target.value)}
                      placeholder="Search products..."
                      className="h-[38px] w-full rounded-[10px] border border-[#E2E8F0] bg-white pl-10 pr-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#EA580C] focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-[12px] max-h-[400px] overflow-y-auto pr-2 pb-1 scrollbar-subtle">
                    <div className="flex flex-1 flex-col gap-[12px]">
                      {filteredFreeProducts.filter((_, i) => i % 2 === 0).map((p) => {
                        const variants = p.variations?.[0]?.options || [];
                        const hasVariants = variants.length > 1;
                        const isExpanded = expandedFreeProduct === p.id;
                        const selectedInstances = selectedFreeItems.filter(i => i.product.id === p.id);
                        const totalQtyForProduct = selectedInstances.reduce((sum, i) => sum + i.quantity, 0);
                        const isPartiallySelected = totalQtyForProduct > 0;

                        return (
                          <div key={p.id} className="flex flex-col gap-2">
                             <div 
                              onClick={() => {
                                if (hasVariants) setExpandedFreeProduct(isExpanded ? null : p.id);
                                else handleSelectFreeItem(p);
                              }}
                              className={`flex min-h-[76px] cursor-pointer items-center gap-[12px] rounded-[10px] border-2 px-[12px] py-3 transition-all ${
                                isPartiallySelected 
                                  ? "border-[#9810FA] bg-[rgba(152,16,250,0.05)] shadow-sm" 
                                  : "border-[#E2E8F0] bg-white hover:border-[#9810FA]/20"
                              }`}
                            >
                              <div className="h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[10px] border border-[#E2E8F0]">
                                 <Image 
                                  src={p.image || "/product-placeholder.jpg"} 
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover" 
                                  alt={p.name} 
                                  unoptimized
                                />
                              </div>
                              <div className="flex flex-1 flex-col overflow-hidden">
                                  <p className="truncate font-['Inter'] text-sm font-bold text-[#1D293D]">{p.name}</p>
                                  {hasVariants && <p className="font-['Inter'] text-[12px] font-medium text-[#90A1B9]">{variants.length} Variants</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                 {isPartiallySelected && (
                                    <div className="flex items-center gap-1.5 rounded-full bg-[#9810FA] px-2 py-0.5 text-[10px] font-bold text-white">
                                      {totalQtyForProduct}
                                    </div>
                                  )}
                                  {hasVariants && (
                                     <div className="shrink-0 text-[#90A1B9] bg-[#EA580C1A] rounded-[10px] p-1.5 cursor-pointer">
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-[#EA580C]" /> : <ChevronDown className="h-4 w-4 text-[#EA580C]" />}
                                     </div>
                                  )}
                              </div>
                            </div>

                            {isExpanded && hasVariants && (
                              <div className="ml-2 flex flex-col gap-2 border-l-2 border-[#E2E8F0] pl-3 pb-2">
                                {variants.map(v => {
                                  const selectedVariant = selectedFreeItems.find(i => i.product.id === p.id && i.variant?.id === v.id);
                                  const vQty = selectedVariant?.quantity || 0;
                                  return (
                                    <div 
                                      key={v.id}
                                      onClick={() => handleSelectFreeItem(p, v)}
                                      className={`flex min-h-[50px] cursor-pointer items-center justify-between gap-3 rounded-[10px] border-2 px-3 py-2 transition-all ${
                                        vQty > 0 ? "border-[#9810FA] bg-[rgba(152,16,250,0.05)]" : "border-[#E2E8F0] bg-white hover:border-[#9810FA]/15"
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <p className="font-['Inter'] text-xs font-bold text-[#1D293D]">{v.name}</p>
                                      </div>
                                      {vQty > 0 && (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#9810FA] text-[10px] font-bold text-white">
                                          {vQty}
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
                    <div className="flex flex-1 flex-col gap-[12px]">
                      {filteredFreeProducts.filter((_, i) => i % 2 !== 0).map((p) => {
                        const variants = p.variations?.[0]?.options || [];
                        const hasVariants = variants.length > 1;
                        const isExpanded = expandedFreeProduct === p.id;
                        const selectedInstances = selectedFreeItems.filter(i => i.product.id === p.id);
                        const totalQtyForProduct = selectedInstances.reduce((sum, i) => sum + i.quantity, 0);
                        const isPartiallySelected = totalQtyForProduct > 0;

                        return (
                          <div key={p.id} className="flex flex-col gap-2">
                             <div 
                              onClick={() => {
                                if (hasVariants) setExpandedFreeProduct(isExpanded ? null : p.id);
                                else handleSelectFreeItem(p);
                              }}
                              className={`flex min-h-[76px] cursor-pointer items-center gap-[12px] rounded-[10px] border-2 px-[12px] py-3 transition-all ${
                                isPartiallySelected 
                                  ? "border-[#9810FA] bg-[rgba(152,16,250,0.05)] shadow-sm" 
                                  : "border-[#E2E8F0] bg-white hover:border-[#9810FA]/20"
                              }`}
                            >
                              <div className="h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[10px] border border-[#E2E8F0]">
                                 <Image 
                                  src={p.image || "/product-placeholder.jpg"} 
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover" 
                                  alt={p.name} 
                                  unoptimized
                                />
                              </div>
                              <div className="flex flex-1 flex-col overflow-hidden">
                                  <p className="truncate font-['Inter'] text-sm font-bold text-[#1D293D]">{p.name}</p>
                                  {hasVariants && <p className="font-['Inter'] text-[12px] font-medium text-[#90A1B9]">{variants.length} Variants</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                 {isPartiallySelected && (
                                    <div className="flex items-center gap-1.5 rounded-full bg-[#9810FA] px-2 py-0.5 text-[10px] font-bold text-white">
                                      {totalQtyForProduct}
                                    </div>
                                  )}
                                  {hasVariants && (
                                     <div className="shrink-0 text-[#90A1B9] bg-[#EA580C1A] rounded-[10px] p-1.5 cursor-pointer">
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-[#EA580C]" /> : <ChevronDown className="h-4 w-4 text-[#EA580C]" />}
                                     </div>
                                  )}
                              </div>
                            </div>

                            {isExpanded && hasVariants && (
                              <div className="ml-2 flex flex-col gap-2 border-l-2 border-[#E2E8F0] pl-3 pb-2">
                                {variants.map(v => {
                                  const selectedVariant = selectedFreeItems.find(i => i.product.id === p.id && i.variant?.id === v.id);
                                  const vQty = selectedVariant?.quantity || 0;
                                  return (
                                    <div 
                                      key={v.id}
                                      onClick={() => handleSelectFreeItem(p, v)}
                                      className={`flex min-h-[50px] cursor-pointer items-center justify-between gap-3 rounded-[10px] border-2 px-3 py-2 transition-all ${
                                        vQty > 0 ? "border-[#9810FA] bg-[rgba(152,16,250,0.05)]" : "border-[#E2E8F0] bg-white hover:border-[#9810FA]/15"
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <p className="font-['Inter'] text-xs font-bold text-[#1D293D]">{v.name}</p>
                                      </div>
                                      {vQty > 0 && (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#9810FA] text-[10px] font-bold text-white">
                                          {vQty}
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
                  </div>
                </div>
              </div>

              {/* BOGO Summary Section */}
              {(selectedBuyItems.length > 0 || selectedFreeItems.length > 0) && (
                <div className="flex flex-col gap-4 rounded-[16px] border border-[#E2E8F0] bg-gradient-to-r from-[#FDF2F8] to-[#FAF5FF] p-[25px]">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Buy Summary */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="font-['Inter'] text-[12px] font-bold uppercase text-[#E60076]">Buy Products</p>
                        <p className={`font-['Inter'] text-[12px] font-bold ${buyTotalSelected === buyQty || (selectedBuyItems.length === 1) ? 'text-[#009966]' : 'text-[#EA580C]'}`}>
                          {selectedBuyItems.length === 1 ? buyQty : buyTotalSelected} / {buyQty}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[300px] scrollbar-subtle">
                        {selectedBuyItems.map((item, idx) => {
                          const displayQty = selectedBuyItems.length === 1 ? buyQty : item.quantity;
                          return (
                            <div key={idx} className="flex items-center justify-between rounded-[14px] bg-white p-3 shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0]">
                                <Image 
                                  src={item.product.image || "/product-placeholder.jpg"} 
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover" 
                                  alt={item.product.name} 
                                  unoptimized
                                />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <p className="truncate font-['Inter'] text-xs font-bold text-[#1D293D]">
                                    {item.product.name} {item.variant && <span className="text-[#90A1B9]">({item.variant.name})</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  type="button"
                                  onClick={() => updateBuyItemQty(idx, -1)}
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-[#E2E8F0] text-[#1D293D] hover:bg-[#F1F5F9]"
                                >-</button>
                                <span className="w-4 text-center font-['Inter'] text-xs font-bold">{displayQty}</span>
                                <button 
                                  type="button"
                                  onClick={() => updateBuyItemQty(idx, 1)}
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-[#E2E8F0] text-[#1D293D] hover:bg-[#F1F5F9]"
                                >+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Free Summary */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="font-['Inter'] text-[12px] font-bold uppercase text-[#9810FA]">Free Products</p>
                        <p className={`font-['Inter'] text-[12px] font-bold ${freeTotalSelected === getQty || (selectedFreeItems.length === 1) ? 'text-[#009966]' : 'text-[#EA580C]'}`}>
                          {selectedFreeItems.length === 1 ? getQty : freeTotalSelected} / {getQty}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[300px] scrollbar-subtle">
                        {selectedFreeItems.map((item, idx) => {
                          const displayQty = selectedFreeItems.length === 1 ? getQty : item.quantity;
                          return (
                            <div key={idx} className="flex items-center justify-between rounded-[14px] bg-white p-3 shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0]">
                                <Image 
                                  src={item.product.image || "/product-placeholder.jpg"} 
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover" 
                                  alt={item.product.name} 
                                  unoptimized
                                />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <p className="truncate font-['Inter'] text-xs font-bold text-[#1D293D]">
                                    {item.product.name} {item.variant && <span className="text-[#90A1B9]">({item.variant.name})</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  type="button"
                                  onClick={() => updateFreeItemQty(idx, -1)}
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-[#E2E8F0] text-[#1D293D] hover:bg-[#F1F5F9]"
                                >-</button>
                                <span className="w-4 text-center font-['Inter'] text-xs font-bold">{displayQty}</span>
                                <button 
                                  type="button"
                                  onClick={() => updateFreeItemQty(idx, 1)}
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-[#E2E8F0] text-[#1D293D] hover:bg-[#F1F5F9]"
                                >+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex shrink-0 justify-between gap-4 border-t border-[#F1F5F9] pt-6">
            <button
              type="button"
              onClick={step === 1 ? onClose : () => setStep(1)}
              className="flex-1 rounded-[16px] border border-[#E2E8F0] bg-white py-4 font-['Inter'] text-base font-bold text-[#45556C] transition-all hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading || 
                (step === 2 && (
                  (selectedBuyItems.length === 0) || 
                  (selectedFreeItems.length === 0) ||
                  (selectedBuyItems.length > 1 && buyTotalSelected !== buyQty) ||
                  (selectedFreeItems.length > 1 && freeTotalSelected !== getQty)
                ))
              }
              className="flex-1 rounded-[16px] bg-[#EA580C] py-4 font-['Inter'] text-base font-bold text-white shadow-[0px_20px_25px_-5px_rgba(234,88,12,0.2),0px_8px_10px_-6px_rgba(234,88,12,0.2)] transition-all hover:bg-[#c2410c] disabled:opacity-50"
            >

              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
              {step === 1 ? "Next Step" : "Create BOGO Promotion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
