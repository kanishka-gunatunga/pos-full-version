import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as discountService from "@/services/discountService";
import { CreateDiscountPayload, UpdateDiscountPayload, Discount, DiscountItem } from "@/types/product";
import { OrderItem } from "@/contexts/OrderContext";

export const DISCOUNT_KEYS = {
  all: ["discounts"] as const,
  lists: () => [...DISCOUNT_KEYS.all, "list"] as const,
  list: (params: any) => [...DISCOUNT_KEYS.lists(), { params }] as const,
  details: () => [...DISCOUNT_KEYS.all, "detail"] as const,
  detail: (id: number) => [...DISCOUNT_KEYS.details(), id] as const,
};

export const useGetAllDiscounts = (params: { status?: string; search?: string } = {}) => {
  return useQuery({
    queryKey: DISCOUNT_KEYS.list(params),
    queryFn: () => discountService.getAllDiscounts(params),
  });
};

export const useGetDiscountById = (id: number) => {
  return useQuery({
    queryKey: DISCOUNT_KEYS.detail(id),
    queryFn: () => discountService.getDiscountById(id),
    enabled: !!id,
  });
};

export const useCreateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDiscountPayload) => discountService.createDiscount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.all });
    },
  });
};

export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDiscountPayload }) =>
      discountService.updateDiscount(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.detail(variables.id) });
    },
  });
};

export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => discountService.deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.all });
    },
  });
};

export const useActivateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => discountService.activateDiscount(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.detail(id) });
    },
  });
};

export const useDeactivateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => discountService.deactivateDiscount(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.detail(id) });
    },
  });
};


export const findApplicableDiscount = (
  item: OrderItem,
  discounts: Discount[]
): { discountName: string; discountItem: DiscountItem } | null => {
  if (!discounts || discounts.length === 0) return null;

  for (const discount of discounts) {
    if (discount.status !== "active") continue;

    const matchedItem = discount.items?.find((di) => {
      if (di.variationOptionId) {
        return (
          di.productId === item.productId &&
          di.variationOptionId === item.variationOptionId
        );
      }
      return di.productId === item.productId && !di.variationOptionId;
    });

    if (matchedItem) {
      return {
        discountName: discount.name,
        discountItem: matchedItem,
      };
    }
  }

  return null;
};


export const calculateItemDiscount = (
  price: number,
  qty: number,
  discountItem: DiscountItem
): number => {
  const value = Number(discountItem.discountValue);
  if (discountItem.discountType === "percentage") {
    return (price * qty * value) / 100;
  } else {
    return value * qty;
  }
};
