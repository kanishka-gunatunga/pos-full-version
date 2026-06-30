import axiosInstance from "@/lib/api/axiosInstance";
import { BogoPromotion, CreateBogoPromotionPayload, UpdateBogoPromotionPayload } from "@/types/bogoPromotion";

const API_URL = "/bogo-promotions";

export const getAllBogoPromotions = async (status: "active" | "inactive" | "all" = "active"): Promise<BogoPromotion[]> => {
  const response = await axiosInstance.get(API_URL, { params: { status } });
  return response.data;
};

export const getBogoPromotionsByBranch = async (excludeExpired: boolean = false): Promise<BogoPromotion[]> => {
  const response = await axiosInstance.get(`${API_URL}/branch-specific`, { params: { excludeExpired } });
  return response.data;
};

export const getBogoPromotionById = async (id: number): Promise<BogoPromotion> => {
  const response = await axiosInstance.get(`${API_URL}/${id}`);
  return response.data;
};

export const createBogoPromotion = async (
  data: CreateBogoPromotionPayload,
  imageFile?: File
): Promise<BogoPromotion> => {
  if (imageFile) {
    const fd = new FormData();
    fd.append("data", JSON.stringify(data));
    fd.append("image", imageFile);
    const response = await axiosInstance.post(API_URL, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }
  const response = await axiosInstance.post(API_URL, data);
  return response.data;
};

export const updateBogoPromotion = async (
  id: number,
  data: UpdateBogoPromotionPayload,
  imageFile?: File
): Promise<BogoPromotion> => {
  if (imageFile) {
    const fd = new FormData();
    fd.append("data", JSON.stringify(data));
    fd.append("image", imageFile);
    const response = await axiosInstance.put(`${API_URL}/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }
  const response = await axiosInstance.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const activateBogoPromotion = async (id: number): Promise<void> => {
  const response = await axiosInstance.patch(`${API_URL}/${id}/activate`);
  return response.data;
};

export const deactivateBogoPromotion = async (id: number): Promise<void> => {
  const response = await axiosInstance.patch(`${API_URL}/${id}/deactivate`);
  return response.data;
};
