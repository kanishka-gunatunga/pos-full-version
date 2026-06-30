export type ProductVariant = {
  id: number;
  variationId?: number;
  name: string;
  price: number;
  barcode?: string;
};

export type ProductAddOn = {
  id: string;
  name: string;
  price: number;
};

export type MenuItem = {
  id: string;
  productId: number;
  name: string;
  category: string;
  subCategory: string;
  price: number;
  image?: string;
  description?: string;
  barcode?: string;
  isOffer?: boolean;
  variants?: ProductVariant[];
  addOns?: ProductAddOn[];
  bundleItems?: {
    productId: number;
    name: string;
    qty: number;
    unitPrice: number;
    details?: string;
    image?: string;
  }[];
  promotionInfo?: {
    type: "combo" | "bogo";
    promotionId: number;
    items?: {
      productId: number;
      name: string;
      price: number;
      image?: string;
      variationOptionId?: number;
      quantity: number;
      addOns?: ProductAddOn[];
    }[];
    buyItem?: {
      productId: number;
      name: string;
      price: number;
      image?: string;
      variationOptionId?: number;
      quantity: number;
      addOns?: ProductAddOn[];
    };
    getFreeItem?: {
      productId: number;
      name: string;
      price: number;
      image?: string;
      variationOptionId?: number;
      quantity: number;
      addOns?: ProductAddOn[];
    };

  };
};


