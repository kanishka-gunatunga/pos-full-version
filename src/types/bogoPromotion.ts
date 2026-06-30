import { Branch } from "./branch";
import { Product, VariationOption } from "./product";

export type BogoPromotionStatus = "active" | "inactive";

export interface BogoPromotionBranch {
  id: number;
  bogoPromotionId: number;
  branchId: number;
  branch?: Branch;
}

export interface BogoPromotion {
  id: number;
  name: string;
  expiryDate: string | null;
  buyQuantity: number;
  getQuantity: number;
  buyProductId: number;
  getProductId: number;
  buyVariationOptionId?: number;
  getVariationOptionId?: number;
  status: BogoPromotionStatus;
  image?: string | null;
  branches?: BogoPromotionBranch[];
  buyProduct?: Product;
  getProduct?: Product;
  buyVariationOption?: VariationOption;
  getVariationOption?: VariationOption;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBogoPromotionPayload {
  name: string;
  expiryDate?: string;
  buyQuantity: number;
  getQuantity: number;
  buyProductId: number;
  getProductId: number;
  buyVariationOptionId?: number;
  getVariationOptionId?: number;
  branches: (number | { branchId: number })[];
}

export interface UpdateBogoPromotionPayload extends Partial<CreateBogoPromotionPayload> {
  status?: BogoPromotionStatus;
  image?: string;
}
