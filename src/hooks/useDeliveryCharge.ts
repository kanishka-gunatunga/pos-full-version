import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as deliveryChargeService from "@/services/deliveryChargeService";
import type {
  CreateDeliveryChargeBody,
  DeliveryChargeStatusQuery,
  UpdateDeliveryChargeBody,
} from "@/types/deliveryCharge";

export const DELIVERY_CHARGE_KEYS = {
  all: ["delivery-charges"] as const,
  list: (status?: DeliveryChargeStatusQuery) =>
    [...DELIVERY_CHARGE_KEYS.all, status ?? "default"] as const,
  byBranch: (branchId: number) => [...DELIVERY_CHARGE_KEYS.all, "branch", branchId] as const,
};

export function useDeliveryCharges(status?: DeliveryChargeStatusQuery) {
  return useQuery({
    queryKey: DELIVERY_CHARGE_KEYS.list(status),
    queryFn: () => deliveryChargeService.getDeliveryCharges(status),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDeliveryChargesByBranch(branchId: number | null | undefined) {
  return useQuery({
    queryKey: DELIVERY_CHARGE_KEYS.byBranch(branchId ?? 0),
    queryFn: () => deliveryChargeService.getDeliveryChargesByBranch(branchId ?? 0),
    enabled: !!branchId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateDeliveryCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDeliveryChargeBody) => deliveryChargeService.createDeliveryCharge(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_CHARGE_KEYS.all });
    },
  });
}

export function useUpdateDeliveryCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateDeliveryChargeBody }) =>
      deliveryChargeService.updateDeliveryCharge(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_CHARGE_KEYS.all });
    },
  });
}

export function useDeactivateDeliveryCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deliveryChargeService.deactivateDeliveryCharge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_CHARGE_KEYS.all });
    },
  });
}
