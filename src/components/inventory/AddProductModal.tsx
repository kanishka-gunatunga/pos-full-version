"use client";

import { useState, useEffect } from "react";
import { Plus, X, ChevronDown, Link2, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Product, UpdateProductPayload, readIsUnlimitedFromPrice } from "@/types/product";
import { useGetAllCategories } from "@/hooks/useCategory";
import { useGetAllModifications } from "@/hooks/useModification";
import { useUpdateProduct, useCreateProduct } from "@/hooks/useProduct";
import { useGetAllBranches } from "@/hooks/useBranch";

type AddProductModalProps = {
  open: boolean;
  overlayVisible: boolean;
  branchId: string;
  branchName: string;
  product: Product | null;
  onClose: () => void;
};

export default function AddProductModal({
  open,
  overlayVisible,
  branchId,
  branchName,
  product,
  onClose,
}: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    image: "",
    price: "",
    quantity: "",
    isUnlimited: false,
    categoryId: 0,
    subCategoryId: 0,
    barcode: "",
    variants: [] as { name: string; price: string; barcode?: string }[],
    addonGroupIds: [] as number[],
    selectedBranchIds: [] as number[],
  });

  const { data: categories } = useGetAllCategories("active");
  const { data: modifications } = useGetAllModifications("active");
  const { data: allBranches } = useGetAllBranches("active");
  const updateMutation = useUpdateProduct();
  const createMutation = useCreateProduct();

  const isEditing = !!product;
  const isLoading = updateMutation.isPending || createMutation.isPending;

  useEffect(() => {
    if (open) {
      if (product) {
        const variation = product.variations?.[0];
        const option = variation?.options?.[0];
        const prices = option?.prices ?? [];
        const contextBranchNum = Number.parseInt(branchId, 10);
        const productBranchIds = product.branches?.map((pb) => Number(pb.branchId)) ?? [];
        const branchPrice =
          prices.find((p) => Number(p.branchId) === contextBranchNum) ??
          prices.find((p) => productBranchIds.includes(Number(p.branchId))) ??
          prices[0];

        setFormData({
          name: product.name,
          code: product.code,
          image: product.image || "",
          price: branchPrice?.price != null ? String(branchPrice.price) : "",
          quantity: branchPrice?.quantity != null ? String(branchPrice.quantity) : "",
          isUnlimited: readIsUnlimitedFromPrice(branchPrice),
          categoryId: product.categoryId || 0,
          subCategoryId: product.subCategoryId || 0,
          barcode: product.barcode || "",
          variants: variation?.options?.map(o => ({
            name: o.name,
            price: o.prices?.[0]?.price.toString() || "",
            barcode: o.barcode || ""
          })) || [],
          addonGroupIds: product.productModifications?.map(pm => pm.modificationId) || [],
          selectedBranchIds: product.branches?.map(pb => pb.branchId) || [],
        });
      } else {
        setFormData({
          name: "",
          code: "",
          image: "",
          price: "",
          quantity: "",
          isUnlimited: false,
          categoryId: 0,
          subCategoryId: 0,
          barcode: "",
          variants: [],
          addonGroupIds: [],
          selectedBranchIds: [parseInt(branchId)],
        });
      }
    }
  }, [open, product, branchId]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) return;

    const unlimited = formData.isUnlimited;
    const qty = unlimited ? 0 : parseInt(formData.quantity, 10) || 0;

    const payload: UpdateProductPayload = {
      name: formData.name,
      code: formData.code,
      image: formData.image,
      sku: formData.code,
      shortDescription: formData.name,
      description: formData.name,
      categoryId: formData.categoryId || undefined,
      subCategoryId: formData.subCategoryId || undefined,
      barcode: formData.barcode || undefined,
      branches: formData.selectedBranchIds,
      variations: [
        {
          name: "Variants",
          options: formData.variants.length > 0
            ? formData.variants.map(v => ({
              name: v.name,
              barcode: v.barcode || undefined,
              prices: formData.selectedBranchIds.map(bid => ({
                branchId: bid,
                price: parseFloat(v.price) || 0,
                discountPrice: 0,
                quantity: qty,
                isUnlimited: unlimited,
              }))
            }))
            : [{
              name: "Standard",
              barcode: formData.barcode || undefined,
              prices: formData.selectedBranchIds.map(bid => ({
                branchId: bid,
                price: parseFloat(formData.price) || 0,
                discountPrice: 0,
                quantity: qty,
                isUnlimited: unlimited,
              }))
            }]
        }
      ],
      modifications: formData.addonGroupIds.map(id => ({ modificationId: id }))
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: product.id, data: payload });
        toast.success("Product updated successfully");
      } else {
        await createMutation.mutateAsync({ data: payload as any });
        toast.success("Product created successfully");
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to save product:", err);
      toast.error(err?.response?.data?.message || "Failed to save product");
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ease-out"
      style={{ opacity: overlayVisible ? 1 : 0 }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex shrink-0 items-start justify-between">
          <div>
            <h2 id="add-product-title" className="font-['Inter'] text-[20px] font-bold text-[#1D293D]">
              {isEditing ? "Edit Product" : "Create New Product"}
            </h2>
            <p className="mt-1 font-['Inter'] text-sm text-[#90A1B9]">
              {isEditing ? `Update details for ${product.name}` : `Add product details for ${branchName}`}
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

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#E2E8F0] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-name" className="mb-1.5 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                Product Name
              </label>
              <input
                id="product-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Pepperoni Pizza"
                className="w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2.5 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>
            <div>
              <label htmlFor="product-code" className="mb-1.5 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                Product Code
              </label>
              <input
                id="product-code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="PRD-001"
                className="w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2.5 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>
            <div>
              <label htmlFor="product-image" className="mb-1.5 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                Product Image URL
              </label>
              <div className="relative">
                <input
                  id="product-image"
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://unsplash.com/..."
                  className="w-full rounded-[10px] border border-[#E2E8F0] bg-white py-2.5 pl-3 pr-10 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                />
                <Link2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
              </div>
            </div>
            <div>
              <label htmlFor="category" className="mb-1.5 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                Category
              </label>
              <div className="relative">
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    setFormData(prev => ({ ...prev, categoryId: id, subCategoryId: 0 }));
                  }}
                  className="w-full appearance-none rounded-[10px] border border-[#E2E8F0] bg-white py-2.5 pl-3 pr-10 font-['Inter'] text-sm text-[#1D293D] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                >
                  <option value="0">Category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
              </div>
            </div>
            <div>
              <label htmlFor="sub-category" className="mb-1.5 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                Sub-Category
              </label>
              <div className="relative">
                <select
                  id="sub-category"
                  value={formData.subCategoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, subCategoryId: parseInt(e.target.value) }))}
                  className="w-full appearance-none rounded-[10px] border border-[#E2E8F0] bg-white py-2.5 pl-3 pr-10 font-['Inter'] text-sm text-[#1D293D] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                  disabled={!formData.categoryId}
                >
                  <option value="0">Sub-Category</option>
                  {categories?.find(c => c.id === formData.categoryId)?.subcategories?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
              Select Branches
            </label>
            <div className="flex flex-wrap gap-2">
              {allBranches?.map((b) => {
                const isSelected = formData.selectedBranchIds.includes(Number(b.id));
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        selectedBranchIds: isSelected
                          ? prev.selectedBranchIds.filter(id => id !== Number(b.id))
                          : [...prev.selectedBranchIds, Number(b.id)]
                      }));
                    }}
                    className={`rounded-full px-4 py-1.5 font-['Inter'] text-sm font-medium transition-colors ${isSelected
                      ? "bg-[#EA580C] text-white"
                      : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                      }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[12px] border border-[#BFDBFE] bg-[#F0F9FF]/60 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#3B82F6]" />
              <span className="font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                Inventory Details
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className="mb-1.5 flex items-center gap-1 font-['Inter'] text-xs font-medium text-[#45556C]">
                  Price (Rs.)
                </label>
                <input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2.5 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                />
              </div>
              <div>
                <label htmlFor="quantity" className="mb-1.5 flex items-center gap-1 font-['Inter'] text-xs font-medium text-[#45556C]">
                  Quantity
                </label>
                <input
                  id="quantity"
                  type="text"
                  inputMode="numeric"
                  value={formData.quantity}
                  disabled={formData.isUnlimited}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0"
                  className="w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2.5 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2 font-['Inter'] text-xs text-[#45556C]">
                  <input
                    type="checkbox"
                    checked={formData.isUnlimited}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isUnlimited: e.target.checked }))
                    }
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#CAD5E2] accent-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/35"
                  />
                  <span>Unlimited quantity (prepared on demand)</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex shrink-0 items-center justify-between">
              <label className="block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                Product Variants (E.G. Sizes)
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, variants: [...prev.variants, { name: "", price: "" }] }))}
                className="flex items-center gap-1 font-['Inter'] text-sm font-bold text-[#EA580C]"
              >
                <Plus className="h-4 w-4" />
                Add Variant
              </button>
            </div>
            {formData.variants.length === 0 ? (
              <div className="rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-6 font-['Inter'] text-sm text-[#90A1B9]">
                No variants added yet. Add variants for different sizes or options.
              </div>
            ) : (
              <div className="max-h-40 space-y-3 overflow-y-auto [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#E2E8F0] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                {formData.variants.map((v, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => {
                          const next = [...formData.variants];
                          next[i].name = e.target.value;
                          setFormData(prev => ({ ...prev, variants: next }));
                        }}
                        placeholder="Variant Name (e.g. Large)"
                        className="w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2.5 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                      />
                    </div>
                    <div className="w-28 shrink-0">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['Inter'] text-sm text-[#90A1B9]">Rs.</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={v.price}
                          onChange={(e) => {
                            const next = [...formData.variants];
                            next[i].price = e.target.value;
                            setFormData(prev => ({ ...prev, variants: next }));
                          }}
                          placeholder="Price"
                          className="w-full rounded-[10px] border border-[#E2E8F0] bg-white py-2.5 pl-8 pr-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                        />
                      </div>
                    </div>

                    <div className="flex items-end pb-1">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }))}
                        className="rounded-lg p-2 text-[#90A1B9] hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove variant"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
              Attach Add-on Groups
            </label>
            <div className="flex flex-wrap gap-3">
              {modifications?.map((g) => {
                const selected = formData.addonGroupIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        addonGroupIds: selected
                          ? prev.addonGroupIds.filter(id => id !== g.id)
                          : [...prev.addonGroupIds, g.id]
                      }));
                    }}
                    className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors ${selected
                      ? "border-[#EA580C] bg-[#EA580C1A]"
                      : "border-[#E2E8F0] bg-white hover:border-[#CAD5E2]"
                      }`}
                  >
                    <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${selected ? "border-[#EA580C] bg-[#EA580C]" : "border-[#90A1B9]"}`} />
                    <div>
                      <p className="font-['Inter'] text-xs text-[#90A1B9]">{g.items?.length || 0} items</p>
                      <p className="font-['Inter'] text-sm font-bold text-[#1D293D]">{g.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex shrink-0 justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-bold text-[#45556C] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !formData.name.trim() || !formData.code.trim()}
            aria-busy={isLoading}
            className="flex min-w-40 items-center justify-center gap-2 rounded-[14px] bg-[#EA580C] px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                <span>{isEditing ? "Updating…" : "Creating…"}</span>
              </>
            ) : (
              <span>{isEditing ? "Update Product" : "Create Product"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
