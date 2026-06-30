"use client";

import { useState, useMemo } from "react";
import { X, Plus, Minus, Tag, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import type { MenuItem, ProductAddOn } from "./types";
import MenuProductImage from "./MenuProductImage";
import { resolveProductImageSrc, normalizeProductImageUrl } from "@/lib/productImage";
import { useGetComboPackById } from "@/hooks/useComboPack";
import { useGetBogoPromotionById } from "@/hooks/useBogoPromotion";
import { useGetAllModifications } from "@/hooks/useModification";
import { useGetProductsByBranch } from "@/hooks/useProduct";
import { collectAddOns } from "./menuItemMapper";
import { useAuth } from "@/contexts/AuthContext";
import type { AddItemOptions } from "@/contexts/OrderContext";

type PromotionModalProps = {
  item: MenuItem;
  onClose: () => void;
  onAddToOrder: (
    productId: number,
    name: string,
    price: number,
    details: string,
    image?: string,
    variant?: string,
    addOnsList?: string[],
    variationId?: number,
    variationOptionId?: number,
    modifications?: { modificationId: number; price: number }[],
    options?: AddItemOptions,
    linkId?: string,
    isFreeItem?: boolean,
    promotionType?: "BOGO" | "COMBO",
    buyQuantity?: number,
    getQuantity?: number,
    promotionId?: number,
    qty?: number
  ) => void;
};

type CustomizationRecord = Record<string, { addOn: ProductAddOn; qty: number }[]>;

export default function PromotionModal({
  item,
  onClose,
  onAddToOrder,
}: PromotionModalProps) {
  const [qty, setQty] = useState(1);
  const [itemCustomizations, setItemCustomizations] = useState<CustomizationRecord>({});
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);
  const [addOnSearch, setAddOnSearch] = useState("");
  const { user } = useAuth();
  const branchId = user?.branchId || 1;

  const promoInfo = item.promotionInfo;
  
  const { data: allModifications = [] } = useGetAllModifications("active");
  
  const { data: comboData, isLoading: isLoadingCombo } = useGetComboPackById(
    promoInfo?.type === "combo" ? promoInfo.promotionId : 0
  );

  const { data: bogoData, isLoading: isLoadingBogo } = useGetBogoPromotionById(
    promoInfo?.type === "bogo" ? promoInfo.promotionId : 0
  );

  const { data: branchProducts } = useGetProductsByBranch(branchId, { 
    status: 'active' 
  });

  const isLoading = (promoInfo?.type === "combo" && isLoadingCombo) || (promoInfo?.type === "bogo" && isLoadingBogo);

  const augmentedPromoInfo = useMemo(() => {
    if (!promoInfo) return null;
    if (isLoading) return promoInfo;

    if (promoInfo.type === "combo" && comboData) {
      return {
        ...promoInfo,
        items: comboData.items?.map(i => ({
          productId: i.productId,
          name: i.product?.name || "Unknown",
          price: 0,
          image: normalizeProductImageUrl(i.product?.image) || undefined,
          variationOptionId: i.variationOptionId,
          quantity: i.quantity || 1,
          addOns: undefined, // No add-ons for combo packs as requested
        }))
      };
    }

    if (promoInfo.type === "bogo" && bogoData) {
      // Find full product details to ensure modifications are loaded correctly
      const fullBuyProduct = branchProducts?.find(p => p.id === bogoData.buyProductId);
      const fullGetProduct = branchProducts?.find(p => p.id === bogoData.getProductId);

      return {
        ...promoInfo,
        buyItem: bogoData.buyProduct ? {
          productId: bogoData.buyProduct.id,
          name: bogoData.buyProduct.name,
          price: 0,
          image: normalizeProductImageUrl(bogoData.buyProduct.image) || undefined,
          quantity: bogoData.buyQuantity,
          addOns: fullBuyProduct ? collectAddOns(fullBuyProduct, allModifications) : collectAddOns(bogoData.buyProduct, allModifications),
        } : promoInfo.buyItem,
        getFreeItem: bogoData.getProduct ? {
          productId: bogoData.getProduct.id,
          name: bogoData.getProduct.name,
          price: 0,
          image: normalizeProductImageUrl(bogoData.getProduct.image) || undefined,
          variationOptionId: bogoData.getVariationOptionId,
          quantity: bogoData.getQuantity,
          addOns: undefined, // No add-ons for free item as per previous requirement
        } : promoInfo.getFreeItem
      };
    }

    return promoInfo;
  }, [promoInfo, comboData, bogoData, isLoading, allModifications, branchProducts]);

  if (!augmentedPromoInfo) return null;


  const basePrice = item.price;
  const allSelectedAddOns = Object.values(itemCustomizations).flat();
  const addOnsTotal = allSelectedAddOns.reduce((sum, { addOn, qty: n }) => sum + addOn.price * n, 0);
  const totalPrice = (basePrice + addOnsTotal) * qty;

  const toggleExpansion = (key: string) => {
    setExpandedItemKey(expandedItemKey === key ? null : key);
    setAddOnSearch("");
  };

  const toggleSubItemAddOn = (itemKey: string, addOn: ProductAddOn) => {
    setItemCustomizations((prev) => {
      const current = prev[itemKey] || [];
      const existing = current.find((p) => p.addOn.id === addOn.id);
      if (existing) {
        return {
          ...prev,
          [itemKey]: current.filter((p) => p.addOn.id !== addOn.id),
        };
      }
      return {
        ...prev,
        [itemKey]: [...current, { addOn, qty: 1 }],
      };
    });
  };

  const updateSubItemAddOnQty = (itemKey: string, addOnId: string, delta: number) => {
    setItemCustomizations((prev) => {
      const current = prev[itemKey] || [];
      const updated = current
        .map((p) => (p.addOn.id === addOnId ? { ...p, qty: Math.max(0, p.qty + delta) } : p))
        .filter((p) => p.qty > 0);
      return { ...prev, [itemKey]: updated };
    });
  };

  const handleAction = () => {
    const unitPrice = totalPrice / qty;
    
    const parts: string[] = [];
    if (augmentedPromoInfo.type === "combo") {
      parts.push(`${item.name}`);
      augmentedPromoInfo.items?.forEach((i, idx) => {
        parts.push(i.name);
        const customizations = itemCustomizations[`combo-${idx}`];
        if (customizations?.length) {
            const custParts = customizations.map(c => c.qty > 1 ? `${c.addOn.name} x${c.qty}` : c.addOn.name);
            parts.push(`(${custParts.join(", ")})`);
        }
      });
    } else {
      parts.push(`${item.name}`);
      if (augmentedPromoInfo.buyItem) {
          parts.push(`Buy: ${augmentedPromoInfo.buyItem.name}`);
          const cust = itemCustomizations['bogo-buy'];
          if (cust?.length) {
              parts.push(`(${cust.map(c => c.qty > 1 ? `${c.addOn.name} x${c.qty}` : c.addOn.name).join(", ")})`);
          }
      }
      if (augmentedPromoInfo.getFreeItem) {
          parts.push(`Free: ${augmentedPromoInfo.getFreeItem.name}`);
          const cust = itemCustomizations['bogo-get'];
           if (cust?.length) {
              parts.push(`(${cust.map(c => c.qty > 1 ? `${c.addOn.name} x${c.qty}` : c.addOn.name).join(", ")})`);
          }
      }
    }

    const details = parts.join(" ");

    const image = resolveProductImageSrc(item.image, item.id);
    
    const modifications: { modificationId: number; price: number }[] = [];
    Object.values(itemCustomizations).forEach(addOns => {
        addOns.forEach(a => {
            Array.from({ length: a.qty }).forEach(() => {
                modifications.push({
                    modificationId: Number(a.addOn.id),
                    price: a.addOn.price
                });
            });
        });
    });

    const addOnsList = allSelectedAddOns.map(({ addOn, qty: n }) => (n > 1 ? `${addOn.name} x${n}` : addOn.name));

    if (augmentedPromoInfo.type === "combo" && augmentedPromoInfo.items) {
        augmentedPromoInfo.items.slice(1).forEach(i => {
            modifications.push({
                modificationId: i.productId,
                price: 0
            });
            if (!addOnsList.includes(i.name)) {
                addOnsList.push(i.name);
            }
        });
    }

    // Add main item with bundled logic
    const linkId = augmentedPromoInfo.type === "bogo" ? `bogo-${augmentedPromoInfo.promotionId}` : undefined;
    
    onAddToOrder(
        item.productId,
        item.name,
        unitPrice,
        details,
        image,
        "OFFER",
        addOnsList.length > 0 ? addOnsList : undefined,
        undefined,
        undefined,
        modifications.length > 0 ? modifications : undefined,
        undefined,
        linkId,
        false, // isFreeItem
        augmentedPromoInfo.type === "bogo" ? "BOGO" : (augmentedPromoInfo.type === "combo" ? "COMBO" : undefined),
        augmentedPromoInfo.type === "bogo" && bogoData ? bogoData.buyQuantity : undefined,
        augmentedPromoInfo.type === "bogo" && bogoData ? bogoData.getQuantity : undefined,
        augmentedPromoInfo.promotionId,
        augmentedPromoInfo.type === "bogo" && bogoData ? qty * bogoData.buyQuantity : qty
    );

    if (augmentedPromoInfo.type === "bogo" && augmentedPromoInfo.getFreeItem && bogoData) {
        onAddToOrder(
            augmentedPromoInfo.getFreeItem.productId,
            augmentedPromoInfo.getFreeItem.name,
            0,
            "FREE (BOGO)",
            resolveProductImageSrc(augmentedPromoInfo.getFreeItem.image, augmentedPromoInfo.getFreeItem.productId.toString()),
            "REGULAR",
            undefined,
            undefined,
            augmentedPromoInfo.getFreeItem.variationOptionId,
            undefined, // modifications
            undefined, // options
            linkId,
            true, // isFreeItem
            "BOGO",
            bogoData.buyQuantity,
            bogoData.getQuantity,
            augmentedPromoInfo.promotionId,
            qty * bogoData.getQuantity // Multiply by sets
        );
    }

    onClose();
  };

  const renderAddOnSection = (itemKey: string, availableAddOns: ProductAddOn[]) => {
    const filtered = availableAddOns.filter(a => a.name.toLowerCase().includes(addOnSearch.toLowerCase()));
    const selectedForThisItem = itemCustomizations[itemKey] || [];

    return (
      <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search add-ons..."
              autoFocus
              value={addOnSearch}
              onChange={(e) => setAddOnSearch(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
            {filtered.map(addOn => {
                const selected = selectedForThisItem.find(s => s.addOn.id === addOn.id);
                return (
                    <div key={addOn.id} className={`flex items-center justify-between rounded-xl border p-3 transition-all ${selected ? 'border-primary bg-primary-muted' : 'border-[#E2E8F0] bg-white'}`}>
                        <button type="button" onClick={() => toggleSubItemAddOn(itemKey, addOn)} className="flex flex-1 items-center gap-3 text-left">
                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-primary bg-primary' : 'border-zinc-300'}`}>
                                {selected && <Plus className="h-3 w-3 text-white" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-zinc-800">{addOn.name}</p>
                                <p className="text-xs text-zinc-500">+{addOn.price} LKR</p>
                            </div>
                        </button>
                        {selected && (
                            <div className="flex items-center gap-2 rounded-lg bg-white px-2 py-1 shadow-sm border border-[#E2E8F0]">
                                <button type="button" onClick={() => updateSubItemAddOnQty(itemKey, addOn.id, -1)} className="text-zinc-900 hover:text-zinc-600"><Minus className="h-3 w-3" /></button>
                                <span className="text-sm font-black text-zinc-950 px-1">{selected.qty}</span>
                                <button type="button" onClick={() => updateSubItemAddOnQty(itemKey, addOn.id, 1)} className="text-zinc-900 hover:text-primary"><Plus className="h-3 w-3" /></button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[24px] bg-white shadow-2xl max-h-[90dvh]" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60">
          <X className="h-6 w-6" />
        </button>

        <div className="flex max-h-[90dvh] flex-col overflow-hidden md:flex-row md:items-stretch">
          <div className="relative h-56 w-full shrink-0 overflow-hidden md:h-auto md:w-[45%] md:self-stretch">
            <div className="absolute inset-0">
              <MenuProductImage
                productImageUrl={item.image}
                fallbackImageId={item.id}
                alt={item.name}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-primary/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
                  {augmentedPromoInfo.type === "combo" ? "Bundle Save" : "Buy 1 Get 1"}
                </div>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">{item.name}</h2>
              {item.description && <p className="mt-2 text-sm text-white/70 line-clamp-2">{item.description}</p>}
            </div>
          </div>

          <div className="flex flex-col flex-1 min-h-0 bg-[#F8FAFC]">
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="mb-8">
                {augmentedPromoInfo.type === "bogo" && augmentedPromoInfo.buyItem?.addOns && augmentedPromoInfo.buyItem.addOns.length > 0 && (
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[2px] text-zinc-400">
                    Select items to customize
                  </p>
                )}
                <div className="space-y-3 relative min-h-[200px]">
                  {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  {augmentedPromoInfo.type === "combo" ? (
                    augmentedPromoInfo.items?.map((p, idx) => {
                      const key = `combo-${idx}`;
                      const isExpanded = expandedItemKey === key;
                      const hasAddOns = p.addOns && p.addOns.length > 0;
                      const activeCount = itemCustomizations[key]?.length || 0;

                      return (
                        <div key={key} className="group">
                          <button
                            type="button"
                            onClick={() => hasAddOns && toggleExpansion(key)}
                            disabled={!hasAddOns}
                            className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-4 transition-all ${isExpanded ? 'border-primary ring-1 ring-primary' : 'border-[#E2E8F0] hover:border-zinc-300'}`}
                          >
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F1F5F9]">
                              <MenuProductImage productImageUrl={p.image} fallbackImageId={p.productId.toString()} alt={p.name} width={56} height={56} className="object-cover" />
                              {activeCount > 0 && (
                                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-lg">
                                  {activeCount}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-black text-zinc-800">{p.name}</p>
                              <p className="text-[10px] font-bold text-zinc-400">{p.quantity}x Included</p>
                            </div>
                            {hasAddOns && (
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isExpanded ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                              </div>
                            )}
                          </button>
                          {isExpanded && p.addOns && renderAddOnSection(key, p.addOns)}
                        </div>
                      );
                    })
                  ) : (
                    <>
                      {/* BOGO Buy Item */}
                      <div className="group">
                        <button
                          type="button"
                          onClick={() => augmentedPromoInfo.buyItem?.addOns && augmentedPromoInfo.buyItem.addOns.length > 0 && toggleExpansion('bogo-buy')}
                          disabled={!augmentedPromoInfo.buyItem?.addOns || augmentedPromoInfo.buyItem.addOns.length === 0}
                          className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-4 transition-all ${expandedItemKey === 'bogo-buy' ? 'border-primary ring-1 ring-primary' : 'border-[#E2E8F0] hover:border-zinc-300'}`}
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F1F5F9]">
                             <MenuProductImage productImageUrl={augmentedPromoInfo.buyItem?.image} fallbackImageId={augmentedPromoInfo.buyItem?.productId.toString() || ""} alt={augmentedPromoInfo.buyItem?.name || ""} width={56} height={56} className="object-cover" />
                             {/* {(itemCustomizations['bogo-buy']?.length || 0) > 0 && (
                                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-lg">
                                  {itemCustomizations['bogo-buy']?.length}
                                </div>
                              )} */}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-black text-zinc-800">Buy: {augmentedPromoInfo.buyItem?.name}</p>
                            <p className="text-[10px] font-bold text-zinc-400">{augmentedPromoInfo.buyItem?.quantity}x required</p>
                          </div>
                          {augmentedPromoInfo.buyItem?.addOns && augmentedPromoInfo.buyItem.addOns.length > 0 && (
                             <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${expandedItemKey === 'bogo-buy' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                                {expandedItemKey === 'bogo-buy' ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                             </div>
                          )}
                        </button>
                        {expandedItemKey === 'bogo-buy' && augmentedPromoInfo.buyItem?.addOns && renderAddOnSection('bogo-buy', augmentedPromoInfo.buyItem.addOns)}
                      </div>

                      {/* BOGO Free Item */}
                      <div className="group">
                        <div
                          className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-muted p-4 transition-all"
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/50">
                             <MenuProductImage productImageUrl={augmentedPromoInfo.getFreeItem?.image} fallbackImageId={augmentedPromoInfo.getFreeItem?.productId.toString() || ""} alt={augmentedPromoInfo.getFreeItem?.name || ""} width={56} height={56} className="object-cover" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-black text-primary">Free: {augmentedPromoInfo.getFreeItem?.name}</p>
                            <p className="text-[10px] font-bold text-primary/60">{augmentedPromoInfo.getFreeItem?.quantity}x free with offer</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] bg-white p-6 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-stretch gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-1.5 shadow-inner">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black shadow-sm hover:bg-zinc-50 active:scale-95 transition-all"><Minus className="h-4 w-4" /></button>
                  <span className="flex min-w-[40px] items-center justify-center text-xl font-black text-zinc-950">{qty}</span>
                  <button type="button" onClick={() => setQty((q) => q + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"><Plus className="h-4 w-4" strokeWidth={3} /></button>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[2px] text-zinc-400">Total payable</p>
                  <p className="text-3xl font-black text-primary leading-tight">Rs.{totalPrice.toLocaleString()}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAction}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary py-4 font-black text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <Tag className="h-5 w-5" />
                Add Offer to Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
