export interface Branch {
  id: number;
  name: string;
  location: string | null;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBranchData {
  name: string;
  location?: string;
}

export interface UpdateBranchData extends Partial<CreateBranchData> {}

export type BranchStatusQuery = "active" | "inactive" | "all";
