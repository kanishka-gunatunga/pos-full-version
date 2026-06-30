import axiosInstance from "@/lib/api/axiosInstance";
import { Product, CreateProductPayload, UpdateProductPayload } from "@/types/product";

export const getAllProducts = async (
  params: {
    categoryId?: number;
    subCategoryId?: number;
    status?: string;
  } = {}
): Promise<Product[]> => {
  const res = await axiosInstance.get("/products", { params });
  return res.data;
};

export const searchProducts = async (query: string, status?: string): Promise<Product[]> => {
  const res = await axiosInstance.get("/products/search", {
    params: { query, status },
  });
  return res.data;
};

export const getProductById = async (id: number): Promise<Product> => {
  const res = await axiosInstance.get(`/products/${id}`);
  return res.data;
};

export const createProduct = async (
  data: CreateProductPayload,
  imageFile?: File
): Promise<Product> => {
  const formData = new FormData();

  formData.append("name", data.name);
  formData.append("code", data.code);
  if (data.shortDescription) formData.append("shortDescription", data.shortDescription);
  if (data.description) formData.append("description", data.description);
  if (data.sku) formData.append("sku", data.sku);
  if (data.categoryId !== undefined) formData.append("categoryId", data.categoryId.toString());
  if (data.subCategoryId !== undefined)
    formData.append("subCategoryId", data.subCategoryId.toString());

  if (data.branches) formData.append("branches", JSON.stringify(data.branches));
  if (data.variations) formData.append("variations", JSON.stringify(data.variations));
  if (data.modifications) formData.append("modifications", JSON.stringify(data.modifications));
  if (imageFile) {
    formData.append("image", imageFile);
  }

  try {
    const res = await axiosInstance.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error: unknown) {
    if (process.env.NODE_ENV === "development" && error && typeof error === "object" && "response" in error) {
      const err = error as { response?: { data?: unknown } };
      if (err.response?.data) console.error("Backend Error Details:", err.response.data);
    }
    throw error;
  }
};

export const updateProduct = async (
  id: number,
  data: UpdateProductPayload,
  imageFile?: File
): Promise<any> => {
  const formData = new FormData();

  if (data.name) formData.append("name", data.name);
  if (data.code) formData.append("code", data.code);
  if (data.shortDescription) formData.append("shortDescription", data.shortDescription);
  if (data.description) formData.append("description", data.description);
  if (data.sku) formData.append("sku", data.sku);
  if (data.categoryId !== undefined) formData.append("categoryId", data.categoryId.toString());
  if (data.subCategoryId !== undefined)
    formData.append("subCategoryId", data.subCategoryId.toString());
  if (data.image) formData.append("image", data.image);

  if (data.branches) formData.append("branches", JSON.stringify(data.branches));
  if (data.variations) formData.append("variations", JSON.stringify(data.variations));
  if (data.modifications) formData.append("modifications", JSON.stringify(data.modifications));

  if (imageFile) {
    formData.append("image", imageFile);
  }

  const res = await axiosInstance.put(`/products/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const activateProduct = async (id: number): Promise<any> => {
  const res = await axiosInstance.post(`/products/${id}/activate`);
  return res.data;
};

export const deactivateProduct = async (id: number): Promise<any> => {
  const res = await axiosInstance.post(`/products/${id}/deactivate`);
  return res.data;
};

export const getProductsByCategory = async (
  categoryId: number,
  status?: string
): Promise<Product[]> => {
  const res = await axiosInstance.get(`/products/category/${categoryId}`, {
    params: { status },
  });
  return res.data;
};

export const getProductsByBranch = async (
  branchId: number,
  params: {
    categoryId?: number;
    subCategoryId?: number;
    status?: string;
  } = {}
): Promise<Product[]> => {
  const res = await axiosInstance.get(`/products/branch/${branchId}`, { params });
  return res.data;
};

export const getProductBarcode = async (id: number): Promise<any> => {
  const res = await axiosInstance.get(`/products/barcode/${id}`);
  return res.data;
};

export const printProductBarcode = async (id: number): Promise<any> => {
  const res = await axiosInstance.get(`/products/${id}/barcode/print`);
  return res.data;
};

export const exportProductsTemplate = async (): Promise<Blob> => {
  const res = await axiosInstance.get("/products/export-template", {
    responseType: "blob",
  });
  return res.data;
};

export const importProducts = async (file: File): Promise<any> => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await axiosInstance.post("/products/import", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
