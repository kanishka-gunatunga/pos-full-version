export type ProductStatus = "active" | "inactive";

export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  status: ProductStatus;
  subcategories?: Category[];
  parent?: Category;
}

export interface VariationPrice {
  id: number;
  variationOptionId: number;
  branchId: number;
  price: string | number;
  discountPrice?: string | number | null;
  quantity: number;
  isUnlimited?: boolean | null | number;
  is_unlimited?: boolean | null | number;
  expireDate?: string | null;
  batchNo?: string | null;
}

export function readIsUnlimitedFromPrice(
  price:
    | {
        isUnlimited?: unknown;
        is_unlimited?: unknown;
      }
    | null
    | undefined
): boolean {
  if (!price) return false;

  const a = price.isUnlimited;
  const b = price.is_unlimited;
  const raw =
    a !== null && a !== undefined ? a : b !== null && b !== undefined ? b : null;

  if (raw === null || raw === undefined) return false;
  if (raw === true || raw === 1) return true;
  if (raw === false || raw === 0) return false;

  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "" || s === "null" || s === "false" || s === "0") return false;
    if (s === "true" || s === "1") return true;
  }

  return false;
}

export interface VariationOption {
  id: number;
  variationId: number;
  name: string;
  status: ProductStatus;
  barcode?: string;
  prices?: VariationPrice[];
  discountItems?: DiscountItem[];
}

export interface ModificationItem {
  id: number;
  title: string;
  price: string | number;
  modificationId: number;
}

export interface Modification {
  id: number;
  title: string;
  status: ProductStatus;
  items?: ModificationItem[];
}

export interface ProductModification {
  id: number;
  productId: number;
  variationId?: number | null;
  modificationId: number;
  Modification?: Modification;
}

export interface Variation {
  id: number;
  productId: number;
  name: string;
  status: ProductStatus;
  options?: VariationOption[];
  variationModifications?: ProductModification[];
}

export interface ProductBranch {
  id: number;
  productId: number;
  branchId: number;
}

export interface Discount {
  id: number;
  name: string;
  expiryDate?: string | null;
  isForAllBranches: boolean;
  status: ProductStatus;
  branches?: { branchId: number }[];
  items?: DiscountItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscountItem {
  id: number;
  discountId: number;
  productId?: number | null;
  variationOptionId?: number | null;
  branchId?: number | null;
  discountType: "percentage" | "fixed";
  discountValue: string | number;
  product?: Partial<Product>;
  variationOption?: Partial<VariationOption>;
  Discount?: Discount;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  image?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  sku?: string | null;
  categoryId?: number | null;
  subCategoryId?: number | null;
  status: ProductStatus;
  barcode?: string;
  category?: Category;
  subCategory?: Category;
  branches?: ProductBranch[];
  variations?: Variation[];
  productModifications?: ProductModification[];
  discountItems?: DiscountItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  name: string;
  code: string;
  shortDescription?: string;
  description?: string;
  sku?: string;
  categoryId?: number;
  subCategoryId?: number;
  barcode?: string;
  branches?: number[]; // Array of branch IDs
  variations?: {
    name: string;
    options: {
      name: string;
      barcode?: string;
      prices: {
        branchId: number;
        price: number;
        discountPrice?: number;
        quantity?: number;
        isUnlimited?: boolean;
        expireDate?: string;
        batchNo?: string;
      }[];
    }[];
    modifications?: { modificationId: number }[];
  }[];
  modifications?: { modificationId: number }[];
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  image?: string | null;
}

export interface CreateCategoryPayload {
  name: string;
  subcategories?: string[];
}

export interface UpdateCategoryPayload {
  name: string;
  subcategories?: { id?: number; name: string }[];
}

export interface CreateModificationPayload {
  title: string;
  items?: { title: string; price: number }[];
}

export interface UpdateModificationPayload {
  title?: string;
  items?: { id?: number; title: string; price: number }[];
}

export interface CreateDiscountPayload {
  name: string;
  expiryDate?: string;
  isForAllBranches: boolean;
  branches?: number[];
  items: {
    productId?: number;
    variationOptionId?: number;
    discountType: "percentage" | "fixed";
    discountValue?: number;
    branchDiscounts?: {
      branchId: number;
      discountValue: number;
    }[];
  }[];
}

export type UpdateDiscountPayload = Partial<CreateDiscountPayload>;
