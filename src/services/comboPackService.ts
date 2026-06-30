import axiosInstance from "@/lib/api/axiosInstance";
import {
  ComboPack,
  CreateComboPackPayload,
  UpdateComboPackPayload,
} from "@/types/comboPack";

export const getAllComboPacks = async (
  status: "active" | "inactive" | "all" = "active"
): Promise<ComboPack[]> => {
  const res = await axiosInstance.get("/product-bundles", {
    params: { status },
  });
  return res.data;
};

export const getComboPacksByBranch = async (
  excludeExpired: boolean = false
): Promise<ComboPack[]> => {
  const res = await axiosInstance.get("/product-bundles/branch-specific", {
    params: { excludeExpired },
  });
  return res.data;
};

export const getComboPackById = async (id: number): Promise<ComboPack> => {
  const res = await axiosInstance.get(`/product-bundles/${id}`);
  return res.data;
};

export const createComboPack = async (
  data: CreateComboPackPayload,
  imageFile?: File
): Promise<ComboPack> => {
  if (imageFile) {
    const fd = new FormData();
    fd.append("data", JSON.stringify(data));
    fd.append("image", imageFile);
    const response = await axiosInstance.post("/product-bundles", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }
  const res = await axiosInstance.post("/product-bundles", data);
  return res.data;
};

export const updateComboPack = async (
  id: number,
  data: UpdateComboPackPayload,
  imageFile?: File
): Promise<ComboPack> => {
  if (imageFile) {
    const fd = new FormData();
    fd.append("data", JSON.stringify(data));
    fd.append("image", imageFile);
    const response = await axiosInstance.put(`/product-bundles/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }
  const res = await axiosInstance.put(`/product-bundles/${id}`, data);
  return res.data;
};

export const activateComboPack = async (id: number): Promise<any> => {
  const res = await axiosInstance.patch(`/product-bundles/${id}/activate`);
  return res.data;
};

export const deactivateComboPack = async (id: number): Promise<any> => {
  const res = await axiosInstance.patch(`/product-bundles/${id}/deactivate`);
  return res.data;
};
