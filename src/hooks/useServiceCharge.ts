import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as serviceChargeService from "@/services/serviceChargeService";
import type { UpsertServiceChargeBody } from "@/types/serviceCharge";

export const SERVICE_CHARGE_KEYS = {
  all: ["service-charge"] as const,
  byBranch: (branchId?: number | null) =>
    [...SERVICE_CHARGE_KEYS.all, "branch", branchId ?? "global"] as const,
};

export function useServiceCharge(branchId?: number | null) {
  return useQuery({
    queryKey: SERVICE_CHARGE_KEYS.byBranch(branchId),
    queryFn: () => serviceChargeService.getServiceCharge(branchId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpsertServiceCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertServiceChargeBody) => serviceChargeService.upsertServiceCharge(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_CHARGE_KEYS.all });
    },
  });
}
