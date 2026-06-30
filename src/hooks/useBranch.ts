import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as branchService from "@/services/branchService";
import { 
  CreateBranchData, 
  UpdateBranchData, 
  BranchStatusQuery 
} from "@/types/branch";

export const BRANCH_KEYS = {
  all: ["branches"] as const,
  lists: () => [...BRANCH_KEYS.all, "list"] as const,
  list: (status?: BranchStatusQuery) => [...BRANCH_KEYS.lists(), { status }] as const,
  details: () => [...BRANCH_KEYS.all, "detail"] as const,
  detail: (id: number) => [...BRANCH_KEYS.details(), id] as const,
};

export const useGetAllBranches = (status?: BranchStatusQuery) => {
  return useQuery({
    queryKey: BRANCH_KEYS.list(status),
    queryFn: () => branchService.getAllBranches(status),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetBranchById = (id: number) => {
  return useQuery({
    queryKey: BRANCH_KEYS.detail(id),
    queryFn: () => branchService.getBranchById(id),
    enabled: !!id,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBranchData) => branchService.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANCH_KEYS.all });
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBranchData }) => 
      branchService.updateBranch(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BRANCH_KEYS.all });
      queryClient.setQueryData(BRANCH_KEYS.detail(data.id), data);
    },
  });
};

export const useActivateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => branchService.activateBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANCH_KEYS.all });
    },
  });
};

export const useDeactivateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => branchService.deactivateBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANCH_KEYS.all });
    },
  });
};
