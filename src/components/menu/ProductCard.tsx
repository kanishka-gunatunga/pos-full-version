"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Minus, Tag } from "lucide-react";
import { useOrder } from "@/contexts/OrderContext";
import type { MenuItem, ProductVariant, ProductAddOn } from "./types";
import ProductModal from "./ProductModal";
import PromotionModal from "./PromotionModal";
import MenuProductImage from "./MenuProductImage";
import { resolveProductImageSrc } from "@/lib/productImage";

type ProductCardProps = {
  item: MenuItem;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
};

export default function ProductCard({ item, isExpanded, onExpand, onCollapse }: ProductCardProps) {
  const { addItem } = useOrder();
  const isVoucherItem =
    item.category.toLowerCase().includes("voucher") || item.name.toLowerCase().includes("voucher");
  const isPromotionDeal = (item.bundleItems?.length ?? 0) > 0;
  const [isAddOnsOpen, setIsAddOnsOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    item.variants?.[0] ?? null
  );
  const [selectedAddOns, setSelectedAddOns] = useState<{ addOn: ProductAddOn; qty: number }[]>([]);
  const [qty, setQty] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [addOnSearch, setAddOnSearch] = useState("");

  const hasVariants = item.variants && item.variants.length > 0;
  const basePrice = selectedVariant?.price ?? item.price;
  const addOnsTotal = selectedAddOns.reduce((sum, { addOn, qty: n }) => sum + addOn.price * n, 0);
  const totalPrice = (basePrice + addOnsTotal) * qty;

  const filteredAddOns =
    item.addOns?.filter((a) => a.name.toLowerCase().includes(addOnSearch.toLowerCase())) ?? [];

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isOffer) {
      setShowModal(true);
      return;
    }
    if (isExpanded) {
      onCollapse();
    } else {
      onCollapse();
      setShowModal(true);
    }
  };

  const handleBottomClick = () => {
    if (item.isOffer) {
      setShowModal(true);
      return;
    }
    onExpand();
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoucherItem || isPromotionDeal) {
      setShowModal(true);
      return;
    }
    if (item.isOffer || (item.addOns && item.addOns.length > 0)) {
      setShowModal(true);
      return;
    }
    const variant = item.variants?.[0];
    const price = variant?.price ?? item.price;
    const variantName = variant?.name ?? "REGULAR";

    addItem(
      item.productId,
      item.name,
      price,
      variantName,
      resolveProductImageSrc(item.image, item.id),
      variantName,
      undefined,
      variant?.variationId,
      variant?.id,
      undefined,
      { itemType: "food" }
    );
  };

  const toggleAddOn = (addOn: ProductAddOn) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((p) => p.addOn.id === addOn.id);
      if (existing) {
        return prev.filter((p) => p.addOn.id !== addOn.id);
      }
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

  const getDetailsString = () => {
    const parts: string[] = [];
    if (selectedVariant) parts.push(selectedVariant.name);
    if (selectedAddOns.length > 0) {
      parts.push(
        ...selectedAddOns.flatMap(({ addOn, qty: n }) =>
          n > 1 ? [`${addOn.name} x${n}`] : [addOn.name]
        )
      );
    }
    return parts.join(" + ") || "REGULAR";
  };

  const getAddOnsList = () =>
    selectedAddOns.map(({ addOn, qty: n }) => (n > 1 ? `${addOn.name} x${n}` : addOn.name));

  const handleAddToOrder = () => {
    if (isPromotionDeal) {
      for (let i = 0; i < qty; i++) {
        item.bundleItems?.forEach((bundle) => {
          for (let j = 0; j < bundle.qty; j++) {
            addItem(
              bundle.productId,
              bundle.name,
              bundle.unitPrice,
              bundle.details ?? item.name,
              bundle.image ?? resolveProductImageSrc(item.image, item.id),
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              { itemType: "promotion" }
            );
          }
        });
      }
      setQty(1);
      onCollapse();
      return;
    }

    const unitPrice = totalPrice / qty;
    const details = getDetailsString();
    const image = resolveProductImageSrc(item.image, item.id);
    const variantName = selectedVariant?.name;
    const addOnsParsed = getAddOnsList();
    const modifications = selectedAddOns.map((a) => ({
      modificationId: Number(a.addOn.id),
      price: a.addOn.price,
    }));

    for (let i = 0; i < qty; i++) {
      addItem(
        item.productId,
        item.name,
        unitPrice,
        details,
        image,
        variantName,
        addOnsParsed.length > 0 ? addOnsParsed : undefined,
        selectedVariant?.variationId,
        selectedVariant?.id,
        modifications.length > 0 ? modifications : undefined,
        { itemType: isVoucherItem ? "voucher" : "food" }
      );
    }
    setSelectedAddOns([]);
    setSelectedVariant(item.variants?.[0] ?? null);
    setQty(1);
    onCollapse();
  };

  const handleCancel = () => {
    setSelectedAddOns([]);
    setSelectedVariant(item.variants?.[0] ?? null);
    setQty(1);
    onCollapse();
  };

  const handleCloseExpansion = () => onCollapse();

  if (isExpanded) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleCloseExpansion}
        onKeyDown={(e) => e.key === "Escape" && handleCloseExpansion()}
        className="flex min-w-0 max-w-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-zinc-200"
      >
        <div className="relative block aspect-square w-full shrink-0 overflow-hidden rounded-t-xl bg-zinc-100">
          <MenuProductImage
            productImageUrl={item.image}
            fallbackImageId={item.id}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm">
            <ChevronDown className="h-5 w-5" />
          </span>
        </div>

        <div className="flex min-w-0 flex-col pb-4 pt-[17px]">
          <div className="flex min-w-0 flex-col gap-1 px-4">
            <span className="product-card-category font-bold uppercase tracking-wider text-primary">
              {item.category}
            </span>
            <span className="product-card-title font-semibold text-zinc-800">{item.name}</span>
            <span className="product-card-price font-medium text-zinc-700">
              {item.isOffer ? "Offer Price: Rs." : "From Rs."}
              {item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-3 border-b-2 border-[#F1F5F9]" />

          <div className="bg-[#F8FAFC] px-4 pt-2">
            {hasVariants && (
              <div className="mt-2">
                <p className="product-card-variant-label mb-2 inline-block font-black uppercase tracking-[1px] leading-[15px] text-[#90A1B9] ">
                  SELECT VARIANT
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {item.variants!.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVariant(v);
                      }}
                      className={`product-card-variant-text min-w-0 rounded-[14px] px-3 py-1.5 text-left font-medium transition-colors ${
                        selectedVariant?.name === v.name
                          ? "border-2 border-primary bg-primary-muted"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      <span
                        className={`product-card-variant-text block font-semibold ${
                          selectedVariant?.name === v.name ? "text-primary" : ""
                        }`}
                      >
                        {v.name}
                      </span>
                      <span className="product-card-price-small block text-zinc-600">
                        {v.price.toLocaleString("en-US", { minimumFractionDigits: 2 })} LKR
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {item.addOns && item.addOns.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddOnsOpen(!isAddOnsOpen);
                  }}
                  className={`flex w-full min-w-0 items-center justify-between rounded-[14px] border-2 px-3 py-2 text-left transition-colors ${
                    isAddOnsOpen
                      ? "border-[#1D293D] bg-[#1D293D] text-white"
                      : " border-[#E2E8F0] bg-white"
                  }`}
                >
                  <span
                    className={`product-card-addon-header flex min-w-0 items-center gap-1.5 px-2 py-1 text-center font-bold uppercase ${
                      isAddOnsOpen ? "text-white" : "text-[#1D293D]"
                    }`}
                  >
                    <svg
                      className="h-4 w-[12.7px] shrink-0"
                      width="12.703125"
                      height="16"
                      viewBox="0 0 13 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.5859 5.35352H5.82227"
                        stroke="currentColor"
                        strokeWidth="1.05859"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7.41016 10.6465H2.64648"
                        stroke="currentColor"
                        strokeWidth="1.05859"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8.99805 12.2344C9.87501 12.2344 10.5859 11.5235 10.5859 10.6465C10.5859 9.76952 9.87501 9.05859 8.99805 9.05859C8.12108 9.05859 7.41016 9.76952 7.41016 10.6465C7.41016 11.5235 8.12108 12.2344 8.99805 12.2344Z"
                        stroke="currentColor"
                        strokeWidth="1.05859"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3.70508 6.94141C4.58205 6.94141 5.29297 6.23048 5.29297 5.35352C5.29297 4.47655 4.58205 3.76562 3.70508 3.76562C2.82811 3.76562 2.11719 4.47655 2.11719 5.35352C2.11719 6.23048 2.82811 6.94141 3.70508 6.94141Z"
                        stroke="currentColor"
                        strokeWidth="1.05859"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {selectedAddOns.length > 0
                      ? `Customized (${selectedAddOns.length})`
                      : "ADD-ONS & CUSTOMIZATION"}
                  </span>
                  {isAddOnsOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#1D293D]" />
                  )}
                </button>
                {isAddOnsOpen && (
                  <div className="mt-3 flex flex-col gap-3 rounded-[14px] border border-t-[#E2E8F0] bg-white p-[10px]">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search add-ons..."
                        value={addOnSearch}
                        onChange={(e) => setAddOnSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="product-card-variant-text w-full min-w-0 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 pl-7 pr-2 text-[#0A0A0A80]"
                      />
                      <svg
                        className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div className="space-y-1.5">
                      {filteredAddOns.map((addOn) => {
                        const selected = selectedAddOns.find((p) => p.addOn.id === addOn.id);
                        return (
                          <div
                            key={addOn.id}
                            className={`flex min-w-0 items-center justify-between gap-1.5 rounded-md border p-2 ${
                              selected
                                ? "border-primary bg-primary-muted"
                                : "border-zinc-200 bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAddOn(addOn);
                              }}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            >
                              <div
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  selected ? "border-primary bg-primary" : "border-zinc-300"
                                }`}
                              >
                                {selected && (
                                  <svg
                                    className="h-2.5 w-2.5 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex min-w-0 flex-col">
                                <span className="product-card-variant-text wrap-break-word font-medium text-zinc-800">
                                  {addOn.name}
                                </span>
                                <span className="product-card-price-small text-zinc-600">
                                  +
                                  {addOn.price.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                  })}{" "}
                                  LKR
                                </span>
                              </div>
                            </button>
                            {selected && (
                              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[#EA580C33] bg-white px-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAddOnQty(addOn.id, -1);
                                  }}
                                  className="py-0.5 text-[#90A1B9] hover:text-zinc-700"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span
                                  className="min-w-[14px] text-center font-bold text-[#0A0A0A]"
                                  style={{ fontSize: "11px", lineHeight: "16.5px" }}
                                >
                                  {selected.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAddOnQty(addOn.id, 1);
                                  }}
                                  className="py-0.5 text-[#90A1B9] hover:text-primary"
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
            )}

            <div className="mt-3 flex w-full min-w-0 items-center justify-between gap-2 border-t border-[#E2E8F0]">
              <div className="mt-4 flex w-full items-stretch justify-between gap-2">
                <div className="flex shrink-0 items-stretch gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-1 py-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQty((q) => Math.max(1, q - 1));
                    }}
                    className="flex w-7 items-center justify-center rounded-[7px] bg-[#F8FAFC] text-zinc-700"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="quantity-display flex min-w-[18px] items-center justify-center font-['Arial'] text-xs font-black leading-4 text-[#0A0A0A]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQty((q) => q + 1);
                    }}
                    className="flex w-7 items-center justify-center rounded-[7px] bg-[#EA580C] text-white"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="product-card-label font-['Arial'] text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-[#90A1B9]">
                    TOTAL PRICE
                  </p>
                  <p className="product-card-total-price font-['Arial'] text-lg font-black leading-7 text-[#EA580C]">
                    Rs.{totalPrice.toLocaleString("en-US")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex w-full min-w-0 gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="product-card-variant-text min-w-0 rounded-[14px] bg-[#E2E8F0] px-4 py-3 font-['Arial'] text-xs font-bold leading-4 text-[#314158] transition-all duration-300 ease-out hover:bg-[#CBD5E1] active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToOrder();
                }}
                className="product-card-variant-text flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-[#EA580C] py-3 font-['Arial'] text-xs font-bold leading-4 text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] transition-all duration-300 ease-out hover:bg-[#DC4C04] active:scale-95"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Add to Order
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="group flex flex-col overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-zinc-200 transition-shadow hover:shadow-md">
        <div
          className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-t-xl bg-zinc-100"
          onClick={handleImageClick}
        >
          <MenuProductImage
            productImageUrl={item.image}
            fallbackImageId={item.id}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {item.isOffer && (
            <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-[8px] bg-primary px-2 py-1 text-[10px] font-black uppercase text-white shadow-lg">
              <Tag className="h-3 w-3 shrink-0" />
              Offer
            </div>
          )}
          <button
            type="button"
            onClick={handleQuickAdd}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm hover:bg-white"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleBottomClick}
          className="flex flex-col gap-1 px-4 py-3 text-left"
        >
          <span className="product-card-category font-bold uppercase tracking-wider text-primary">
            {item.category}
          </span>
          <span className="product-card-title font-semibold text-zinc-800">{item.name}</span>
          <span className="product-card-price font-medium text-zinc-700">
            {item.isOffer ? "Offer Price: Rs." : "From Rs."}
            {item.price.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
        </button>
      </div>

      {showModal && (
        item.isOffer ? (
          <PromotionModal
            item={item}
            onClose={() => setShowModal(false)}
            onAddToOrder={addItem}
          />
        ) : (
          <ProductModal
            item={item}
            onClose={() => setShowModal(false)}
            onAddToOrder={addItem}
          />
        )
      )}
    </>
  );
}
