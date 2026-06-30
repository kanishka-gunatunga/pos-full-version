import axiosInstance from "@/lib/api/axiosInstance";
import type {
  Supplier,
  SupplierListResponse,
  CreateSupplierBody,
  UpdateSupplierBody,
  SuppliersQueryParams,
  Material,
  MaterialListResponse,
  CreateMaterialBody,
  UpdateMaterialBody,
  MaterialsQueryParams,
  StockItem,
  StockListResponse,
  CreateStockBody,
  UpdateStockBody,
  StocksQueryParams,
  ImportStocksResponse,
  ProductAssignment,
  AssignmentListResponse,
  CreateAssignmentBody,
  UpdateAssignmentBody,
  AssignmentsQueryParams,
} from "@/types/supply";

const PAGE_SIZE = 100;

function sanitizeParams<T extends Record<string, unknown>>(params: T): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || v === "all") continue;
    out[k] = v as string | number;
  }
  return out;
}

// --- Suppliers ---
export async function getSuppliersList(params?: SuppliersQueryParams): Promise<SupplierListResponse> {
  const query = sanitizeParams({
    q: params?.q,
    branchId: params?.branchId,
    status: params?.status,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? PAGE_SIZE,
  });
  const res = await axiosInstance.get<SupplierListResponse>("/suppliers", { params: query });
  return res.data;
}

export async function getSupplierById(id: number): Promise<Supplier> {
  const res = await axiosInstance.get<Supplier>(`/suppliers/${id}`);
  return res.data;
}

export async function createSupplier(body: CreateSupplierBody): Promise<Supplier> {
  const res = await axiosInstance.post<Supplier>("/suppliers", body);
  return res.data;
}

export async function updateSupplier(id: number, body: UpdateSupplierBody): Promise<Supplier> {
  const res = await axiosInstance.put<Supplier>(`/suppliers/${id}`, body);
  return res.data;
}

export async function deleteSupplier(id: number): Promise<{ message: string }> {
  const res = await axiosInstance.delete<{ message: string }>(`/suppliers/${id}`);
  return res.data;
}

// --- Materials ---
export async function getMaterialsList(params?: MaterialsQueryParams): Promise<MaterialListResponse> {
  const query = sanitizeParams({
    q: params?.q,
    category: params?.category,
    branchId: params?.branchId,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? PAGE_SIZE,
  });
  const res = await axiosInstance.get<MaterialListResponse>("/materials", { params: query });
  return res.data;
}

export async function getMaterialById(id: number): Promise<Material> {
  const res = await axiosInstance.get<Material>(`/materials/${id}`);
  return res.data;
}

export async function createMaterial(body: CreateMaterialBody): Promise<Material> {
  const res = await axiosInstance.post<Material>("/materials", body);
  return res.data;
}

export async function updateMaterial(id: number, body: UpdateMaterialBody): Promise<Material> {
  const res = await axiosInstance.put<Material>(`/materials/${id}`, body);
  return res.data;
}

export async function deleteMaterial(id: number): Promise<{ message: string }> {
  const res = await axiosInstance.delete<{ message: string }>(`/materials/${id}`);
  return res.data;
}

// --- Stocks ---
export async function getStocksList(params?: StocksQueryParams): Promise<StockListResponse> {
  const query = sanitizeParams({
    q: params?.q,
    branchId: params?.branchId,
    category: params?.category,
    status: params?.status,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? PAGE_SIZE,
  });
  const res = await axiosInstance.get<StockListResponse>("/supply/stocks", { params: query });
  return res.data;
}

export async function getStockById(id: number): Promise<StockItem> {
  const res = await axiosInstance.get<StockItem>(`/supply/stocks/${id}`);
  return res.data;
}

export async function createStock(body: CreateStockBody): Promise<StockItem> {
  const res = await axiosInstance.post<StockItem>("/supply/stocks", body);
  return res.data;
}

export async function updateStock(id: number, body: UpdateStockBody): Promise<StockItem> {
  const res = await axiosInstance.put<StockItem>(`/supply/stocks/${id}`, body);
  return res.data;
}

export async function deleteStock(id: number): Promise<{ message: string }> {
  const res = await axiosInstance.delete<{ message: string }>(`/supply/stocks/${id}`);
  return res.data;
}

/** Returns CSV blob for download. Use with responseType: 'blob'. */
export async function exportStocksBlob(params?: { branchId?: number | "all"; category?: string; status?: string }): Promise<Blob> {
  const query = sanitizeParams({
    branchId: params?.branchId,
    category: params?.category,
    status: params?.status,
  });
  const res = await axiosInstance.get("/supply/stocks/export", {
    params: query,
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function importStocks(file: File): Promise<ImportStocksResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosInstance.post<ImportStocksResponse>("/supply/stocks/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// --- Assignments ---
export async function getAssignmentsList(params?: AssignmentsQueryParams): Promise<AssignmentListResponse> {
  const query = sanitizeParams({
    q: params?.q,
    branchId: params?.branchId,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? PAGE_SIZE,
    includeInactive: params?.includeInactive === true ? "true" : undefined,
  });
  const res = await axiosInstance.get<AssignmentListResponse>("/supply/assignments", { params: query });
  return res.data;
}

export async function getAssignmentById(id: number): Promise<ProductAssignment> {
  const res = await axiosInstance.get<ProductAssignment>(`/supply/assignments/${id}`);
  return res.data;
}

export async function createAssignment(body: CreateAssignmentBody): Promise<ProductAssignment> {
  const res = await axiosInstance.post<ProductAssignment>("/supply/assignments", body);
  return res.data;
}

export async function updateAssignment(id: number, body: UpdateAssignmentBody): Promise<ProductAssignment> {
  const res = await axiosInstance.put<ProductAssignment>(`/supply/assignments/${id}`, body);
  return res.data;
}

export async function deleteAssignment(id: number): Promise<{ message: string }> {
  const res = await axiosInstance.delete<{ message: string }>(`/supply/assignments/${id}`);
  return res.data;
}
