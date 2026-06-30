"use client";

import { useMemo, useState, useId, useRef, useEffect } from "react";
import MenuProductImage from "@/components/menu/MenuProductImage";
import {
  X,
  ShoppingCart,
  DollarSign,
  Plus,
  Trash2,
  Minus,
  ChevronDown,
  Loader2,
  Search,
} from "lucide-react";
import { useGetAllDiscounts, findApplicableDiscount, calculateItemDiscount } from "@/hooks/useDiscount";
import { resolveProductImageSrc } from "@/lib/productImage";
import { mapProductsToMenuItems } from "@/components/menu/menuItemMapper";
import type { MenuItem, ProductVariant, ProductAddOn } from "@/components/menu/types";
import { useGetAllModifications } from "@/hooks/useModification";
import { useGetProductsByBranch } from "@/hooks/useProduct";
import { useAuth } from "@/contexts/AuthContext";
import type { OrderItem } from "@/contexts/OrderContext";
import { lineNetBeforeOrderDiscount, totalsFromOrderLineItems } from "@/domains/orders/orderLineTotals";

export type EditOrderLineItem = {
  id: string;
  productId?: string;
  variationId?: string;
  variationOptionId?: string;
  name: string;
  qty: number;
  price: number;
  productDiscount?: number;
  image?: string;
  variant?: string;
  addOns?: string[];
  modifications?: { modificationId: number; price: number }[];
  bogoPromotionId?: string | number;
  productBundleId?: string | number;
  isFreeItem?: boolean;
  linkId?: string;
  buyQuantity?: number;
  getQuantity?: number;
  promotionType?: "BOGO" | "COMBO";
};

type OrderForEdit = {
  id: string;
  orderNo: string;
  customerName: string;
  totalAmount: number;
  orderType?: "Dine In" | "Take Away" | "Delivery";
  orderDiscount?: number;
  serviceCharge?: number;
  deliveryChargeAmount?: number;
  items?: {
    id: string;
    productId?: string;
    variationId?: string;
    variationOptionId?: string;
    name: string;
    qty: number;
    price: number;
    productDiscount?: number;
    image?: string;
    variant?: string;
    addOns?: string[];
    modifications?: { modificationId: number; price: number }[];
    bogoPromotionId?: string | number;
    productBundleId?: string | number;
    isFreeItem?: boolean;
    linkId?: string;
    buyQuantity?: number;
    getQuantity?: number;
  }[];
};

type Props = {
  order: OrderForEdit;
  onClose: () => void;
  onSubmit: (data: { items: EditOrderLineItem[] }) => void | Promise<void>;
  onOrderAndPay?: (data: { items: EditOrderLineItem[] }) => Promise<number | null>;
  isSubmitting?: boolean;
};

const formatRs = (n: number) =>
  `Rs.${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AddItemCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: (params: {
    productId: string;
    variationId?: string;
    variationOptionId?: string;
    name: string;
    price: number;
    image: string;
    variant?: string;
    addOns?: string[];
    modifications?: { modificationId: number; price: number }[];
  }) => void;
}) {
  const [variantOpen, setVariantOpen] = useState(false);
  const [addOnsOpen, setAddOnsOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(item.variants?.[0] ?? null);
  const [selectedAddOns, setSelectedAddOns] = useState<{ addOn: ProductAddOn; qty: number }[]>([]);
  const variantId = useId();
  const addOnsId = useId();

  const hasVariants = item.variants && item.variants.length > 0;
  const hasAddOns = item.addOns && item.addOns.length > 0;
  const basePrice = selectedVariant?.price ?? item.price;

  const toggleAddOn = (addOn: ProductAddOn) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((p) => p.addOn.id === addOn.id);
      if (existing) return prev.filter((p) => p.addOn.id !== addOn.id);
      return [...prev, { addOn, qty: 1 }];
    });
  };

  const updateAddOnQty = (addOnId: string, delta: number) => {
    setSelectedAddOns((prev) =>
      prev
        .map((p) => (p.addOn.id === addOnId ? { ...p, qty: Math.max(0, p.qty + delta) } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const handleAdd = () => {
    const variantName = selectedVariant?.name;
    const addOnsList = selectedAddOns.flatMap(({ addOn, qty: n }) =>
      n > 1 ? [`${addOn.name} x${n}`] : [addOn.name]
    );
    const modifications = selectedAddOns.map(({ addOn }) => ({
      modificationId: Number(addOn.id),
      price: addOn.price,
    }));
    onAdd({
      productId: String(item.productId),
      variationId: selectedVariant?.variationId != null ? String(selectedVariant.variationId) : undefined,
      variationOptionId: selectedVariant?.id != null ? String(selectedVariant.id) : undefined,
      name: item.name,
      price: basePrice,
      image: resolveProductImageSrc(item.image, String(item.productId)),
      variant: variantName,
      addOns: addOnsList.length > 0 ? addOnsList : undefined,
      modifications: modifications.length > 0 ? modifications : undefined,
    });
    setSelectedAddOns([]);
    setSelectedVariant(item.variants?.[0] ?? null);
  };

  return (
    <div className="flex rounded-[12px] border border-[#E2E8F0] bg-white p-3 shadow-sm">
      {/* Left: image */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[#F1F5F9]">
        <MenuProductImage
          productImageUrl={item.image}
          fallbackImageId={String(item.productId)}
          alt={item.name}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
      {/* Middle: details + dropdowns (wraps independently) */}
      <div className="ml-2 flex min-w-0 flex-1 flex-col">
        <div>
          <p className="font-['Inter'] text-sm font-bold leading-4 text-[#1D293D] truncate">{item.name}</p>
          <p className="mt-0.5 font-['Inter'] text-[11px] font-medium leading-tight text-[#62748E]">{item.category}</p>
          <p className="mt-0.5 font-['Inter'] text-xs font-bold leading-4 text-[#EA580C]">
            Rs.{basePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        {/* Variant + add-ons row only (can wrap to multiple lines without moving the + button) */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {hasVariants && (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setVariantOpen(!variantOpen); setAddOnsOpen(false); }}
                className="flex items-center gap-0.5 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-1 font-['Inter'] text-[11px] font-medium text-[#45556C]"
              >
                {selectedVariant?.name ?? "Variant"}
                <ChevronDown className={`h-3 w-3 ${variantOpen ? "rotate-180" : ""}`} />
              </button>
              {variantOpen && (
                <div
                  id={variantId}
                  className="absolute left-0 top-full z-10 mt-0.5 min-w-[100px] max-h-56 overflow-y-auto rounded-[8px] border border-[#E2E8F0] bg-white py-0.5 shadow-md"
                >
                  {item.variants!.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => { setSelectedVariant(v); setVariantOpen(false); }}
                      className={`block w-full px-2 py-1 text-left font-['Inter'] text-[11px] ${selectedVariant?.name === v.name ? "bg-[#EFF6FF] font-bold text-[#155DFC]" : "text-[#45556C]"
                        }`}
                    >
                      {v.name} — Rs.{v.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {hasAddOns && (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setAddOnsOpen(!addOnsOpen); setVariantOpen(false); }}
                className="flex items-center gap-0.5 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-1 font-['Inter'] text-[11px] font-medium text-[#45556C]"
              >
                {selectedAddOns.length > 0 ? `Add-ons (${selectedAddOns.length})` : "Add-ons"}
                <ChevronDown className={`h-3 w-3 ${addOnsOpen ? "rotate-180" : ""}`} />
              </button>
              {addOnsOpen && (
                <div
                  id={addOnsId}
                  className="absolute left-0 top-full z-10 mt-0.5 max-h-64 min-w-[140px] overflow-y-auto rounded-[8px] border border-[#E2E8F0] bg-white py-0.5 shadow-md"
                >
                  {item.addOns!.map((addOn) => {
                    const sel = selectedAddOns.find((p) => p.addOn.id === addOn.id);
                    return (
                      <div
                        key={addOn.id}
                        className="flex items-center justify-between gap-1 border-b border-[#F1F5F9] px-1.5 py-1 last:border-0"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAddOn(addOn)}
                          className="flex min-w-0 flex-1 items-center gap-1 text-left font-['Inter'] text-[11px] text-[#45556C]"
                        >
                          <span className={`flex h-3 w-3 shrink-0 items-center justify-center rounded border ${sel ? "border-[#EA580C] bg-[#EA580C]" : "border-[#CBD5E1]"}`}>
                            {sel && (
                              <svg className="h-1.5 w-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <span className="truncate">{addOn.name}</span>
                          <span className="shrink-0">+{addOn.price}</span>
                        </button>
                        {sel && (
                          <div className="flex items-center gap-0.5">
                            <button type="button" onClick={() => updateAddOnQty(addOn.id, -1)} className="p-0.5 text-[#90A1B9]">
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <span className="min-w-[12px] text-center text-[11px] font-bold text-[#0A0A0A]">{sel.qty}</span>
                            <button type="button" onClick={() => updateAddOnQty(addOn.id, 1)} className="p-0.5 text-[#90A1B9]">
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Right: plus button fixed (never wraps) */}
      <button
        type="button"
        onClick={handleAdd}
        className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-[10px] bg-[#EA580C] text-white hover:bg-[#DC4C04]"
        aria-label="Add to order"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function EditOrderModal({ order, onClose, onSubmit, onOrderAndPay, isSubmitting }: Props) {
  const { user } = useAuth();
  const branchId = user?.branchId || 1;
  const { data: products = [], isLoading: isLoadingProducts } = useGetProductsByBranch(branchId, {
    status: "active",
  });
  const { data: allModifications = [] } = useGetAllModifications("active");
  const { data: discountsData = [] } = useGetAllDiscounts({ status: "active" });

  const [searchQuery, setSearchQuery] = useState("");

  const menuItems = useMemo(
    () => mapProductsToMenuItems(products, branchId, allModifications),
    [products, branchId, allModifications]
  );

  const filteredMenuItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return menuItems;
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }, [menuItems, searchQuery]);

  const menuItemByProductId = useMemo(
    () =>
      new Map(
        menuItems.map((item) => [String(item.productId), item] as const)
      ),
    [menuItems]
  );

  const initialItems: EditOrderLineItem[] = (order.items ?? []).map((it, i) => {
    const matchedMenuItem = it.productId ? menuItemByProductId.get(String(it.productId)) : undefined;

    return {
      id: it.id || `line-${order.orderNo}-${i}-${it.name}`,
      productId: it.productId,
      variationId: it.variationId,
      variationOptionId: it.variationOptionId,
      name: it.name,
      qty: it.qty,
      price: it.price,
      productDiscount: it.productDiscount ?? 0,
      image: resolveProductImageSrc(
        it.image || matchedMenuItem?.image,
        String(it.productId ?? (i % 7) + 1)
      ),
      variant: it.variant,
      addOns: it.addOns,
      modifications: it.modifications,
      bogoPromotionId: it.bogoPromotionId,
      productBundleId: it.productBundleId,
      isFreeItem: it.isFreeItem,
      linkId: it.linkId,
      buyQuantity: it.buyQuantity,
      getQuantity: it.getQuantity,
      promotionType: it.bogoPromotionId ? "BOGO" : (it.productBundleId ? "COMBO" : undefined),
    };
  });

  const [lineItems, setLineItems] = useState<EditOrderLineItem[]>(initialItems);

  useEffect(() => {
    console.log("Edit Modal: Initial items from order:", initialItems.map(it => ({ name: it.name, variationOptionId: it.variationOptionId })));
  }, [order.items, initialItems]);

  const [showAddItems, setShowAddItems] = useState(false);

  useEffect(() => {
    if (!showAddItems) {
      setSearchQuery("");
    }
  }, [showAddItems]);
  const [orderAndPayBusy, setOrderAndPayBusy] = useState(false);

  const [saveFlowBusy, setSaveFlowBusy] = useState(false);
  const mountedRef = useRef(true);
  const refundClipId = useId();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isSaveBusy = saveFlowBusy || !!isSubmitting;

  const originalAmount = order.totalAmount;
  const lineTotals = totalsFromOrderLineItems(lineItems, order.orderDiscount ?? 0);
  const serviceChargeAmount =
    order.orderType === "Dine In" ? Number(order.serviceCharge ?? 0) || 0 : 0;
  const deliveryChargeAmount =
    order.orderType === "Delivery" ? Number(order.deliveryChargeAmount ?? 0) || 0 : 0;
  const updatedAmount =
    (lineTotals?.totalAmount ?? order.totalAmount) + serviceChargeAmount + deliveryChargeAmount;
  const paymentDiff = updatedAmount - originalAmount;
  const hasAdditionalPayment = paymentDiff > 0;

  const updateQty = (id: string, delta: number) => {
    setLineItems((prev) => {
      const targetItem = prev.find(it => it.id === id);
      if (!targetItem || targetItem.isFreeItem) return prev;

      let actualDelta = delta;
      if (targetItem.promotionType === "BOGO" && !targetItem.isFreeItem && targetItem.buyQuantity) {
        if (Math.abs(delta) === 1) {
          actualDelta = delta > 0 ? targetItem.buyQuantity : -targetItem.buyQuantity;
        }
      }

      const newQty = Math.max(0, targetItem.qty + actualDelta);
      
      let updatedItems = prev.map((it) => (it.id === id ? { ...it, qty: newQty } : it));

      // Sync linked BOGO items
      if (targetItem.promotionType === "BOGO" && targetItem.linkId) {
        if (!targetItem.isFreeItem) {
          const freeItem = updatedItems.find(i => i.linkId === targetItem.linkId && i.isFreeItem);
          if (freeItem && freeItem.buyQuantity && freeItem.getQuantity) {
            const newFreeQty = Math.floor(newQty / freeItem.buyQuantity) * freeItem.getQuantity;
            updatedItems = updatedItems.map(i => 
              i.id === freeItem.id ? { ...i, qty: newFreeQty } : i
            );
          }
        }
      }

      return updatedItems.filter((it) => it.qty > 0);
    });
  };

  const removeItem = (id: string) => {
    setLineItems((prev) => {
      const targetItem = prev.find(it => it.id === id);
      if (!targetItem || targetItem.isFreeItem) return prev;

      // If we remove a BOGO "buy" item, remove all its linked items
      if (targetItem.promotionType === "BOGO" && targetItem.linkId && !targetItem.isFreeItem) {
        return prev.filter((it) => it.linkId !== targetItem.linkId);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  const addItemFromMenu = (params: {
    productId: string;
    variationId?: string;
    variationOptionId?: string;
    name: string;
    price: number;
    image: string;
    variant?: string;
    addOns?: string[];
    modifications?: { modificationId: number; price: number }[];
  }) => {
    // Find applicable discount for the new item
    const mockOrderItem = {
      productId: params.productId,
      variationOptionId: params.variationOptionId,
    } as unknown as OrderItem;
    const applicable = findApplicableDiscount(mockOrderItem, discountsData);
    const productDiscount = applicable 
      ? calculateItemDiscount(params.price, 1, applicable.discountItem)
      : 0;

    const newItem: EditOrderLineItem = {
      id: `line-${order.orderNo}-${Date.now()}-${params.name}`,
      productId: params.productId,
      variationId: params.variationId,
      variationOptionId: params.variationOptionId,
      name: params.name,
      qty: 1,
      price: params.price,
      productDiscount,
      image: params.image,
      variant: params.variant,
      addOns: params.addOns?.length ? params.addOns : undefined,
      modifications: params.modifications?.length ? params.modifications : undefined,
    };
    console.log("Edit Modal: Adding new item:", { name: newItem.name, variationOptionId: newItem.variationOptionId });
    setLineItems((prev) => [...prev, newItem]);
  };

  const handleSubmit = async () => {
    if (isSaveBusy) return;
    console.log("Edit Modal: Submitting line items:", lineItems.map(it => ({ name: it.name, variationOptionId: it.variationOptionId })));
    setSaveFlowBusy(true);
    try {
      await Promise.resolve(onSubmit({ items: lineItems }));
    } catch {
      /* parent handles errors / toasts */
    } finally {
      if (mountedRef.current) setSaveFlowBusy(false);
    }
  };

  const handleOrderAndPay = async () => {
    if (!hasAdditionalPayment || !onOrderAndPay || isSaveBusy) return;
    setOrderAndPayBusy(true);
    try {
      const additional = await onOrderAndPay({ items: lineItems });
      if (additional != null && additional > 0.02) {
        onClose();
      }
    } finally {
      setOrderAndPayBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between border-b border-[#E2E8F0] p-5">
          <div>
            <h2 className="font-['Inter'] text-2xl font-bold leading-8 text-[#1D293D]">Edit Order</h2>
            <p className="mt-1 font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
              Order #{order.orderNo} • {order.customerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#F1F5F9] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#CBD5E1]">
          {/* Order Items */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-['Inter'] text-[18px] font-bold leading-[28px] text-[#314158]">
              <ShoppingCart className="h-5 w-5 text-[#EA580C]" />
              Order Items
            </div>
            <button
              type="button"
              onClick={() => setShowAddItems(!showAddItems)}
              className="flex items-center gap-1.5 rounded-[14px] bg-[#EA580C] px-4 py-2 font-['Inter'] text-sm font-bold leading-5 text-white shadow-[0px_4px_6px_-4px_#EA580C4D,0px_10px_15px_-3px_#EA580C4D] hover:bg-[#DC4C04]"
            >
              <Plus className="h-4 w-4" />
              Add Items
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {lineItems.length === 0 ? (
              <p className="rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-[17px] font-['Inter'] text-sm text-[#62748E]">
                No items in this order. Click &quot;Add Items&quot; to add menu items.
              </p>
            ) : (
              lineItems.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-4 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] pt-[17px] pr-[17px] pb-[17px] pl-[17px]"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-[#F1F5F9]">
                    <MenuProductImage
                      productImageUrl={it.image}
                      fallbackImageId={String(it.productId ?? "1")}
                      alt={it.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">{it.name}</p>
                    {(it.variant || (it.addOns && it.addOns.length > 0)) && (
                      <p className="mt-0.5 font-['Inter'] text-xs font-medium leading-4 text-[#62748E]">
                        {[it.variant, ...(it.addOns ?? [])].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {!it.isFreeItem ? (
                        <div className="flex items-center rounded-[10px] border border-[#E2E8F0] bg-white">
                          <button
                            type="button"
                            onClick={() => updateQty(it.id, -1)}
                            className="p-2 text-[#62748E] hover:text-[#1D293D]"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-[28px] text-center font-['Inter'] text-sm font-bold text-[#1D293D]">
                            {it.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(it.id, 1)}
                            className="p-2 text-[#62748E] hover:text-[#1D293D]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2">
                          <span className="font-['Inter'] text-[10px] font-black tracking-wider text-[#90A1B9] uppercase">QTY:</span>
                          <span className="font-['Inter'] text-xs font-black text-[#0A0A0A]">
                            {it.qty}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {!it.isFreeItem && (
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="rounded-full p-2 text-[#90A1B9] hover:bg-[#FFE6EB] hover:text-[#EC003F]"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="text-right">
                      <p className="font-['Inter'] text-xs font-medium text-[#62748E]">Item Total</p>
                      <p className="font-['Inter'] text-base font-bold text-[#1D293D]">
                        {formatRs(
                          lineNetBeforeOrderDiscount({
                            name: it.name,
                            qty: it.qty,
                            price: it.price,
                            productDiscount: it.productDiscount,
                            modifications: it.modifications,
                          })
                        )}
                      </p>
                      {it.productDiscount ? it.productDiscount > 0 && (
                        <p className="text-[10px] text-[#10B981]">
                          (Incl. {formatRs(it.productDiscount)} discount/ea)
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add New Items panel */}
          {showAddItems && (
            <div className="mt-6 rounded-[16px] border-2 border-[#BEDBFF] bg-[#EFF6FF] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-['Inter'] text-base font-bold leading-6 text-[#314158]">
                  <Plus className="h-4 w-4 shrink-0 text-[#155DFC]" />
                  Add New Items
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddItems(false)}
                  className="font-['Inter'] text-xs font-medium leading-4 text-[#62748E] text-center hover:text-[#1D293D]"
                >
                  Close
                </button>
              </div>

              {/* Search bar */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#62748E]" />
                <input
                  type="text"
                  placeholder="Search items by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[12px] border border-[#CBD5E1] bg-white py-2 pl-9 pr-4 font-['Inter'] text-sm text-[#1D293D] placeholder-[#90A1B9] outline-none focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC]"
                />
              </div>

              <div className="mt-3 max-h-[min(560px,65vh)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#DBEAFE] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#93C5FD] [&::-webkit-scrollbar-thumb]:hover:bg-[#60A5FA]">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pr-1">
                  {isLoadingProducts ? (
                    <div className="col-span-full flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-[#155DFC]" />
                    </div>
                  ) : filteredMenuItems.length > 0 ? (
                    filteredMenuItems.map((menuItem) => (
                      <AddItemCard key={menuItem.id} item={menuItem} onAdd={addItemFromMenu} />
                    ))
                  ) : (
                    <div className="col-span-full rounded-[12px] border border-[#BFDBFE] bg-white px-4 py-6 text-center font-['Inter'] text-sm text-[#62748E]">
                      {searchQuery
                        ? `No items found matching "${searchQuery}"`
                        : "No active products found for this branch."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-[16px] border-2 border-[#E2E8F0] bg-[#F8FAFC] p-5 [&>*+*]:mt-4">
            <div className="flex items-center gap-2 font-['Inter'] text-base font-bold leading-6 text-[#314158]">
              <DollarSign className="h-5 w-5 text-[#EA580C]" />
              Order Summary
            </div>
            <div className="space-y-2 font-['Inter'] border-b border-[#CAD5E2]">
              <div className="flex justify-between">
                <span className="text-sm font-normal leading-5 text-[#45556C]">Original Amount:</span>
                <span className="text-sm font-semibold leading-5 text-[#314158]">{formatRs(originalAmount)}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-sm font-normal leading-5 text-[#45556C]">Updated Amount:</span>
                <span className="text-sm font-semibold leading-5 text-[#314158]">{formatRs(updatedAmount)}</span>
              </div>
            </div>

            {/* Payment difference message */}
            {paymentDiff === 0 && (
              <div className="flex items-center justify-center rounded-[14px] border border-[#DBEAFE] bg-[#EFF6FF] py-3 font-['Inter'] text-sm font-bold leading-5 text-[#155DFC]">
                No payment difference
              </div>
            )}
            {paymentDiff < 0 && (
              <div className="flex items-center gap-3 rounded-[14px] border-2 border-[#FFCCD3] bg-[#FFF1F2] px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFE4E6]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                    <g clipPath={`url(#${refundClipId})`}>
                      <path d="M10.0001 18.3333C14.6025 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6025 1.66663 10.0001 1.66663C5.39771 1.66663 1.66675 5.39759 1.66675 9.99996C1.66675 14.6023 5.39771 18.3333 10.0001 18.3333Z" stroke="#EC003F" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 6.66663V9.99996" stroke="#EC003F" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 13.3334H10.0083" stroke="#EC003F" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                      <clipPath id={refundClipId}>
                        <rect width="20" height="20" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </span>
                <div>
                  <p className="font-['Inter'] text-xs font-bold uppercase leading-4 tracking-[0.6px] text-[#EC003F]">
                    Refund amount
                  </p>
                  <p className="font-['Inter'] text-2xl font-bold leading-8 text-[#C70036]">
                    {formatRs(Math.abs(paymentDiff))}
                  </p>
                </div>
              </div>
            )}
            {paymentDiff > 0 && (
              <div className="flex items-center gap-3 rounded-[14px] border-2 border-[#A4F4CF] bg-[#ECFDF5] px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D0FAE5]">
                  <DollarSign className="h-5 w-5 text-[#009966]" />
                </span>
                <div>
                  <p className="font-['Inter'] text-xs font-bold uppercase leading-4 tracking-[0.6px] text-[#009966]">
                    Additional payment required
                  </p>
                  <p className="font-['Inter'] text-2xl font-bold leading-8 text-[#007A55]">
                    {formatRs(paymentDiff)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-3 border-t border-[#E2E8F0] p-5 ${hasAdditionalPayment ? "justify-end" : "w-full"}`}>
          {hasAdditionalPayment ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="h-14 w-[274px] rounded-[16px] bg-[#E2E8F0] font-['Inter'] text-base font-bold leading-6 text-[#314158] text-center hover:bg-[#CBD5E1]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSaveBusy}
                className="h-14 w-[274px] rounded-[14px] border-2 border-[#EA580C] bg-white font-['Arial'] text-base font-bold leading-6 text-[#EA580C] text-center hover:bg-[#FFF7ED] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSaveBusy ? "Saving…" : "Save order"}
              </button>
              <button
                type="button"
                onClick={() => void handleOrderAndPay()}
                disabled={orderAndPayBusy || isSaveBusy}
                className="h-14 w-[274px] rounded-[16px] bg-[#EA580C] font-['Inter'] text-base font-bold leading-6 text-white text-center shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A] hover:bg-[#DC4C04] disabled:opacity-50 disabled:pointer-events-none"
              >
                {orderAndPayBusy || isSaveBusy ? "Saving…" : "Order & Pay"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="h-14 min-w-0 flex-1 rounded-[16px] bg-[#E2E8F0] font-['Inter'] text-base font-bold leading-6 text-[#314158] text-center hover:bg-[#CBD5E1]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSaveBusy}
                className="h-14 min-w-0 flex-1 rounded-[16px] bg-[#EA580C] font-['Inter'] text-base font-bold leading-6 text-white text-center shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A] hover:bg-[#DC4C04] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSaveBusy ? "Saving…" : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
