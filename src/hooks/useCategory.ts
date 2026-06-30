import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as categoryService from "@/services/categoryService";
import { CreateCategoryPayload, UpdateCategoryPayload } from "@/types/product";

export const CATEGORY_KEYS = {
  all: ["categories"] as const,
  lists: () => [...CATEGORY_KEYS.all, "list"] as const,
  list: (status?: string) => [...CATEGORY_KEYS.lists(), { status }] as const,
  parents: (status?: string) => [...CATEGORY_KEYS.lists(), "parents", { status }] as const,
  subcategories: (parentId: number, status?: string) => [...CATEGORY_KEYS.lists(), "sub", parentId, { status }] as const,
  details: () => [...CATEGORY_KEYS.all, "detail"] as const,
  detail: (id: number) => [...CATEGORY_KEYS.details(), id] as const,
};

export const useGetAllCategories = (status?: string) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.list(status),
    queryFn: () => categoryService.getAllCategories(status),
  });
};

export const useGetParentCategories = (status?: string) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.parents(status),
    queryFn: () => categoryService.getParentCategories(status),
  });
};

export const useGetSubCategories = (parentId: number, status?: string) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.subcategories(parentId, status),
    queryFn: () => categoryService.getSubCategories(parentId, status),
    enabled: !!parentId,
  });
};

export const useGetCategoryById = (id: number) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.detail(id),
    queryFn: () => categoryService.getCategoryById(id),
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => categoryService.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCategoryPayload }) =>
      categoryService.updateCategory(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.detail(variables.id) });
    },
  });
};

export const useActivateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoryService.activateCategory(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.detail(id) });
    },
  });
};

export const useDeactivateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoryService.deactivateCategory(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.detail(id) });
    },
  });
};

export const useExportCategories = () => {
  return useMutation({
    mutationFn: () => categoryService.exportCategoriesTemplate(),
    onSuccess: async (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `categories-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
};

export const useImportCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => categoryService.importCategories(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
};
