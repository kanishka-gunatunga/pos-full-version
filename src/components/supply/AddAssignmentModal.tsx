"use client";

import { useState, useMemo } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type {
  ProductAssignment,
  CreateAssignmentBody,
  AssignmentMaterialUsed,
} from "@/types/supply";
import { getAssignmentMaterialsUsed } from "@/lib/supply/assignmentHelpers";
import { formatQuantityValue } from "@/lib/format";
import type { Material, StockItem } from "@/types/supply";
import type { Product } from "@/types/product";

const SELECT_CLASS =
  "mt-1 h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] pl-3.5 pr-10 font-['Inter'] text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] [background-position:right_1rem_center] [background-repeat:no-repeat] [background-size:12px]";

interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: number;
  branchName: string;
  materials: Material[];
  products: Product[];
  stocks: StockItem[];
  initialAssignment?: ProductAssignment | null;
  onSave: (body: CreateAssignmentBody) => void | Promise<void>;
  isSaving?: boolean;
}

type MaterialRow = {
  id: string;
  materialId: number;
  stockId?: number;
  materialName: string;
  qtyValue: number;
  qtyUnit: string;
};

function toDateInputFormat(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  if (dateStr.includes("-")) return dateStr.slice(0, 10);
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    const month = m.padStart(2, "0");
    const day = d.padStart(2, "0");
    return `${y}-${month}-${day}`;
  }
  return "";
}

function formatExpiryDisplay(expiryDate: string | null | undefined): string {
  if (!expiryDate) return "—";
  const ymd = String(expiryDate).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return expiryDate;
  const [y, m, d] = ymd.split("-");
  return `${m}/${d}/${y}`;
}

function isExpiringSoon(expiryDate: string | null | undefined, daysThreshold = 7): boolean {
  if (!expiryDate) return false;
  const ymd = String(expiryDate).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map(Number);
  const expiry = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= daysThreshold;
}

export default function AddAssignmentModal({
  isOpen,
  onClose,
  branchId,
  branchName,
  materials,
  products,
  stocks,
  initialAssignment,
  onSave,
  isSaving = false,
}: AddAssignmentModalProps) {
  const isEditing = !!initialAssignment;

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [productId, setProductId] = useState<number | null>(() => initialAssignment?.productId ?? null);
  const [productName, setProductName] = useState<string>(() => initialAssignment?.productName ?? "");
  const [quantity, setQuantity] = useState<number>(() => initialAssignment?.quantity ?? 0);
  const [batchNo, setBatchNo] = useState<string>(() => initialAssignment?.batchNo ?? "");
  const [expiryDate, setExpiryDate] = useState<string>(() =>
    toDateInputFormat(initialAssignment?.expiryDate) ?? ""
  );
  const [materialsList, setMaterialsList] = useState<MaterialRow[]>(() => {
    const arr = initialAssignment
      ? getAssignmentMaterialsUsed(
          initialAssignment as { materialsUsed?: unknown; materials_used?: unknown },
          materials
        )
      : [];
    return arr.map((m, i) => ({
      id: `m-${i}-${Date.now()}`,
      materialId: m.materialId,
      stockId: m.stockId,
      materialName: m.materialName ?? "Material",
      qtyValue: m.qtyValue,
      qtyUnit: m.qtyUnit,
    }));
  });

  const [selectedStockId, setSelectedStockId] = useState<string>("");
  const [materialQty, setMaterialQty] = useState<number>(0);

  const productCategories = useMemo(
    () =>
      Array.from(
        new Set(
          products.map((p) => p.category?.name).filter((n): n is string => Boolean(n))
        )
      ),
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category?.name === selectedCategory);
  }, [products, selectedCategory]);

  const productNameFromId = productId ? products.find((p) => p.id === productId)?.name ?? "" : "";

  if (!isOpen) return null;

  const handleAddMaterial = () => {
    if (!selectedStockId || materialQty <= 0) return;
    const stock = stocks.find((s) => s.id === Number(selectedStockId));
    if (!stock) return;
    setMaterialsList((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        materialId: stock.materialId,
        stockId: stock.id,
        materialName: stock.materialName,
        qtyValue: materialQty,
        qtyUnit: stock.quantityUnit,
      },
    ]);
    setSelectedStockId("");
    setMaterialQty(0);
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterialsList((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalProductName = (productName.trim() || productNameFromId).trim();
    if (!finalProductName) {
      toast.error("Please select a product.");
      return;
    }

    if (
      !isEditing &&
      materialsList.length > 0 &&
      materialsList.some((m) => m.stockId == null || !Number.isFinite(m.stockId))
    ) {
      toast.error(
        "Each material must be chosen from the stock list (a specific batch). Remove empty rows or pick stock again."
      );
      return;
    }

    const materialsUsed: AssignmentMaterialUsed[] = materialsList.map((m) => ({
      materialId: m.materialId,
      ...(m.stockId != null ? { stockId: m.stockId } : {}),
      qtyValue: m.qtyValue,
      qtyUnit: m.qtyUnit,
    }));

    const body: CreateAssignmentBody = {
      branchId,
      productName: finalProductName,
      productId: productId ?? undefined,
      batchNo: batchNo.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      quantity,
      quantityUnit: "items",
      materialsUsed,
    };

    await onSave(body);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-8 pt-7 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-[#90A1B9] transition-colors hover:bg-[#F8FAFC]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div>
            <h2 className="font-['Inter'] text-[20px] font-bold leading-7 text-[#1D293D]">
              {isEditing ? "Edit Product Assignment" : "Create Product Assignment"}
            </h2>
            <p className="mt-1 font-['Inter'] text-sm leading-5 text-[#90A1B9]">
              {isEditing
                ? "Update the materials used for this product"
                : `Assign materials to a product for ${branchName} – stock will be reduced automatically`}
            </p>
          </div>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={handleSubmit}
        >
          <div className="scrollbar-subtle min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-8 py-2">
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="all">All Categories</option>
                {productCategories.map((cat) => (
                  <option key={String(cat)} value={String(cat)}>
                    {String(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                  Product<span className="text-[#EC003F]"> *</span>
                </label>
                <select
                  value={productId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setProductId(id);
                    const prod = products.find((p) => p.id === id);
                    setProductName(prod?.name ?? "");
                  }}
                  className={SELECT_CLASS}
                  required
                  disabled={isEditing}
                >
                  <option value="">Select product</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                  Product Quantity<span className="text-[#EC003F]"> *</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                  Batch Number (optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter batch number"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                  Expiry Date (optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                  Materials
                </label>
                <span className="font-['Inter'] text-xs text-[#94A3B8]">
                  Add materials required for this product
                </span>
              </div>

              <div className="flex h-[70px] flex-wrap items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-[17px]">
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="h-9 min-w-[200px] flex-1 cursor-pointer appearance-none rounded-[10px] border border-[#E2E8F0] bg-white pl-3.5 pr-10 font-['Inter'] text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] [background-position:right_1rem_center] [background-repeat:no-repeat] [background-size:12px]"
                >
                  <option value="">Select material</option>
                  {stocks
                    .filter((s) => !s.expired)
                    .map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        className={isExpiringSoon(s.expiryDate) ? "text-[#DC2626] font-medium" : ""}
                      >
                        {s.materialName} (Available: {formatQuantityValue(s.quantityValue)} {s.quantityUnit}) (Expire:{" "}
                        {formatExpiryDisplay(s.expiryDate)})
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={materialQty}
                  onChange={(e) => setMaterialQty(Number(e.target.value))}
                  placeholder="0"
                  className="h-9 w-20 rounded-[10px] border border-[#E2E8F0] bg-white px-2 font-['Inter'] text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                />
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="flex h-9 min-w-[40px] items-center justify-center rounded-[10px] bg-[#EA580C] px-2 font-['Inter'] text-sm font-bold text-white hover:bg-[#DC4C04]"
                  aria-label="Add material"
                >
                  ✓
                </button>
              </div>

              <div className="scrollbar-subtle mt-3 max-h-[200px] overflow-y-auto rounded-[18px] border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4">
                {materialsList.length === 0 ? (
                  <div className="flex min-h-[100px] flex-col items-center justify-center gap-1 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#94A3B8]">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-[#90A1B9] opacity-50"
                      >
                        <path
                          d="M14.6667 28.9729C15.0721 29.2069 15.5319 29.3301 16 29.3301C16.4681 29.3301 16.9279 29.2069 17.3333 28.9729L26.6667 23.6395C27.0717 23.4057 27.408 23.0695 27.6421 22.6647C27.8761 22.2598 27.9995 21.8005 28 21.3329V10.6662C27.9995 10.1986 27.8761 9.73929 27.6421 9.33443C27.408 8.92956 27.0717 8.59336 26.6667 8.35954L17.3333 3.02621C16.9279 2.79216 16.4681 2.66895 16 2.66895C15.5319 2.66895 15.0721 2.79216 14.6667 3.02621L5.33333 8.35954C4.92835 8.59336 4.59197 8.92956 4.35795 9.33443C4.12392 9.73929 4.00048 10.1986 4 10.6662V21.3329C4.00048 21.8005 4.12392 22.2598 4.35795 22.6647C4.59197 23.0695 4.92835 23.4057 5.33333 23.6395L14.6667 28.9729Z"
                          stroke="currentColor"
                          strokeWidth="2.66667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="font-['Inter'] text-sm text-[#94A3B8]">No materials added yet</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {materialsList.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between rounded-[12px] bg-white px-3 py-2"
                      >
                        <div>
                          <p className="font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            {m.materialName}
                          </p>
                          <p className="font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                            {formatQuantityValue(m.qtyValue)} {m.qtyUnit}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(m.id)}
                          className="rounded-lg p-1.5 text-[#FB2C36] hover:bg-[#FEE2E2]"
                          aria-label="Remove material"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex w-full shrink-0 gap-3 border-t border-[#E2E8F0] bg-white px-8 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex h-11 flex-1 items-center justify-center rounded-[16px] border border-[#E2E8F0] bg-white p-2.5 font-['Inter'] text-base font-bold leading-6 text-[#45556C] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex h-11 flex-1 items-center justify-center rounded-[16px] bg-[#EA580C] p-2.5 font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_8px_10px_-6px_#EA580C33,0px_20px_25px_-5px_#EA580C33] hover:bg-[#DC4C04] disabled:opacity-50"
            >
              {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create & reduce stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
