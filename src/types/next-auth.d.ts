import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    employeeId?: string;
    role?: string;
    status?: string;
    branchId?: number | null;
    token?: string;
  }

  interface Session {
    user: User & {
      id?: string;
      employeeId?: string;
      role?: string;
      status?: string;
      branchId?: number | null;
      token?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    token?: string;
    employeeId?: string;
    role?: string;
    status?: string;
    branchId?: number | null;
  }
}
