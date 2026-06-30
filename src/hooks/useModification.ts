import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as modificationService from "@/services/modificationService";
import { CreateModificationPayload, UpdateModificationPayload } from "@/types/product";

export const MODIFICATION_KEYS = {
  all: ["modifications"] as const,
  lists: () => [...MODIFICATION_KEYS.all, "list"] as const,
  list: (status?: string) => [...MODIFICATION_KEYS.lists(), { status }] as const,
  details: () => [...MODIFICATION_KEYS.all, "detail"] as const,
  detail: (id: number) => [...MODIFICATION_KEYS.details(), id] as const,
};

export const useGetAllModifications = (status?: string) => {
  return useQuery({
    queryKey: MODIFICATION_KEYS.list(status),
    queryFn: () => modificationService.getAllModifications(status),
  });
};

export const useGetModificationById = (id: number) => {
  return useQuery({
    queryKey: MODIFICATION_KEYS.detail(id),
    queryFn: () => modificationService.getModificationById(id),
    enabled: !!id,
  });
};

export const useCreateModification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateModificationPayload) => modificationService.createModification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODIFICATION_KEYS.all });
    },
  });
};

export const useUpdateModification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateModificationPayload }) =>
      modificationService.updateModification(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: MODIFICATION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MODIFICATION_KEYS.detail(variables.id) });
    },
  });
};

export const useActivateModification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => modificationService.activateModification(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: MODIFICATION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MODIFICATION_KEYS.detail(id) });
    },
  });
};

export const useDeactivateModification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => modificationService.deactivateModification(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: MODIFICATION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MODIFICATION_KEYS.detail(id) });
    },
  });
};
