import axiosInstance from "@/lib/api/axiosInstance";
import { Modification, CreateModificationPayload, UpdateModificationPayload } from "@/types/product";

export const getAllModifications = async (status?: string): Promise<Modification[]> => {
  const res = await axiosInstance.get("/modifications", { params: { status } });
  return res.data;
};

export const getModificationById = async (id: number): Promise<Modification> => {
  const res = await axiosInstance.get(`/modifications/${id}`);
  return res.data;
};

export const createModification = async (payload: CreateModificationPayload): Promise<Modification> => {
  const res = await axiosInstance.post("/modifications", payload);
  return res.data;
};

export const updateModification = async (id: number, payload: UpdateModificationPayload): Promise<Modification> => {
  const res = await axiosInstance.put(`/modifications/${id}`, payload);
  return res.data;
};

export const activateModification = async (id: number): Promise<any> => {
  const res = await axiosInstance.post(`/modifications/${id}/activate`);
  return res.data;
};

export const deactivateModification = async (id: number): Promise<any> => {
  const res = await axiosInstance.post(`/modifications/${id}/deactivate`);
  return res.data;
};
