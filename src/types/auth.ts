/**
 * Backend auth API types
 */

export type BackendUserRole = "cashier" | "manager" | "admin" | "kitchen";

export type BackendUser = {
  id: number;
  employeeId: string;
  role: BackendUserRole;
  status: string;
  name: string;
  email: string | null;
  branchId: number | null;
  branchName?: string | null;
};

export type LoginResponse = {
  token: string;
  user: BackendUser;
};

export type MeResponse = {
  user: BackendUser;
};
