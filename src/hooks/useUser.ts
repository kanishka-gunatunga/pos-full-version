import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as userService from "@/services/userService";
import { User, CreateUserData, UpdateUserData } from "@/types/user";

export const USER_KEYS = {
  all: ["users"] as const,
  lists: () => [...USER_KEYS.all, "list"] as const,
  list: (status: string) => [...USER_KEYS.lists(), { status }] as const,
  search: (params: any) => [...USER_KEYS.all, "search", params] as const,
  details: () => [...USER_KEYS.all, "detail"] as const,
  detail: (id: string | number) => [...USER_KEYS.details(), id] as const,
  passcode: (id: string | number) => [...USER_KEYS.all, "passcode", id] as const,
};

export const useGetUsers = (status?: string) => {
  return useQuery({
    queryKey: USER_KEYS.list(status || 'active'),
    queryFn: () => userService.getUsers(status),
    staleTime: 1 * 60 * 1000,
  });
};

export const useSearchUsers = (params: { name?: string; role?: string; status?: string }) => {
  return useQuery({
    queryKey: USER_KEYS.search(params),
    queryFn: () => userService.searchUsers(params),
    enabled: Object.keys(params).length > 0,
  });
};

export const useGetUserById = (id: string | number | undefined) => {
  return useQuery({
    queryKey: USER_KEYS.detail(id!),
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });
};

export const useGetUserPasscode = (id: string | number | undefined) => {
  return useQuery({
    queryKey: USER_KEYS.passcode(id!),
    queryFn: () => userService.getUserPasscode(id!),
    enabled: !!id,
  });
};

export const useRegisterUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserData) => userService.registerUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
  });
};

export const useLoginUser = () => {
  return useMutation({
    mutationFn: (data: any) => userService.loginUser(data),
  });
};

export const useGetMe = () => {
  return useQuery({
    queryKey: [...USER_KEYS.all, "me"],
    queryFn: userService.getMe,
  });
};

export const useVerifyPasscode = () => {
  return useMutation({
    mutationFn: (passcode: string) => userService.verifyPasscode(passcode),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateUserData }) =>
      userService.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(id) });
    },
  });
};

export const useActivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => userService.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => userService.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
  });
};
