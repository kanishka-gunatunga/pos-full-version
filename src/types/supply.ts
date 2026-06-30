/**
 * API types for Supply Management (align with backend).
 * All IDs are numbers.
 */

export type SupplierStatus = "active" | "inactive";
export type StockStatus = "available" | "low" | "out" | "expired";

export interface SupplyListMeta {
  total: number;
  page: number;
  pageSize: number;
}

// --- Supplier ---
export interface SupplierBranch {
  id: number;
  name: string;
  location?: string | null;
}

export interface Supplier {
  id: number;
  name: string;
  branchId: number;
  contactPerson: string;
  email: string | null;
  phone: string;
  status: SupplierStatus;
  country?: string | null;
  address?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  createdAt?: string;
  updatedAt?: string;
  branch?: SupplierBranch;
}

export interface SupplierListResponse {
  data: Supplier[];
  meta: SupplyListMeta;
}

export interface CreateSupplierBody {
  name: string;
  branchId: number;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status?: SupplierStatus;
  country?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
}

export type UpdateSupplierBody = Partial<CreateSupplierBody>;

// --- Material ---
export interface MaterialBranchMinStock {
  branchId: number;
  branchName?: string;
  minStockValue: number;
  minStockUnit: string;
}

export interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  allBranches: boolean;
  branchIds: number[];
  minStockValue: number;
  minStockUnit: string;
   perBranchMinStocks?: MaterialBranchMinStock[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialListResponse {
  data: Material[];
  meta: SupplyListMeta;
}

export interface CreateMaterialBody {
  name: string;
  category?: string;
  unit?: string;
  allBranches: boolean;
  branchIds?: number[];
  minStockValue?: number;
  minStockUnit?: string;
  perBranchMinStocks?: MaterialBranchMinStock[];
}

export type UpdateMaterialBody = Partial<CreateMaterialBody>;

// --- Stock ---
export interface StockItem {
  id: number;
  materialId: number;
  supplierId: number;
  branchId: number;
  materialName: string;
  supplierName: string;
  category: string;
  batchNo: string | null;
  expiryDate: string | null;
  quantityValue: number;
  quantityUnit: string;
  status: StockStatus;
  expired: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockListResponse {
  data: StockItem[];
  meta: SupplyListMeta;
}

export interface CreateStockBody {
  branchId: number;
  materialId: number;
  supplierId: number;
  batchNo?: string;
  expiryDate?: string;
  quantityValue: number;
  quantityUnit?: string;
}

export type UpdateStockBody = Partial<CreateStockBody>;

export interface ImportStocksResponse {
  message: string;
  created?: number;
  updated?: number;
  failedRows?: unknown[];
}

// --- Product Assignment ---
export interface AssignmentMaterialUsed {
  materialId: number;
  stockId?: number;
  materialName?: string;
  qtyValue: number;
  qtyUnit: string;
  stockBatchNo?: string | null;
  stockExpiryDate?: string | null;
}

export interface ProductAssignment {
  id: number;
  branchId: number;
  productId: number | null;
  productName: string;
  batchNo: string | null;
  expiryDate: string | null;
  quantity: number;
  quantityUnit: string;
  materialsUsed: AssignmentMaterialUsed[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentListResponse {
  data: ProductAssignment[];
  meta: SupplyListMeta;
}

export interface CreateAssignmentBody {
  branchId: number;
  productName: string;
  productId?: number | null;
  batchNo?: string;
  expiryDate?: string;
  quantity?: number;
  quantityUnit?: string;
  materialsUsed?: Array<{
    materialId: number;
    stockId?: number;
    materialName?: string;
    qtyValue: number;
    qtyUnit: string;
  }>;
}

export type UpdateAssignmentBody = Partial<CreateAssignmentBody>;

// --- Query params ---
export interface SuppliersQueryParams {
  q?: string;
  branchId?: number | "all";
  status?: "active" | "inactive" | "all";
  page?: number;
  pageSize?: number;
}

export interface MaterialsQueryParams {
  q?: string;
  category?: string | "all";
  branchId?: number | "all";
  page?: number;
  pageSize?: number;
}

export interface StocksQueryParams {
  q?: string;
  branchId?: number | "all";
  category?: string | "all";
  status?: StockStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface AssignmentsQueryParams {
  q?: string;
  branchId?: number | "all";
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}
