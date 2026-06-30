"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  Pencil,
  Trash2,
  Download,
  Upload,
} from "lucide-react";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { SUPPLY_TABS, type SupplyTabId } from "@/domains/supply/types";
import type { Supplier, Material, StockItem, ProductAssignment } from "@/types/supply";
import { useGetAllBranches } from "@/hooks/useBranch";
import {
  useSuppliersList,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useMaterialsList,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  useStocksList,
  useCreateStock,
  useUpdateStock,
  useDeleteStock,
  useImportStocks,
  useAssignmentsList,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
} from "@/hooks/useSupply";
import { useGetAllCategories } from "@/hooks/useCategory";
import { useGetProductsByBranch } from "@/hooks/useProduct";
import AddSupplierModal from "@/components/supply/AddSupplierModal";
import AddMaterialModal from "@/components/supply/AddMaterialModal";
import AddStockModal from "@/components/supply/AddStockModal";
import AddAssignmentModal from "@/components/supply/AddAssignmentModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { getStockRowDisplay } from "@/lib/supply/stockExpiry";
import { getAssignmentMaterialsUsed } from "@/lib/supply/assignmentHelpers";
import { formatQuantityValue, formatOptionalField } from "@/lib/format";

const STOCK_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  low: "Low Stock",
  out: "Out of Stock",
  expired: "Expired",
};

function exportStocksToExcel(
  stocks: StockItem[],
  branches: { id: number; name: string }[]
) {
  if (stocks.length === 0) return;
  const rows = stocks.map((row) => ({
    "Material Name": row.materialName,
    "Category": row.category,
    "Supplier": row.supplierName,
    "Batch No.": row.batchNo ?? "",
    "Expiry Date": row.expiryDate ?? "",
    "Quantity": `${formatQuantityValue(row.quantityValue)} ${row.quantityUnit}`,
    "Status": STOCK_STATUS_LABELS[getStockRowDisplay(row).displayStatus] ?? row.status,
    "Branch": branches.find((b) => b.id === row.branchId)?.name ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stocks");
  XLSX.writeFile(wb, `stocks-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function toYmdFromUnknown(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  if (!s) return "";
  // already ISO-like
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // common MM/DD/YYYY or M/D/YYYY
  const mdY = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdY) {
    const [, mm, dd, yyyy] = mdY;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return s;
}

function csvEscapeCell(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function parseQuantityString(raw: unknown): { value: number; unit?: string } {
  const s = String(raw ?? "").trim();
  if (!s) return { value: NaN };
  // supports "12.5 kg" or "12.5kg"
  const m = s.match(/^([0-9]*\.?[0-9]+)\s*([a-zA-Z]+)?$/);
  if (!m) return { value: NaN };
  const value = Number(m[1]);
  const unitRaw = (m[2] ?? "").toLowerCase();
  const unit =
    unitRaw === "pcs" ? "pieces" : unitRaw === "piece" ? "pieces" : unitRaw || undefined;
  return { value, unit };
}

async function excelFileToImportCsvFile(
  file: File,
  lookups: {
    branches: { id: number; name: string }[];
    materials: { id: number; name: string; unit?: string; allBranches?: boolean; branchIds?: number[] }[];
    suppliers: { id: number; name: string }[];
  },
  forcedBranchId: number
): Promise<File> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames?.[0];
  if (!sheetName) throw new Error("Excel file has no sheets.");
  const ws = wb.Sheets[sheetName];

  // Read header row to detect format
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
  const headerRow = (rows[0] ?? []).map((h) => String(h).trim());

  const hasIdHeaders =
    headerRow.includes("branchId") &&
    headerRow.includes("materialId") &&
    headerRow.includes("supplierId") &&
    headerRow.includes("quantityValue");

  // If already ID-based, just convert sheet to CSV as-is
  if (hasIdHeaders) {
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ",", RS: "\n" });
    return new File([csv], file.name.replace(/\.(xlsx|xls)$/i, ".csv"), { type: "text/csv" });
  }

  // Otherwise try to map from our Export-to-Excel format:
  // "Material Name", "Supplier", "Batch No.", "Expiry Date", "Quantity", "Branch"
  const idx = (name: string) => headerRow.findIndex((h) => h === name);
  const iMaterial = idx("Material Name");
  const iSupplier = idx("Supplier");
  const iBatch = idx("Batch No.");
  const iExpiry = idx("Expiry Date");
  const iQty = idx("Quantity");
  const iBranch = idx("Branch");

  const requiredPresent = [iMaterial, iSupplier, iQty].every((i) => i >= 0);
  if (!requiredPresent) {
    throw new Error(
      "Invalid Excel format. Please upload either an ID-based import template (branchId/materialId/...) or an exported Stocks Excel."
    );
  }

  const branchByName = new Map(
    lookups.branches.map((b) => [b.name.trim().toLowerCase(), b.id])
  );
  const materialByName = new Map(
    lookups.materials.map((m) => [
      m.name.trim().toLowerCase(),
      { id: m.id, unit: m.unit, allBranches: m.allBranches, branchIds: m.branchIds ?? [] },
    ])
  );
  const supplierByName = new Map(
    lookups.suppliers.map((s) => [s.name.trim().toLowerCase(), s.id])
  );

  const outHeader = [
    "branchId",
    "materialId",
    "supplierId",
    "quantityValue",
    "quantityUnit",
    "batchNo",
    "expiryDate",
  ];

  const outLines: string[] = [outHeader.join(",")];
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const branchName = iBranch >= 0 ? String(row[iBranch] ?? "").trim() : "";
    const materialName = String(row[iMaterial] ?? "").trim();
    const supplierName = String(row[iSupplier] ?? "").trim();
    const qtyRaw = row[iQty];

    if (!branchName && !materialName && !supplierName && !String(qtyRaw ?? "").trim()) {
      continue; // skip empty row
    }

    const branchId =
      forcedBranchId ||
      branchByName.get(branchName.toLowerCase());
    const materialInfo = materialByName.get(materialName.toLowerCase());
    const supplierId = supplierByName.get(supplierName.toLowerCase());
    const parsedQty = parseQuantityString(qtyRaw);

    if (!branchId) errors.push(`Row ${r + 1}: Missing/invalid branch (select a branch in UI)`);
    if (!materialInfo) errors.push(`Row ${r + 1}: Unknown material "${materialName}"`);
    if (!supplierId) errors.push(`Row ${r + 1}: Unknown supplier "${supplierName}"`);
    if (!Number.isFinite(parsedQty.value)) errors.push(`Row ${r + 1}: Invalid quantity "${qtyRaw}"`);

    if (!branchId || !materialInfo || !supplierId || !Number.isFinite(parsedQty.value)) continue;

    // Do not block import when a material isn't assigned to the selected branch.
    // Backend will fall back to material-level min stock (or 0) when no per-branch min exists.

    const quantityUnit = parsedQty.unit || materialInfo.unit || "";
    const batchNo = iBatch >= 0 ? String(row[iBatch] ?? "").trim() : "";
    const expiryDate = iExpiry >= 0 ? toYmdFromUnknown(row[iExpiry]) : "";

    outLines.push(
      [
        branchId,
        materialInfo.id,
        supplierId,
        parsedQty.value,
        quantityUnit,
        batchNo,
        expiryDate,
      ]
        .map(csvEscapeCell)
        .join(",")
    );
  }

  if (errors.length) {
    throw new Error(errors.slice(0, 5).join(" | ") + (errors.length > 5 ? " ..." : ""));
  }

  const csv = outLines.join("\n");
  return new File([csv], file.name.replace(/\.(xlsx|xls)$/i, ".csv"), { type: "text/csv" });
}

function StatusPill({
  status,
  label,
  icon: Icon,
  className,
}: {
  status?: string;
  label: string;
  icon: React.ElementType;
  className: string;
}) {
  return (
    <span
      data-status={status}
      className={`inline-flex h-[22px] items-center justify-center gap-1 rounded-[8px] border px-2 py-0.5 font-['Inter'] text-xs font-medium leading-4 ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

function ActiveStatusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1062_2844)">
        <path
          d="M10.9003 4.99975C11.1287 6.1204 10.9659 7.28546 10.4392 8.30065C9.91255 9.31583 9.05375 10.1198 8.00606 10.5784C6.95837 11.037 5.78512 11.1226 4.68196 10.8209C3.57879 10.5192 2.6124 9.84845 1.94394 8.92046C1.27549 7.99247 0.945367 6.86337 1.00864 5.72144C1.07191 4.57952 1.52475 3.4938 2.29163 2.64534C3.05852 1.79688 4.0931 1.23697 5.22284 1.05898C6.35258 0.880989 7.5092 1.09568 8.49981 1.66725"
          stroke="#008236"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4.5 5.5L6 7L11 2" stroke="#008236" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_1062_2844">
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function InactiveStatusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1062_2934)">
        <path
          d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
          stroke="#030213"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M7.5 4.5L4.5 7.5" stroke="#030213" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 4.5L7.5 7.5" stroke="#030213" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_1062_2934">
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function StockAvailableIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_stock_available)">
        <path
          d="M10.9003 4.99975C11.1287 6.1204 10.9659 7.28546 10.4392 8.30065C9.91255 9.31583 9.05375 10.1198 8.00606 10.5784C6.95837 11.037 5.78512 11.1226 4.68196 10.8209C3.57879 10.5192 2.6124 9.84845 1.94394 8.92046C1.27549 7.99247 0.945367 6.86337 1.00864 5.72144C1.07191 4.57952 1.52475 3.4938 2.29163 2.64534C3.05852 1.79688 4.0931 1.23697 5.22284 1.05898C6.35258 0.880989 7.5092 1.09568 8.49981 1.66725"
          stroke="#008236"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4.5 5.5L6 7L11 2" stroke="#008236" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_stock_available">
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function StockLowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_stock_low)">
        <path
          d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
          stroke="#CA3500"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M6 4V6" stroke="#CA3500" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 8H6.005" stroke="#CA3500" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_stock_low">
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function StockOutIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_stock_out)">
        <path
          d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M7.5 4.5L4.5 7.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 4.5L7.5 7.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_stock_out">
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

const DEFAULT_PAGE_SIZE = 100;

export default function SupplyContent() {
  const router = useRouter();
  const { isCashier } = useAuth();
  const { data: branches = [] } = useGetAllBranches("active");
  const { data: categories = [] } = useGetAllCategories("active");

  const [activeTab, setActiveTab] = useState<SupplyTabId>("suppliers");
  const [selectedSupplierBranch, setSelectedSupplierBranch] = useState<string>("all");
  const [searchSuppliers, setSearchSuppliers] = useState("");
  const [searchMaterials, setSearchMaterials] = useState("");
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<string>("all");
  const [selectedMaterialBranch, setSelectedMaterialBranch] = useState<string>("all");
  const [searchStocks, setSearchStocks] = useState("");
  const [selectedStockBranch, setSelectedStockBranch] = useState<number | "all">("all");
  const [selectedStockCategory, setSelectedStockCategory] = useState<string>("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>("all");
  const [searchAssignments, setSearchAssignments] = useState("");
  const [selectedAssignmentBranch, setSelectedAssignmentBranch] = useState<number | "all">("all");
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<StockItem | null>(null);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [importStocksFile, setImportStocksFile] = useState<{ original: File; upload: File } | null>(
    null
  );
  const [assignmentToDelete, setAssignmentToDelete] = useState<ProductAssignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<ProductAssignment | null>(null);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);

  const supplierBranchId = selectedSupplierBranch === "all" ? "all" : Number(selectedSupplierBranch);
  const { data: suppliersResponse, isLoading: suppliersLoading } = useSuppliersList({
    q: searchSuppliers || undefined,
    branchId: Number.isNaN(supplierBranchId) ? "all" : supplierBranchId,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const suppliers = suppliersResponse?.data ?? [];

  const materialBranchId = selectedMaterialBranch === "all" ? "all" : Number(selectedMaterialBranch);
  const { data: materialsResponse, isLoading: materialsLoading } = useMaterialsList({
    q: searchMaterials || undefined,
    category: selectedMaterialCategory === "all" ? "all" : selectedMaterialCategory,
    branchId: Number.isNaN(materialBranchId) ? "all" : materialBranchId,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const materials = (materialsResponse?.data ?? []).filter((m) => m.isActive !== false);

  const { data: stocksResponse, isLoading: stocksLoading } = useStocksList({
    q: searchStocks || undefined,
    branchId: selectedStockBranch,
    category: selectedStockCategory === "all" ? "all" : selectedStockCategory,
    status: selectedStockStatus === "all" ? "all" : (selectedStockStatus as "available" | "low" | "out" | "expired"),
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const stocks = (stocksResponse?.data ?? []).filter((s) => s.isActive !== false);

  const { data: assignmentsResponse, isLoading: assignmentsLoading } = useAssignmentsList({
    q: searchAssignments || undefined,
    branchId: selectedAssignmentBranch,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const assignments = (assignmentsResponse?.data ?? []).filter((a) => a.isActive !== false);

  const { data: allSuppliersResponse } = useSuppliersList({
    status: "active",
    page: 1,
    pageSize: 100,
  });
  const allSuppliers = allSuppliersResponse?.data ?? [];

  const { data: allMaterialsResponse } = useMaterialsList({
    page: 1,
    pageSize: 100,
  });
  const allMaterials = allMaterialsResponse?.data ?? [];

  const assignmentBranchId =
    selectedAssignmentBranch === "all" ? null : Number(selectedAssignmentBranch);
  const { data: stocksForAssignmentBranchResponse } = useStocksList({
    branchId: assignmentBranchId ?? "all",
    status: "all",
    page: 1,
    pageSize: 200,
  });
  const stocksForAssignmentBranch = (stocksForAssignmentBranchResponse?.data ?? []).filter(
    (s) => s.isActive !== false
  );
  const { data: productsForAssignmentBranch = [] } = useGetProductsByBranch(
    assignmentBranchId ?? 0
  );

  const editBranchId = editingAssignment?.branchId ?? 0;
  const { data: stocksForEditBranchResponse } = useStocksList({
    branchId: editBranchId || "all",
    status: "all",
    page: 1,
    pageSize: 200,
  });
  const stocksForEditBranch = (stocksForEditBranchResponse?.data ?? []).filter(
    (s) => s.isActive !== false
  );
  const { data: productsForEditBranch = [] } = useGetProductsByBranch(editBranchId);

  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();
  const createMaterialMutation = useCreateMaterial();
  const updateMaterialMutation = useUpdateMaterial();
  const deleteMaterialMutation = useDeleteMaterial();
  const createStockMutation = useCreateStock();
  const updateStockMutation = useUpdateStock();
  const deleteStockMutation = useDeleteStock();
  const importStocksMutation = useImportStocks();
  const createAssignmentMutation = useCreateAssignment();
  const updateAssignmentMutation = useUpdateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();

  const materialCategories = useMemo(
    () => Array.from(new Set(materials.map((m) => m.category))),
    [materials]
  );
  const stockCategories = useMemo(
    () => Array.from(new Set(stocks.map((s) => s.category))),
    [stocks]
  );
  const stockStatuses = useMemo(
    () => Array.from(new Set(stocks.map((s) => s.status))),
    [stocks]
  );

  useEffect(() => {
    if (isCashier) router.replace(ROUTES.DASHBOARD_MENU);
  }, [isCashier, router]);

  if (isCashier) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto ">
        <div className="space-y-6 ">
          <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-6">
            <h1 className="font-['Inter'] text-[24px] font-bold leading-8 text-[#1D293D]">
              Supply Management
            </h1>
            <p className="mt-1 font-['Inter'] text-[14px] leading-5 text-[#62748E]">
              Manage suppliers, materials, and product assignments
            </p>
          </div>

          <div className="w-full overflow-hidden ">
            <div className="rounded-t-[20px] border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 pb-5 pt-2">
              <div className="flex flex-wrap gap-2">
                {SUPPLY_TABS.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={`flex h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-center font-['Inter'] text-base font-medium leading-6 transition-opacity duration-300 ease-out ${
                        isActive
                          ? "bg-[#EA580C] text-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]"
                          : "bg-[#F1F5F9] text-[#45556C] hover:opacity-90"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[#45556C]"}`}
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suppliers tab */}
            {activeTab === "suppliers" && (
              <div className="p-4 sm:p-6 ">
                <div className="border border-[#E2E8F0] rounded-[14px] p-6 bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                  <div className="mb-4 flex flex-col gap-4 ">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                        <input
                          type="search"
                          value={searchSuppliers}
                          onChange={(e) => setSearchSuppliers(e.target.value)}
                          placeholder="Search suppliers..."
                          className="w-full rounded-[14px] border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddSupplierOpen(true)}
                        className="flex shrink-0 items-center gap-2 self-start rounded-[14px] bg-[#EA580C] px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] transition-opacity hover:opacity-90"
                      >
                        <Plus className="h-4 w-4" />
                        Add Supplier
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-4 w-4 shrink-0 items-center justify-center"
                          aria-hidden
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-[#90A1B9]"
                          >
                            <path
                              d="M6.66659 13.3333C6.66653 13.4572 6.701 13.5787 6.76612 13.6841C6.83124 13.7895 6.92443 13.8746 7.03526 13.93L8.36859 14.5967C8.47025 14.6475 8.58322 14.6714 8.69675 14.6663C8.81029 14.6612 8.92062 14.6271 9.01728 14.5673C9.11393 14.5075 9.1937 14.424 9.249 14.3247C9.30431 14.2254 9.33331 14.1137 9.33326 14V9.33333C9.33341 9.00292 9.45623 8.68433 9.67792 8.43933L14.4933 3.11333C14.5796 3.01771 14.6363 2.89912 14.6567 2.77192C14.677 2.64472 14.66 2.51435 14.6079 2.39658C14.5557 2.27881 14.4705 2.17868 14.3626 2.1083C14.2547 2.03792 14.1287 2.0003 13.9999 2H1.99992C1.87099 2.00005 1.74484 2.03748 1.63676 2.10776C1.52867 2.17804 1.44328 2.27815 1.39093 2.39598C1.33858 2.5138 1.32151 2.64427 1.34181 2.77159C1.3621 2.89892 1.41887 3.01762 1.50526 3.11333L6.32192 8.43933C6.54361 8.68433 6.66644 9.00292 6.66659 9.33333V13.3333Z"
                              stroke="currentColor"
                              strokeWidth="1.33333"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <select
                          value={selectedSupplierBranch}
                          onChange={(e) => setSelectedSupplierBranch(e.target.value)}
                          className="flex h-9 w-[256px] cursor-pointer appearance-none items-center rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] pl-4 pr-10 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] [background-position:right_0.75rem_center] [background-repeat:no-repeat] [background-size:12px]"
                        >
                          <option value="all">All Branches</option>
                          {branches.map((b) => (
                            <option key={b.id} value={String(b.id)}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[420px] overflow-auto bg-white sm:max-h-[480px] min-[1000px]:max-h-[540px] xl:max-h-[620px]">
                    <table className="w-full min-w-[800px] text-left">
                      <thead>
                        <tr className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Supplier Name
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Branch
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Contact Person
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Email
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Phone
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {suppliersLoading ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center font-['Inter'] text-sm text-[#62748E]">
                              Loading suppliers...
                            </td>
                          </tr>
                        ) : suppliers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center font-['Inter'] text-sm text-[#62748E]">
                              <p className="font-medium text-[#45556C]">No suppliers found</p>
                              <p className="mt-1 text-[#90A1B9]">
                                Try a different search or branch filter.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          suppliers.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-[#F1F5F9] transition-colors last:border-b-0 hover:bg-[#F8FAFC]"
                          >
                            <td className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                              {row.name}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center justify-center gap-1 rounded-[8px] border border-[#0000001A] bg-[#F8FAFC] px-2 py-1 font-['Inter'] text-xs font-medium leading-4 text-[#0A0A0A]">
                                {row.branch?.name ?? String(row.branchId)}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-['Inter'] text-sm font-normal leading-5 text-[#0A0A0A]">
                              {row.contactPerson}
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={`mailto:${row.email}`}
                                className="font-['Inter'] text-sm font-normal leading-5 text-[#45556C] hover:underline"
                              >
                                {row.email}
                              </a>
                            </td>
                            <td className="px-4 py-3 font-['Inter'] text-sm font-normal leading-5 text-[#45556C]">
                              {row.phone}
                            </td>
                            <td className="px-4 py-3">
                              {row.status === "active" ? (
                                <StatusPill
                                  label="Active"
                                  icon={ActiveStatusIcon}
                                  className="border-[#B9F8CF] bg-[#DCFCE7] text-[#008236]"
                                />
                              ) : (
                                <StatusPill
                                  label="Inactive"
                                  icon={InactiveStatusIcon}
                                  className="border-[#00000011] bg-[#ECEEF2] text-[#030213]"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-[#45556C] hover:bg-[#F1F5F9]"
                                  aria-label="Edit"
                                  onClick={() => {
                                    setEditingSupplier(row);
                                    setIsAddSupplierOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-[#B91C1C] hover:bg-[#FEE2E2]"
                                  aria-label="Delete"
                                  onClick={() => setSupplierToDelete(row)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Materials tab */}
            {activeTab === "materials" && (
              <div className="p-4 sm:p-6">
                <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                  <div className="mb-4 flex flex-col gap-4">
                    {/* Row 1: search + action */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                        <input
                          type="search"
                          value={searchMaterials}
                          onChange={(e) => setSearchMaterials(e.target.value)}
                          placeholder="Search materials..."
                          className="w-full rounded-[14px] border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddMaterialOpen(true)}
                        className="flex shrink-0 items-center gap-2 self-start rounded-[14px] bg-[#EA580C] px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] transition-opacity hover:opacity-90"
                      >
                        <Plus className="h-4 w-4" />
                        Add Material
                      </button>
                    </div>

                    {/* Row 2: filters */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Filter className="h-5 w-5 text-[#90A1B9]" />
                      <div className="flex items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5">
                        <div className="relative">
                          <select
                            value={selectedMaterialCategory}
                            onChange={(e) => setSelectedMaterialCategory(e.target.value)}
                            className="h-6 cursor-pointer appearance-none bg-[#F8FAFC] pr-6 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A] focus:outline-none"
                          >
                            <option value="all">All Categories</option>
                            {materialCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5">
                        <div className="relative">
                          <select
                            value={selectedMaterialBranch}
                            onChange={(e) => setSelectedMaterialBranch(e.target.value)}
                            className="h-6 cursor-pointer appearance-none bg-[#F8FAFC] pr-6 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A] focus:outline-none"
                          >
                            <option value="all">All Branches</option>
                            {branches.map((b) => (
                              <option key={b.id} value={String(b.id)}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-auto  sm:max-h-[480px] min-[1000px]:max-h-[540px] xl:max-h-[620px] mt-8">
                    <table className="w-full min-w-[700px] border-collapse text-left">
                      <thead>
                        <tr className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Material Name
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Category
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Unit
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Branches
                          </th>
                          <th className="px-4 py-3 text-right font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {materialsLoading ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center font-['Inter'] text-sm text-[#62748E]">
                              Loading materials...
                            </td>
                          </tr>
                        ) : materials.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center font-['Inter'] text-sm text-[#62748E]">
                              <p className="font-medium text-[#45556C]">No materials found</p>
                              <p className="mt-1 text-[#90A1B9]">
                                Try a different search, category, or branch filter.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          materials.map((row) => (
                          <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                              {row.name}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex h-[22px] items-center justify-center rounded-[8px] border border-[#0000001A] bg-[#F8FAFC] px-2 py-0.5 font-['Inter'] text-xs font-medium leading-4 text-[#0A0A0A]">
                                {row.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-['Inter'] text-sm font-normal leading-5 text-[#0A0A0A]">
                              {row.unit}
                            </td>
                            <td className="px-4 py-3">
                              {row.allBranches ? (
                                <span className="inline-flex h-[22px] w-[90px] items-center justify-center rounded-[8px] border border-[#EA580C] bg-[#EA580C] px-2 py-0.5 font-['Inter'] text-xs font-medium leading-4 text-white">
                                  All Branches
                                </span>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                  {(row.branchIds ?? [])
                                    .map((id) => branches.find((b) => b.id === id)?.name)
                                    .filter(Boolean)
                                    .map((name) => (
                                      <span
                                        key={`${row.id}-${name}`}
                                        className="inline-flex  items-center justify-center gap-1 rounded-[8px] border border-[#0000001A] bg-[#F8FAFC] px-3 py-1 font-['Inter'] text-xs font-medium leading-4 text-[#0A0A0A]"
                                      >
                                        {name}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
                                  aria-label="Edit"
                                  onClick={() => {
                                    setEditingMaterial(row);
                                    setIsAddMaterialOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 text-[#0A0A0A]" />
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-[#90A1B9] hover:bg-[#FEE2E2] hover:text-[#B91C1C]"
                                  aria-label="Delete"
                                  onClick={() => setMaterialToDelete(row)}
                                >
                                  <Trash2 className="h-4 w-4 text-[#FB2C36]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Management tab */}
            {activeTab === "stock" && (
              <div className="p-4 sm:p-6">
                <div className="bg-white border-t border-[#E2E8F0] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] rounded-[14px] p-6">
                  <div className="mb-4 flex flex-col gap-4">
                    {/* Row 1: branch select */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="font-['Inter'] text-sm font-medium text-[#45556C]">
                          Select Branch:
                        </label>
                        <select
                          value={selectedStockBranch === "all" ? "all" : String(selectedStockBranch)}
                          onChange={(e) =>
                            setSelectedStockBranch(
                              e.target.value === "all" ? "all" : Number(e.target.value)
                            )
                          }
                          className="h-9 min-w-[160px] cursor-pointer appearance-none rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] pl-4 pr-8 font-['Inter'] text-sm font-medium leading-5 text-[#1D293D] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2012%2012%22%20fill=%22none%22%3E%3Cpath%20d=%22M3%204.5L6%207.5L9%204.5%22%20stroke=%22%2390A1B9%22%20stroke-width=%221.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[length:12px] bg-[right_0.75rem_center]"
                        >
                          <option value="all">All Branches</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: search + actions */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                        <input
                          type="search"
                          value={searchStocks}
                          onChange={(e) => setSearchStocks(e.target.value)}
                          placeholder="Search stocks..."
                          className="h-9 w-full rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] py-1 pl-10 pr-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:max-w-[448px]"
                        />
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          id="import-stocks-file"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;

                            if (selectedStockBranch === "all") {
                              toast.error("Please select a branch first before importing stocks.");
                              return;
                            }

                            const name = file.name.toLowerCase();
                            const isAllowed =
                              name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
                            if (!isAllowed) {
                              toast.error("Please select a .csv, .xlsx, or .xls file.");
                              return;
                            }
                            const maxBytes = 10 * 1024 * 1024; // 10MB
                            if (file.size > maxBytes) {
                              toast.error("File is too large. Please upload a file under 10MB.");
                              return;
                            }
                            try {
                              const upload =
                                name.endsWith(".csv")
                                  ? file
                                  : await excelFileToImportCsvFile(file, {
                                      branches,
                                      materials: allMaterials,
                                      suppliers: allSuppliers,
                                    }, selectedStockBranch);
                              setImportStocksFile({ original: file, upload });
                            } catch (err: unknown) {
                              const msg =
                                (err as { message?: string })?.message ||
                                "Could not read the Excel file. Please check the file and try again.";
                              toast.error(msg);
                            }
                          }}
                        />
                        <label
                          htmlFor="import-stocks-file"
                          className="flex cursor-pointer items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-semibold text-[#0A0A0A] hover:bg-[#F8FAFC]"
                        >
                          <Download className="h-4 w-4" />
                          Import from Excel
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (stocks.length === 0) {
                              toast.error("No stock data to export.");
                              return;
                            }
                            exportStocksToExcel(stocks, branches);
                            toast.success("Stocks exported to Excel.");
                          }}
                          className="flex items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-semibold text-[#0A0A0A] hover:bg-[#F8FAFC]"
                        >
                          <Upload className="h-4 w-4" />
                          Export to Excel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedStockBranch === "all") {
                              toast.error("Please select a branch first before trying to add new stock.");
                              return;
                            }
                            setIsAddStockOpen(true);
                          }}
                          className="flex items-center gap-2 rounded-[14px] bg-primary px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[var(--shadow-primary)] transition-opacity hover:bg-primary-hover"
                        >
                          <Plus className="h-4 w-4" />
                          Add Stock
                        </button>
                      </div>
                    </div>

                    {/* Row 3: filters */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Filter className="h-4 w-4 text-[#90A1B9]" />
                      <div className="flex items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5">
                        <div className="relative">
                          <select
                            value={selectedStockCategory}
                            onChange={(e) => setSelectedStockCategory(e.target.value)}
                            className="h-6 cursor-pointer appearance-none bg-[#F8FAFC] pr-6 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A] focus:outline-none"
                          >
                            <option value="all">All Categories</option>
                            {stockCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5">
                        <div className="relative">
                          <select
                            value={selectedStockStatus}
                            onChange={(e) => setSelectedStockStatus(e.target.value)}
                            className="h-6 cursor-pointer appearance-none bg-[#F8FAFC] pr-6 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A] focus:outline-none"
                          >
                            <option value="all">All Status</option>
                            {stockStatuses.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[420px] overflow-auto bg-white sm:max-h-[480px] min-[1000px]:max-h-[540px] xl:max-h-[620px]">
                    <table className="w-full min-w-[800px]  text-left">
                      <thead>
                        <tr className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Material Name
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Category
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Supplier
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Batch No.
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Expiry Date
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Quantity
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {stocksLoading ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center font-['Inter'] text-sm text-[#62748E]">
                              Loading stocks...
                            </td>
                          </tr>
                        ) : stocks.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center font-['Inter'] text-sm text-[#62748E]">
                              <p className="font-medium text-[#45556C]">No stock records found</p>
                              <p className="mt-1 text-[#90A1B9]">
                                Try a different search, branch, category, or status filter.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          stocks.map((row) => {
                            const { showExpired, displayStatus } = getStockRowDisplay(row);
                            return (
                          <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                              {row.materialName}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex h-[22px] items-center justify-center rounded-[8px] border border-[#0000001A] bg-[#F8FAFC] px-2 py-0.5 font-['Inter'] text-xs font-medium leading-4 text-[#0A0A0A]">
                                {row.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-['Inter'] text-sm font-normal leading-5 text-[#0A0A0A]">
                              {row.supplierName}
                            </td>
                            <td className="px-4 py-3 font-['Inter'] text-sm font-mono leading-5 text-[#0A0A0A]">
                              {formatOptionalField(
                                row.batchNo ?? (row as { batch_no?: string }).batch_no
                              )}
                            </td>
                            <td
                              className={`px-4 py-3 font-['Inter'] text-sm  leading-5 ${showExpired ? "text-[#E7000B] font-medium" : "text-[#0A0A0A] font-normal"}`}
                            >
                              {formatOptionalField(
                                row.expiryDate ?? (row as { expiry_date?: string }).expiry_date
                              )}
                              {showExpired && (
                                <span className="ml-1 font-medium">
                                  (Expired)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-['Inter'] text-sm leading-5 text-[#0A0A0A]">
                              <span
                                className={
                                  displayStatus === "low"
                                    ? "font-medium text-[#F54900]"
                                    : "font-normal text-[#0A0A0A]"
                                }
                              >
                                {formatQuantityValue(row.quantityValue)} {row.quantityUnit}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {displayStatus === "available" && (
                                <span className="inline-flex h-[22px] items-center justify-center gap-1 rounded-[8px] border border-[#B9F8CF] bg-[#DCFCE7] px-2 py-0.5 font-['Inter'] text-xs font-medium leading-4 text-[#008236]">
                                  <StockAvailableIcon />
                                  Available
                                </span>
                              )}
                              {displayStatus === "low" && (
                                <span className="inline-flex h-[22px] items-center justify-center gap-1 rounded-[8px] border border-[#FFD6A8] bg-[#FFF7ED] px-2 py-0.5 font-['Inter'] text-xs font-medium leading-4 text-[#CA3500]">
                                  <StockLowIcon />
                                  Low Stock
                                </span>
                              )}
                              {(displayStatus === "out" || displayStatus === "expired") && (
                                <span className="inline-flex h-[22px] items-center justify-center gap-1 rounded-[8px] border  bg-[#D4183D] px-2 py-0.5 font-['Inter'] text-xs font-medium leading-4 text-white">
                                  <StockOutIcon />
                                  {displayStatus === "out" ? "Out of Stock" : "Expired"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
                                  aria-label="Edit"
                                  onClick={() => {
                                    setEditingStock(row);
                                    setIsAddStockOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 text-[#0A0A0A]" />
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-[#90A1B9] hover:bg-[#FEE2E2] hover:text-[#B91C1C]"
                                  aria-label="Delete"
                                  onClick={() => setStockToDelete(row)}
                                >
                                  <Trash2 className="h-4 w-4 text-[#FB2C36]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Product Assignments tab */}
            {activeTab === "assignments" && (
              <div className="p-4 sm:p-6">
                <div className="bg-white border-t border-[#E2E8F0] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] rounded-[14px] p-6">
                  <div className="mb-4 flex flex-col gap-4">
                    {/* Row 1: branch select */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="font-['Inter'] text-sm font-medium text-[#45556C]">
                          Select Branch:
                        </label>
                        <select
                          value={selectedAssignmentBranch === "all" ? "all" : String(selectedAssignmentBranch)}
                          onChange={(e) =>
                            setSelectedAssignmentBranch(
                              e.target.value === "all" ? "all" : Number(e.target.value)
                            )
                          }
                          className="h-9 min-w-[160px] cursor-pointer appearance-none rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] pl-4 pr-8 font-['Inter'] text-sm font-medium leading-5 text-[#1D293D] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2012%2012%22%20fill=%22none%22%3E%3Cpath%20d=%22M3%204.5L6%207.5L9%204.5%22%20stroke=%22%2390A1B9%22%20stroke-width=%221.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[length:12px] bg-[right_0.75rem_center]"
                        >
                          <option value="all">All Branches</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: search + action */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                        <input
                          type="search"
                          value={searchAssignments}
                          onChange={(e) => setSearchAssignments(e.target.value)}
                          placeholder="Search assignments..."
                          className="h-9 w-full rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] py-1 pl-10 pr-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:max-w-[448px]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedAssignmentBranch === "all") {
                            toast.error(
                              "Please select a branch first before adding an assignment."
                            );
                            return;
                          }
                          setIsAddAssignmentOpen(true);
                        }}
                        className="flex shrink-0 items-center gap-2 rounded-[14px] bg-primary px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[var(--shadow-primary)] transition-opacity hover:bg-primary-hover"
                      >
                        <Plus className="h-4 w-4" />
                        Add Assignment
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-auto bg-white sm:max-h-[480px] min-[1000px]:max-h-[540px] xl:max-h-[620px]">
                    <table className="w-full min-w-[700px] text-left">
                      <thead>
                        <tr className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Product Name
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Quantity
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Batch No.
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Expiry Date
                          </th>
                          <th className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Materials Used
                          </th>
                          <th className="px-4 py-3 text-right font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {assignmentsLoading ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center font-['Inter'] text-sm text-[#62748E]">
                              Loading assignments...
                            </td>
                          </tr>
                        ) : assignments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center font-['Inter'] text-sm text-[#62748E]">
                              <p className="font-medium text-[#45556C]">No assignments found</p>
                              <p className="mt-1 text-[#90A1B9]">
                                Try a different search or branch filter.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          assignments.map((row) => (
                          <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="px-4 py-3 font-['Inter'] text-sm font-medium leading-5 text-[#0A0A0A]">
                              {row.productName}
                            </td>
                            <td className="px-4 py-3 font-['Inter'] text-sm font-normal leading-5 text-[#0A0A0A]">
                              {formatQuantityValue(row.quantity)} {row.quantityUnit || ""}
                            </td>
                            <td className="px-4 py-3 font-['Inter'] text-sm font-mono leading-5 text-[#0A0A0A]">
                              {formatOptionalField(
                                row.batchNo ?? (row as { batch_no?: string }).batch_no
                              )}
                            </td>
                            <td className="px-4 py-3 font-['Inter'] text-sm font-normal leading-5 text-[#0A0A0A]">
                              {formatOptionalField(
                                row.expiryDate ?? (row as { expiry_date?: string }).expiry_date
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <ul className="list-none space-y-0.5 font-['Inter'] text-sm font-normal leading-5 text-[#45556C]">
                                {getAssignmentMaterialsUsed(row, allMaterials).map((m, i) => (
                                  <li key={i}>
                                    • {m.materialName ?? "Material"}: {formatQuantityValue(m.qtyValue)} {m.qtyUnit}
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
                                  aria-label="Edit"
                                  onClick={() => {
                                    setEditingAssignment(row);
                                    setIsAddAssignmentOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 text-[#0A0A0A]" />
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-[#90A1B9] hover:bg-[#FEE2E2] hover:text-[#B91C1C]"
                                  aria-label="Delete"
                                  onClick={() => setAssignmentToDelete(row)}
                                >
                                  <Trash2 className="h-4 w-4 text-[#FB2C36]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <ConfirmModal
              isOpen={!!supplierToDelete}
              onClose={() => setSupplierToDelete(null)}
              onConfirm={async () => {
                if (supplierToDelete && supplierToDelete.status !== "inactive") {
                  await updateSupplierMutation.mutateAsync({
                    id: supplierToDelete.id,
                    data: { status: "inactive" },
                  });
                }
                setSupplierToDelete(null);
              }}
              title="Deactivate Supplier"
              message={
                supplierToDelete
                  ? `Are you sure you want to mark "${supplierToDelete.name}" as inactive?`
                  : ""
              }
              confirmLabel="Deactivate"
              cancelLabel="Cancel"
              variant="danger"
            />
            <ConfirmModal
              isOpen={!!materialToDelete}
              onClose={() => setMaterialToDelete(null)}
              onConfirm={async () => {
                if (materialToDelete) {
                  await deleteMaterialMutation.mutateAsync(materialToDelete.id);
                  setMaterialToDelete(null);
                }
              }}
              title="Deactivate Material"
              message={
                materialToDelete
                  ? `Are you sure you want to deactivate "${materialToDelete.name}"? You can re-activate later if needed.`
                  : ""
              }
              confirmLabel="Deactivate"
              cancelLabel="Cancel"
              variant="danger"
            />
            <ConfirmModal
              isOpen={!!stockToDelete}
              onClose={() => setStockToDelete(null)}
              onConfirm={async () => {
                if (stockToDelete) {
                  await deleteStockMutation.mutateAsync(stockToDelete.id);
                  setStockToDelete(null);
                }
              }}
              title="Deactivate Stock"
              message={
                stockToDelete
                  ? `Are you sure you want to deactivate "${stockToDelete.materialName}" (${stockToDelete.batchNo})? You can re-activate later if needed.`
                  : ""
              }
              confirmLabel="Deactivate"
              cancelLabel="Cancel"
              variant="danger"
            />
            <ConfirmModal
              isOpen={!!assignmentToDelete}
              onClose={() => setAssignmentToDelete(null)}
              onConfirm={async () => {
                if (assignmentToDelete) {
                  await deleteAssignmentMutation.mutateAsync(assignmentToDelete.id);
                  toast.success("Assignment deactivated");
                  setAssignmentToDelete(null);
                }
              }}
              title="Deactivate Assignment"
              message={
                assignmentToDelete
                  ? `Are you sure you want to deactivate the assignment for "${assignmentToDelete.productName}"? You can re-activate later if needed.`
                  : ""
              }
              confirmLabel="Deactivate"
              cancelLabel="Cancel"
              variant="danger"
            />
            <ConfirmModal
              isOpen={!!importStocksFile}
              onClose={() => setImportStocksFile(null)}
              onConfirm={async () => {
                if (!importStocksFile) return;
                try {
                  const res = await importStocksMutation.mutateAsync(importStocksFile.upload);
                  const created = typeof res.created === "number" ? res.created : undefined;
                  const updated = typeof res.updated === "number" ? res.updated : undefined;
                  const failedRows = Array.isArray(res.failedRows) ? res.failedRows : [];
                  const failedCount = failedRows.length;
                  const parts = [
                    created !== undefined ? `created ${created}` : null,
                    updated !== undefined ? `updated ${updated}` : null,
                    failedCount ? `failed ${failedCount}` : null,
                  ].filter(Boolean);

                  const createdNum = typeof created === "number" ? created : 0;
                  const updatedNum = typeof updated === "number" ? updated : 0;

                  if (failedCount > 0 && createdNum + updatedNum === 0) {
                    const sampleReasons = failedRows
                      .slice(0, 3)
                      .map((r) => {
                        if (!r || typeof r !== "object") return "";
                        if (!("reason" in r)) return "";
                        const reason = (r as { reason?: unknown }).reason;
                        return reason == null ? "" : String(reason);
                      })
                      .filter(Boolean)
                      .join(" | ");
                    toast.error(
                      `Import finished but no rows were applied (${parts.join(", ")}).` +
                        (sampleReasons ? ` ${sampleReasons}` : "")
                    );
                  } else {
                    toast.success(parts.length ? `Import completed: ${parts.join(", ")}.` : "Import completed.");
                    if (failedCount > 0) {
                      const sampleReasons = failedRows
                        .slice(0, 3)
                        .map((r) => {
                          if (!r || typeof r !== "object") return "";
                          if (!("reason" in r)) return "";
                          const reason = (r as { reason?: unknown }).reason;
                          return reason == null ? "" : String(reason);
                        })
                        .filter(Boolean)
                        .join(" | ");
                      toast.error(
                        `Some rows failed to import (${failedCount}).` +
                          (sampleReasons ? ` ${sampleReasons}` : "")
                      );
                    }
                  }
                } catch (err: unknown) {
                  const msg =
                    (err as { response?: { data?: { message?: string } }; message?: string })?.response
                      ?.data?.message ||
                    (err as { message?: string })?.message ||
                    "Import failed. Please check the file format and try again.";
                  toast.error(msg);
                } finally {
                  setImportStocksFile(null);
                }
              }}
              title="Import Stocks"
              message={
                importStocksFile
                  ? `You're about to import "${importStocksFile.original.name}". This will create or update stock records in the database. Continue?`
                  : ""
              }
              confirmLabel="Import"
              cancelLabel="Cancel"
              variant="danger"
            />
            {isAddSupplierOpen && (
              <AddSupplierModal
                isOpen={isAddSupplierOpen}
                onClose={() => {
                  setIsAddSupplierOpen(false);
                  setEditingSupplier(null);
                }}
                branches={branches}
                initialSupplier={
                  editingSupplier
                    ? {
                        name: editingSupplier.name,
                        branch: editingSupplier.branch?.name ?? "",
                        branchId: editingSupplier.branchId,
                        contactPerson: editingSupplier.contactPerson,
                        email: editingSupplier.email ?? undefined,
                        country: editingSupplier.country ?? undefined,
                        phone: editingSupplier.phone,
                        address: editingSupplier.address ?? undefined,
                        taxId: editingSupplier.taxId ?? undefined,
                        paymentTerms: editingSupplier.paymentTerms ?? undefined,
                        status: editingSupplier.status === "active" ? "active" : "inactive",
                      }
                    : null
                }
                onSave={async (body) => {
                  if (editingSupplier) {
                    await updateSupplierMutation.mutateAsync({ id: editingSupplier.id, data: body });
                  } else {
                    await createSupplierMutation.mutateAsync(body);
                  }
                }}
                isSaving={createSupplierMutation.isPending || updateSupplierMutation.isPending}
              />
            )}
            {isAddMaterialOpen && (
              <AddMaterialModal
                isOpen={isAddMaterialOpen}
                onClose={() => {
                  setIsAddMaterialOpen(false);
                  setEditingMaterial(null);
                }}
                branches={branches}
                categories={categories}
                initialMaterial={editingMaterial ?? undefined}
                onSave={async (body) => {
                  if (editingMaterial) {
                    await updateMaterialMutation.mutateAsync({
                      id: editingMaterial.id,
                      data: body,
                    });
                  } else {
                    await createMaterialMutation.mutateAsync(body);
                  }
                }}
                isSaving={createMaterialMutation.isPending || updateMaterialMutation.isPending}
              />
            )}
            {isAddStockOpen && (() => {
              const selectedBranchForNewStock =
                selectedStockBranch === "all"
                  ? branches[0]
                  : branches.find((b) => b.id === selectedStockBranch);
              const branchIdForNewStock = selectedBranchForNewStock?.id ?? branches[0]?.id ?? 0;
              const branchNameForNewStock = selectedBranchForNewStock?.name ?? "Branch";
              const branchIdForFilter = editingStock ? editingStock.branchId : branchIdForNewStock;
              const materialsForBranch = allMaterials.filter(
                (m) =>
                  m.allBranches ||
                  (m.branchIds?.includes(branchIdForFilter) ?? false) ||
                  (editingStock?.materialId === m.id)
              );
              return (
                <AddStockModal
                  isOpen={isAddStockOpen}
                  onClose={() => {
                    setIsAddStockOpen(false);
                    setEditingStock(null);
                  }}
                  branchIdForNewStock={branchIdForNewStock}
                  branchNameForNewStock={branchNameForNewStock}
                  materials={materialsForBranch}
                  suppliers={allSuppliers}
                  initialStock={editingStock ?? undefined}
                  onSave={async (body) => {
                    if (editingStock) {
                      await updateStockMutation.mutateAsync({ id: editingStock.id, data: body });
                    } else {
                      await createStockMutation.mutateAsync(body);
                    }
                  }}
                  isSaving={createStockMutation.isPending || updateStockMutation.isPending}
                />
              );
            })()}
            {isAddAssignmentOpen && (assignmentBranchId || editingAssignment) && (
              <AddAssignmentModal
                key={editingAssignment ? `edit-${editingAssignment.id}` : "create"}
                isOpen={isAddAssignmentOpen}
                onClose={() => {
                  setIsAddAssignmentOpen(false);
                  setEditingAssignment(null);
                }}
                branchId={editingAssignment?.branchId ?? assignmentBranchId ?? 0}
                branchName={
                  branches.find(
                    (b) => b.id === (editingAssignment?.branchId ?? assignmentBranchId)
                  )?.name ?? "Branch"
                }
                materials={allMaterials}
                products={editingAssignment ? productsForEditBranch : productsForAssignmentBranch}
                stocks={editingAssignment ? stocksForEditBranch : stocksForAssignmentBranch}
                initialAssignment={editingAssignment ?? undefined}
                onSave={async (body) => {
                  if (editingAssignment) {
                    await updateAssignmentMutation.mutateAsync({
                      id: editingAssignment.id,
                      data: body,
                    });
                    toast.success("Assignment updated");
                  } else {
                    await createAssignmentMutation.mutateAsync(body);
                    toast.success("Assignment created");
                  }
                }}
                isSaving={
                  createAssignmentMutation.isPending || updateAssignmentMutation.isPending
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
