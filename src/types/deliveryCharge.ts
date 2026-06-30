export type DeliveryChargeStatusQuery = "active" | "inactive" | "all";

export interface DeliveryChargeBranch {
  id?: number;
  deliveryChargeId?: number;
  branchId: number;
  branch?: {
    id?: number;
    name?: string;
    location?: string | null;
    status?: "active" | "inactive";
  };
}

export interface DeliveryCharge {
  id: number;
  title: string;
  amount: number | string;
  status: "active" | "inactive";
  branches?: DeliveryChargeBranch[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeliveryChargeBody {
  title: string;
  amount: number;
  branches?: number[];
  branchId?: number;
}

export interface UpdateDeliveryChargeBody {
  title: string;
  amount: number;
  branches?: number[];
  branchId?: number;
}
