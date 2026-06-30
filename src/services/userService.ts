import axiosInstance from "@/lib/api/axiosInstance";
import { User, CreateUserData, UpdateUserData } from "@/types/user";

export const registerUser = async (data: CreateUserData): Promise<User> => {
  const res = await axiosInstance.post("/auth/register", data);
  return res.data;
};

export const loginUser = async (data: any): Promise<{ user: User; token: string }> => {
  const res = await axiosInstance.post("/auth/login", data);
  return res.data;
};

export const getMe = async (): Promise<{ user: User }> => {
  const res = await axiosInstance.get("/auth/me");
  return res.data;
};

export const verifyPasscode = async (passcode: string): Promise<{ message: string; verified: boolean }> => {
  const res = await axiosInstance.post("/auth/verify-passcode", { passcode }, {
    skipAuthRedirectOn401: true,
  });
  return res.data;
};

export const getUsers = async (status?: string): Promise<User[]> => {
  const res = await axiosInstance.get("/users", { params: { status: status || 'all' } });
  return Array.isArray(res.data) ? res.data : (res.data?.users ?? []);
};

export const searchUsers = async (params: { name?: string; role?: string; status?: string }): Promise<User[]> => {
  const res = await axiosInstance.get("/users/search", { params });
  return Array.isArray(res.data) ? res.data : (res.data?.users ?? []);
};

export const getUserById = async (id: string | number): Promise<User> => {
  const res = await axiosInstance.get(`/users/${id}`);
  return res.data;
};

export const updateUser = async (id: string | number, data: UpdateUserData): Promise<User> => {
  const res = await axiosInstance.put(`/users/${id}`, data);
  return res.data;
};

export const activateUser = async (id: string | number): Promise<void> => {
  await axiosInstance.post(`/users/${id}/activate`);
};

export const deactivateUser = async (id: string | number): Promise<void> => {
  await axiosInstance.post(`/users/${id}/deactivate`);
};

export const getUserPasscode = async (id: string | number): Promise<{ passcode: string }> => {
  const res = await axiosInstance.get(`/users/${id}/passcode`);
  return res.data;
};
