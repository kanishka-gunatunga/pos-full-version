import { Package, LayoutGrid, Layers, Tag } from "lucide-react";

export type TabId = "products" | "categories" | "addons" | "discounts";

export const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: LayoutGrid },
  { id: "addons", label: "Add-on Groups", icon: Layers },
  // { id: "discounts", label: "Discounts", icon: Tag },
];

export const MOCK_CATEGORIES = [
  { id: "1", name: "Burgers", subCount: 3, subCategories: ["Beef", "Chicken", "Vegetarian"] },
  { id: "2", name: "Pizza", subCount: 2, subCategories: ["Classic", "Specialty"] },
  { id: "3", name: "Pasta", subCount: 2, subCategories: ["Vegetarian", "Meat"] },
];

export const MOCK_ADDON_GROUPS = [
  {
    id: "1",
    name: "Large Pizza Add-ons",
    items: [
      { name: "Extra Cheese", price: "Rs.200.00" },
      { name: "Onion", price: "Rs.50.00" },
      { name: "Tomato", price: "Rs.100.00" },
    ],
  },
  {
    id: "2",
    name: "Single Burger Add-ons",
    items: [
      { name: "Bacon", price: "Rs.500.00" },
      { name: "Avocado", price: "Rs.300.00" },
      { name: "BBQ Chicken", price: "Rs.1000.00" },
      { name: "Onion", price: "Rs.1000.00" },
    ],
  },
];

export const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Pepperoni Pizza",
    category: "PIZZA + CLASSIC",
    price: "Rs.2000.00",
    variant: "Small",
    addons: "Cheesy Crust",
    stock: "100 left",
    batch: "# BTH-434546",
    expiry: "2/25/2026",
    addonGroup: "PIZZA ADD-ONS",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    name: "Chicken Pizza",
    category: "PIZZA + CLASSIC",
    price: "Rs.2000.00",
    variant: "Medium",
    addons: "Cheesy Crust, Bacon",
    stock: "100 left",
    batch: "",
    expiry: "",
    addonGroup: "CHICKEN PIZZA ADD-ONS",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=100&h=100&fit=crop",
  },
];

export type AddonGroupItem = { name: string; price: string };
export type ProductVariant = { name: string; price: string };

export type DiscountItem = {
  productName: string;
  variant?: string;
  discountPercent: number;
};

export type DiscountOffer = {
  id: string;
  name: string;
  isActive: boolean;
  productCount: number;
  variantCount: number;
  items: DiscountItem[];
};

export type ProductVariantForDiscount = { id: string; name: string; price: string };
export type ProductForDiscount = {
  id: string;
  name: string;
  price: string;
  image: string;
  variants?: ProductVariantForDiscount[];
};

export const MOCK_PRODUCTS_FOR_DISCOUNT: ProductForDiscount[] = [
  {
    id: "p1",
    name: "Classic Cheeseburger",
    price: "Rs.2000.00",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop",
  },
  {
    id: "p2",
    name: "Margherita Pizza",
    price: "Rs.2000.00",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=100&h=100&fit=crop",
    variants: [
      { id: "v1", name: 'Small (10")', price: "Rs.2000.00" },
      { id: "v2", name: 'Medium (12")', price: "Rs.2000.00" },
      { id: "v3", name: 'Large (14")', price: "Rs.2000.00" },
    ],
  },
  {
    id: "p3",
    name: "Pepperoni Pizza",
    price: "Rs.2000.00",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=100&h=100&fit=crop",
    variants: [
      { id: "v4", name: 'Small (10")', price: "Rs.2000.00" },
      { id: "v5", name: 'Medium (12")', price: "Rs.2000.00" },
      { id: "v6", name: 'Large (14")', price: "Rs.2000.00" },
    ],
  },
];

export const MOCK_DISCOUNTS: DiscountOffer[] = [
  {
    id: "1",
    name: "Seasonal Offer",
    isActive: true,
    productCount: 2,
    variantCount: 4,
    items: [
      { productName: "Margherita Pizza", variant: 'Medium (12")', discountPercent: 10 },
      { productName: "Margherita Pizza", variant: 'Large (14")', discountPercent: 10 },
      { productName: "Margherita Pizza", variant: 'Small (10")', discountPercent: 10 },
      { productName: "Classic Cheeseburger", discountPercent: 10 },
    ],
  },
];

export type NewProductForm = {
  productName: string;
  productImageUrl: string;
  basePrice: string;
  quantity: string;
  category: string;
  subCategory: string;
  batchNumber: string;
  expiryDate: string;
  variants: ProductVariant[];
  addonGroupIds: string[];
};
