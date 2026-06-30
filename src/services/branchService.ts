import axiosInstance from "@/lib/api/axiosInstance";
import { 
  Branch, 
  CreateBranchData, 
  UpdateBranchData, 
  BranchStatusQuery 
} from "@/types/branch";

export const getAllBranches = async (status?: BranchStatusQuery): Promise<Branch[]> => {
  const params = status ? { status } : {};
  const res = await axiosInstance.get("/branches", { params });
  return res.data;
};

export const getBranchById = async (id: number): Promise<Branch> => {
  const res = await axiosInstance.get(`/branches/${id}`);
  return res.data;
};

export const createBranch = async (data: CreateBranchData): Promise<Branch> => {
  const res = await axiosInstance.post("/branches", data);
  return res.data;
};

export const updateBranch = async (id: number, data: UpdateBranchData): Promise<Branch> => {
  const res = await axiosInstance.put(`/branches/${id}`, data);
  return res.data;
};

export const activateBranch = async (id: number): Promise<{ message: string }> => {
  const res = await axiosInstance.post(`/branches/${id}/activate`);
  return res.data;
};

export const deactivateBranch = async (id: number): Promise<{ message: string }> => {
  const res = await axiosInstance.post(`/branches/${id}/deactivate`);
  return res.data;
};