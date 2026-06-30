import {
  SuppliersTabIcon,
  MaterialsTabIcon,
  StockManagementTabIcon,
  ProductAssignmentsTabIcon,
} from "@/components/supply/SupplyTabIcons";

export type SupplyTabId = "suppliers" | "materials" | "stock" | "assignments";

export const SUPPLY_TABS: { id: SupplyTabId; label: string; icon: React.ElementType }[] = [
  { id: "suppliers", label: "Suppliers", icon: SuppliersTabIcon },
  { id: "materials", label: "Materials", icon: MaterialsTabIcon },
  { id: "stock", label: "Stock Management", icon: StockManagementTabIcon },
  { id: "assignments", label: "Product Assignments", icon: ProductAssignmentsTabIcon },
];

export type SupplierStatus = "active" | "inactive";

export interface MockSupplier {
  id: string;
  name: string;
  branch: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: SupplierStatus;
}

export interface MockMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  branches: string;
  allBranches: boolean;
  minStockLevel: string;
}

export type StockStatus = "available" | "low" | "out" | "expired";

export interface MockStock {
  id: string;
  materialName: string;
  category: string;
  supplier: string;
  batchNo: string;
  expiryDate: string;
  expired: boolean;
  quantity: string;
  status: StockStatus;
}

export interface MockAssignment {
  id: string;
  productName: string;
  quantity: string;
  batchNo: string;
  expiryDate: string;
  materialsUsed: { name: string; qty: string }[];
}
