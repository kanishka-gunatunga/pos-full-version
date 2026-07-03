import axiosInstance from "@/lib/api/axiosInstance";
import type { CreatedVoucherTemplate } from "@/domains/vouchers/types";

export const getVoucherTemplates = async (): Promise<CreatedVoucherTemplate[]> => {
  const response = await axiosInstance.get("/voucher-templates");
  return response.data;
};

export const createVoucherTemplate = async (
  data: Partial<CreatedVoucherTemplate>
): Promise<CreatedVoucherTemplate> => {
  const response = await axiosInstance.post("/voucher-templates", data);
  return response.data;
};

export const updateVoucherTemplate = async (
  id: string,
  data: Partial<CreatedVoucherTemplate>
): Promise<CreatedVoucherTemplate> => {
  const response = await axiosInstance.put(`/voucher-templates/${id}`, data);
  return response.data;
};

export const updateVoucherTemplateStatus = async (
  id: string,
  status: "active" | "inactive" | "redeemed"
): Promise<CreatedVoucherTemplate> => {
  const response = await axiosInstance.patch(`/voucher-templates/${id}/status`, { status });
  return response.data;
};
