export interface ServiceCharge {
  id?: number;
  percentage: number | string;
  branchId?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpsertServiceChargeBody {
  percentage: number;
  branchId?: number | null;
}
