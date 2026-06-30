import axiosInstance from "@/lib/api/axiosInstance";
import { Discount, CreateDiscountPayload, UpdateDiscountPayload } from "@/types/product";

export const getAllDiscounts = async (params: { status?: string; search?: string } = {}): Promise<Discount[]> => {
  const res = await axiosInstance.get("/discounts", { params });
  return res.data;
};

export const getDiscountById = async (id: number): Promise<Discount> => {
  const res = await axiosInstance.get(`/discounts/${id}`);
  return res.data;
};

export const createDiscount = async (payload: CreateDiscountPayload): Promise<Discount> => {
  const res = await axiosInstance.post("/discounts", payload);
  return res.data;
};

export const updateDiscount = async (id: number, payload: UpdateDiscountPayload): Promise<Discount> => {
  const res = await axiosInstance.put(`/discounts/${id}`, payload);
  return res.data;
};

export const deleteDiscount = async (id: number): Promise<any> => {
  const res = await axiosInstance.delete(`/discounts/${id}`);
  return res.data;
};

export const activateDiscount = async (id: number): Promise<any> => {
  const res = await axiosInstance.post(`/discounts/${id}/activate`);
  return res.data;
};

export const deactivateDiscount = async (id: number): Promise<any> => {
  const res = await axiosInstance.post(`/discounts/${id}/deactivate`);
  return res.data;
};
