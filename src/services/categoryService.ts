import axiosInstance from "@/lib/api/axiosInstance";
import { Category, CreateCategoryPayload, UpdateCategoryPayload } from "@/types/product";

export const getAllCategories = async (status?: string): Promise<Category[]> => {
  const res = await axiosInstance.get("/categories", { params: { status } });
  return res.data;
};

export const getParentCategories = async (status?: string): Promise<Category[]> => {
  const res = await axiosInstance.get("/categories/parents", { params: { status } });
  return res.data;
};

export const getSubCategories = async (parentId: number, status?: string): Promise<Category[]> => {
  const res = await axiosInstance.get(`/categories/${parentId}/subcategories`, { params: { status } });
  return res.data;
};

export const getCategoryById = async (id: number): Promise<Category> => {
  const res = await axiosInstance.get(`/categories/${id}`);
  return res.data;
};

export const createCategory = async (payload: CreateCategoryPayload): Promise<Category> => {
  const res = await axiosInstance.post("/categories", payload);
  return res.data;
};

export const updateCategory = async (id: number, payload: UpdateCategoryPayload): Promise<any> => {
  const res = await axiosInstance.put(`/categories/${id}`, payload);
  return res.data;
};

export const activateCategory = async (id: number): Promise<any> => {
  const res = await axiosInstance.post(`/categories/${id}/activate`);
  return res.data;
};

export const deactivateCategory = async (id: number): Promise<any> => {
  const res = await axiosInstance.post(`/categories/${id}/deactivate`);
  return res.data;
};

export const exportCategoriesTemplate = async (): Promise<Blob> => {
  const res = await axiosInstance.get("/categories/export-template", {
    responseType: "blob",
  });
  return res.data;
};

export const importCategories = async (file: File): Promise<any> => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await axiosInstance.post("/categories/import", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
