import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as paymentService from "@/services/paymentService";
import type { CreatePaymentPayload, PaymentUpdatePayload } from "@/types/payment";
import { ORDER_KEYS } from "@/hooks/useOrder";
import {
  patchOrderPaymentInQueryCache,
  readOrderPaymentFieldsFromRefundResponse,
  readOrderSnapshotFromPaymentResponse,
} from "@/domains/orders/patchOrderPaymentInCache";

export const PAYMENT_KEYS = {
  all: ["payments"] as const,
  lists: () => [...PAYMENT_KEYS.all, "list"] as const,
  list: (filters: unknown) => [...PAYMENT_KEYS.lists(), { filters }] as const,
  byOrder: (orderId: number) => [...PAYMENT_KEYS.all, "order", orderId] as const,
};

export const useGetAllPaymentDetails = () => {
  return useQuery({
    queryKey: PAYMENT_KEYS.lists(),
    queryFn: paymentService.getAllPaymentDetails,
    // staleTime: 1 * 60 * 1000,
  });
};

export const useSearchPaymentDetails = (query: string) => {
  return useQuery({
    queryKey: ["payments", "search", query],
    queryFn: () => paymentService.searchPaymentDetails(query),
    enabled: !!query,
  });
};

export const useFilterPaymentsByStatus = (status: string) => {
  return useQuery({
    queryKey: ["payments", "filter", status],
    queryFn: () => paymentService.filterPaymentsByStatus(status),
    enabled: status !== "All",
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentService.createPayment(payload),
    onSuccess: async (data, variables) => {
      const fields = readOrderPaymentFieldsFromRefundResponse(data);
      const { orderPaymentStatus, balanceDue, totalRefunded, requiresAdditionalPayment } = fields;
      const resolvedOrderId = fields.orderId ?? variables?.orderId;
      const patchedOrder =
        orderPaymentStatus != null &&
        orderPaymentStatus !== "" &&
        resolvedOrderId != null &&
        String(resolvedOrderId) !== "";
      if (patchedOrder) {
        patchOrderPaymentInQueryCache(
          queryClient,
          resolvedOrderId,
          orderPaymentStatus,
          balanceDue,
          totalRefunded,
          requiresAdditionalPayment,
          readOrderSnapshotFromPaymentResponse(data)
        );
      }
      await queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });

      await queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.all,
        refetchType: "active",
      });
      if (variables?.orderId != null) {
        await queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.orderId) });
      }
    },
  });
};

export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PaymentUpdatePayload }) =>
      paymentService.updatePaymentStatus(id, payload),
    onSuccess: async (data) => {
      const {
        orderPaymentStatus,
        balanceDue,
        orderId,
        totalRefunded,
        requiresAdditionalPayment,
      } = readOrderPaymentFieldsFromRefundResponse(data);
      const patchedOrder =
        orderPaymentStatus && orderId != null && String(orderId) !== "";
      if (patchedOrder) {
        patchOrderPaymentInQueryCache(
          queryClient,
          orderId,
          orderPaymentStatus,
          balanceDue,
          totalRefunded,
          requiresAdditionalPayment,
          readOrderSnapshotFromPaymentResponse(data)
        );
      }
      await queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });

      await queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.all,
        refetchType: "active",
      });
    },
  });
};

export const useGetPaymentsByOrder = (orderId: number) => {
  return useQuery({
    queryKey: PAYMENT_KEYS.byOrder(orderId),
    queryFn: () => paymentService.getPaymentsByOrder(orderId),
    enabled: !!orderId,
  });
};

export const useGetPaymentStats = () => {
  return useQuery({
    queryKey: [...PAYMENT_KEYS.all, "stats"],
    queryFn: paymentService.getPaymentStats,
    // staleTime: 1 * 60 * 1000,
  });
};
