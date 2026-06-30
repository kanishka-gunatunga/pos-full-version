export type ExtraFeeTabId = "delivery" | "service";

export type BranchOption = {
  id: number;
  name: string;
  location: string;
};

export type DeliveryFeeItem = {
  id: number;
  branchId: number;
  branchName: string;
  branchLocation: string;
  zoneName: string;
  price: number;
  addedOn: string;
};

export type ServiceChargeItem = {
  id: number;
  branchId: number;
  title: string;
  location: string;
  rate: number;
  addedOn: string;
};

export const EXTRA_FEE_TABS: { id: ExtraFeeTabId; label: string }[] = [
  { id: "delivery", label: "Delivery Fees" },
  { id: "service", label: "Service Charge" },
];
