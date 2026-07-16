import axiosInstance from "@/lib/api/axiosInstance";
import { 
  Customer, 
  CreateCustomerData, 
  UpdateCustomerData, 
  CustomerSearchParams, 
  CustomerFilterParams,
  BulkPromotionData,
  CategoryDiscount
} from "@/types/customer";

export const getAllCustomers = async (params?: CustomerFilterParams): Promise<Customer[]> => {
  const res = await axiosInstance.get("/customers", { params });
  return res.data;
};

export const searchCustomers = async (params: CustomerSearchParams): Promise<Customer[]> => {
  const res = await axiosInstance.get("/customers/search", { params });
  return res.data;
};

export const getCustomerByMobile = async (mobile: string): Promise<Customer> => {
  const res = await axiosInstance.get(`/customers/mobile/${mobile}`);
  return res.data;
};

export const getCustomerById = async (id: string | number): Promise<Customer> => {
  const res = await axiosInstance.get(`/customers/${id}`);
  return res.data;
};

export const createCustomer = async (data: CreateCustomerData): Promise<Customer> => {
  const res = await axiosInstance.post("/customers", data);
  return res.data;
};

export const findOrCreateCustomer = async (data: CreateCustomerData): Promise<Customer> => {
  const res = await axiosInstance.post("/customers/find-or-create", data);
  return res.data;
};

export const updateCustomer = async (id: string | number, data: UpdateCustomerData): Promise<Customer> => {
  const res = await axiosInstance.put(`/customers/${id}`, data);
  return res.data;
};

export const updatePromotionPreference = async (
  id: string | number, 
  promotions_enabled: boolean
): Promise<{ message: string; customer: Customer }> => {
  const res = await axiosInstance.put(`/customers/${id}/promotions`, { promotions_enabled });
  return res.data;
};

export const sendBulkPromotions = async (data: BulkPromotionData): Promise<{ message: string; mobitel_response: any }> => {
  const res = await axiosInstance.post("/customers/send-promotions", data);
  return res.data;
};

export const activateCustomer = async (id: string | number): Promise<{ message: string }> => {
  const res = await axiosInstance.post(`/customers/${id}/activate`);
  return res.data;
};

export const deactivateCustomer = async (id: string | number): Promise<{ message: string }> => {
  const res = await axiosInstance.post(`/customers/${id}/deactivate`);
  return res.data;
};

export const getLoyaltyPointsByMobile = async (mobile: string): Promise<{
  customerId: number | string;
  name: string;
  mobile: string;
  loyaltyPoints: number;
}> => {
  const res = await axiosInstance.get(`/customers/loyalty/${mobile}`);
  return res.data;
};

export const getCategoryDiscounts = async (): Promise<CategoryDiscount[]> => {
  const res = await axiosInstance.get("/customer-category-discounts");
  return res.data;
};

export const updateCategoryDiscounts = async (discounts: CategoryDiscount[]): Promise<{ message: string }> => {
  const res = await axiosInstance.post("/customer-category-discounts", { discounts });
  return res.data;
};

export const getCustomerLoyalty = async (id: number | string): Promise<any> => {
  const res = await axiosInstance.get(`/customers/loyalty/${id}`);
  return res.data;
};
