import axiosInstance from "@/lib/api/axiosInstance";
import type {
  CreateDeliveryChargeBody,
  DeliveryCharge,
  DeliveryChargeStatusQuery,
  UpdateDeliveryChargeBody,
} from "@/types/deliveryCharge";

export async function getDeliveryCharges(status?: DeliveryChargeStatusQuery) {
  const res = await axiosInstance.get<DeliveryCharge[]>("/delivery-charges", {
    params: status ? { status } : undefined,
  });
  return res.data;
}

export async function getDeliveryChargesByBranch(branchId: number) {
  const res = await axiosInstance.get<DeliveryCharge[]>(`/delivery-charges/branch/${branchId}`);
  return res.data;
}

export async function createDeliveryCharge(body: CreateDeliveryChargeBody) {
  const res = await axiosInstance.post<DeliveryCharge>("/delivery-charges", body);
  return res.data;
}

export async function updateDeliveryCharge(id: number, body: UpdateDeliveryChargeBody) {
  const res = await axiosInstance.put<DeliveryCharge>(`/delivery-charges/${id}`, body);
  return res.data;
}

export async function deactivateDeliveryCharge(id: number) {
  const res = await axiosInstance.post<{ message: string }>(`/delivery-charges/${id}/deactivate`);
  return res.data;
}
