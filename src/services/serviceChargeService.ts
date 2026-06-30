import axiosInstance from "@/lib/api/axiosInstance";
import type { ServiceCharge, UpsertServiceChargeBody } from "@/types/serviceCharge";

export async function getServiceCharge(branchId?: number | null) {
  const res = await axiosInstance.get<ServiceCharge>("/service-charge", {
    params: branchId ? { branchId } : undefined,
  });
  return res.data;
}

export async function upsertServiceCharge(body: UpsertServiceChargeBody) {
  const res = await axiosInstance.put<ServiceCharge>("/service-charge", body);
  return res.data;
}
