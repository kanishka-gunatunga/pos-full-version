import { Branch } from "./branch";
import { Product, VariationOption } from "./product";

export type ComboPackStatus = "active" | "inactive";

export interface ComboPackBranch {
  id: number;
  productBundleId: number;
  branchId: number;
  branch?: Branch;
  original_price?: string | number;
  price?: string | number;
  customer_saves?: string | number;
}

export interface ComboPackItem {
  id: number;
  productBundleId: number;
  productId: number;
  variationOptionId?: number;
  modificationItemId?: number | null;
  quantity: number;
  variationOption?: VariationOption;
  product?: Product;
  modificationItem?: any;
}

export interface ComboPack {
  id: number;
  name: string;
  description: string | null;
  expire_date: string | null;
  price: string | number;
  status: ComboPackStatus;
  image?: string | null;
  branches?: ComboPackBranch[];
  items?: ComboPackItem[];
  original_price?: string | number;
  customer_saves?: string | number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateComboPackPayload {
  name: string;
  description?: string;
  expire_date?: string;
  price?: number;
  branches: (number | { 
    branchId: number; 
    original_price?: number; 
    price?: number; 
    customer_saves?: number;
  })[];
  items: {
    productId: number;
    variationOptionId?: number;
    modificationItemId?: number | null;
    quantity: number;
  }[];
  original_price?: number;
  customer_saves?: number;
  image?: string;
}

export interface UpdateComboPackPayload extends Partial<CreateComboPackPayload> {}
