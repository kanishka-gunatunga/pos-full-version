export type UserRole = "admin" | "manager" | "cashier" | "kitchen";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string | number;
  employeeId: string;
  name: string;
  email: string | null;
  role: UserRole;
  passcode: string | null;
  branchId: number;
  branchName?: string | null;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name: string;
  email?: string;
  password?: string;
  employeeId: string;
  role: UserRole;
  branchId?: number;
  passcode?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  status?: UserStatus;
}
