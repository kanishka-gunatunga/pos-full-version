export type CustomerStatus = "active" | "inactive";
export type CustomerCategory = "normal" | "staff" | "management";

export interface Customer {
  id: string | number;
  mobile: string;
  name: string;
  address?: string;
  email?: string;
  status: CustomerStatus;
  category: CustomerCategory;
  promotions_enabled: boolean;
  orders_count?: number;
  latest_order_date?: string;
  loyalty_points?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerData {
  mobile: string;
  name: string;
  address?: string;
  email?: string;
  category?: CustomerCategory;
  promotions_enabled?: boolean;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export interface BulkPromotionData {
  message: string;
}

export interface CategoryDiscount {
  id?: number;
  category: CustomerCategory;
  discount_percentage: number;
}

export interface CustomerSearchParams {
  query: string;
  status?: "active" | "inactive" | "all";
}

export interface CustomerFilterParams {
  status?: "active" | "inactive" | "all";
}
