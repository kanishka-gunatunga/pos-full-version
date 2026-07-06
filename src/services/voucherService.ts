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

export const getIssuedVouchers = async () => {
  const response = await axiosInstance.get("/issued-vouchers");
  return response.data; // { data: IssuedVoucherRow[], summary: VoucherPageSummary }
};

export const updateIssuedVoucher = async (id: string, data: any) => {
  const response = await axiosInstance.put(`/issued-vouchers/${id}`, data);
  return response.data;
};

export const updateIssuedVoucherStatus = async (id: string, status: string) => {
  const response = await axiosInstance.patch(`/issued-vouchers/${id}/status`, { status });
  return response.data;
};

export const validateVoucher = async (code: string) => {
  const response = await axiosInstance.get(`/issued-vouchers/validate?code=${encodeURIComponent(code)}`);
  return response.data; // { id, code, amount, status }
};
