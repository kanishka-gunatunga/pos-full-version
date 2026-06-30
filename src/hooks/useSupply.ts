import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as supplyService from "@/services/supplyService";
import type {
  SuppliersQueryParams,
  CreateSupplierBody,
  UpdateSupplierBody,
  MaterialsQueryParams,
  CreateMaterialBody,
  UpdateMaterialBody,
  StocksQueryParams,
  CreateStockBody,
  UpdateStockBody,
  AssignmentsQueryParams,
  CreateAssignmentBody,
  UpdateAssignmentBody,
} from "@/types/supply";

// --- Query keys ---
export const SUPPLY_KEYS = {
  suppliers: {
    all: ["supply", "suppliers"] as const,
    lists: () => [...SUPPLY_KEYS.suppliers.all, "list"] as const,
    list: (params: SuppliersQueryParams) => [...SUPPLY_KEYS.suppliers.lists(), params] as const,
    detail: (id: number) => [...SUPPLY_KEYS.suppliers.all, "detail", id] as const,
  },
  materials: {
    all: ["supply", "materials"] as const,
    lists: () => [...SUPPLY_KEYS.materials.all, "list"] as const,
    list: (params: MaterialsQueryParams) => [...SUPPLY_KEYS.materials.lists(), params] as const,
    detail: (id: number) => [...SUPPLY_KEYS.materials.all, "detail", id] as const,
  },
  stocks: {
    all: ["supply", "stocks"] as const,
    lists: () => [...SUPPLY_KEYS.stocks.all, "list"] as const,
    list: (params: StocksQueryParams) => [...SUPPLY_KEYS.stocks.lists(), params] as const,
    detail: (id: number) => [...SUPPLY_KEYS.stocks.all, "detail", id] as const,
  },
  assignments: {
    all: ["supply", "assignments"] as const,
    lists: () => [...SUPPLY_KEYS.assignments.all, "list"] as const,
    list: (params: AssignmentsQueryParams) => [...SUPPLY_KEYS.assignments.lists(), params] as const,
    detail: (id: number) => [...SUPPLY_KEYS.assignments.all, "detail", id] as const,
  },
} as const;

// --- Suppliers ---
export function useSuppliersList(params: SuppliersQueryParams) {
  return useQuery({
    queryKey: SUPPLY_KEYS.suppliers.list(params),
    queryFn: () => supplyService.getSuppliersList(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSupplierBody) => supplyService.createSupplier(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.suppliers.all });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSupplierBody }) =>
      supplyService.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.suppliers.all });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => supplyService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.suppliers.all });
    },
  });
}

// --- Materials ---
export function useMaterialsList(params: MaterialsQueryParams) {
  return useQuery({
    queryKey: SUPPLY_KEYS.materials.list(params),
    queryFn: () => supplyService.getMaterialsList(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMaterialBody) => supplyService.createMaterial(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.materials.all });
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMaterialBody }) =>
      supplyService.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.materials.all });
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => supplyService.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.materials.all });
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}

// --- Stocks ---
export function useStocksList(params: StocksQueryParams) {
  return useQuery({
    queryKey: SUPPLY_KEYS.stocks.list(params),
    queryFn: () => supplyService.getStocksList(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateStockBody) => supplyService.createStock(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStockBody }) =>
      supplyService.updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}

export function useDeleteStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => supplyService.deleteStock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}

export function useExportStocks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { branchId?: number | "all"; category?: string; status?: string }) =>
      supplyService.exportStocksBlob(params),
    onSuccess: async (blob, params) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stocks-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}

export function useImportStocks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => supplyService.importStocks(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}

// --- Assignments ---
export function useAssignmentsList(params: AssignmentsQueryParams) {
  return useQuery({
    queryKey: SUPPLY_KEYS.assignments.list(params),
    queryFn: () => supplyService.getAssignmentsList(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAssignmentBody) => supplyService.createAssignment(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.assignments.all });
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssignmentBody }) =>
      supplyService.updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.assignments.all });
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => supplyService.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.assignments.all });
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stocks.all });
    },
  });
}
