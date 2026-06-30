import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as orderService from "@/services/orderService";
import {
  Order,
  CreateOrderData,
  UpdateOrderData,
  OrderSearchParams,
  OrderFilterParams,
  OrderStatus,
  OrdersListQueryParams,
} from "@/types/order";
import { useAuth } from "@/contexts/AuthContext";
import { DASHBOARD_KEYS } from "./useDashboard";
import { KitchenDashboardData } from "@/services/dashboardService";

function useOrdersQueryEnabled(requiresParams = false, paramsReady = true): boolean {
  const { isReady, token } = useAuth();
  return isReady && !!token && (!requiresParams || paramsReady);
}

export const ORDER_KEYS = {
  all: ["orders"] as const,
  lists: () => [...ORDER_KEYS.all, "list"] as const,
  listAll: (p: OrdersListQueryParams) => [...ORDER_KEYS.lists(), "all", p] as const,
  listSearch: (p: OrderSearchParams) => [...ORDER_KEYS.lists(), "search", p] as const,
  listFilter: (p: OrderFilterParams) => [...ORDER_KEYS.lists(), "filter", p] as const,
  listExclude: (status: string, p: OrdersListQueryParams) =>
    [...ORDER_KEYS.lists(), "exclude", status, p] as const,
  details: () => [...ORDER_KEYS.all, "detail"] as const,
  detail: (id: string | number) => [...ORDER_KEYS.details(), id] as const,
};

export const useGetAllOrders = (
  listQuery: OrdersListQueryParams,
  scopeEnabled: boolean = true
) => {
  const enabled = useOrdersQueryEnabled() && scopeEnabled;
  return useQuery({
    queryKey: ORDER_KEYS.listAll(listQuery),
    queryFn: () => orderService.getAllOrders(listQuery),
    enabled,
  });
};

export const useGetOrdersExcludeStatus = (status: string, listQuery?: OrdersListQueryParams) => {
  const enabled = useOrdersQueryEnabled(true, !!status);
  const q = listQuery ?? { page: 1, pageSize: 25, placedByMe: false };
  return useQuery({
    queryKey: ORDER_KEYS.listExclude(status, q),
    queryFn: () => orderService.getOrdersExcludeStatus(status, q),
    enabled,
  });
};

export const useSearchOrders = (params: OrderSearchParams) => {
  const hasParams = !!(params.q || params.orderId || params.customerName || params.phone);
  const enabled = useOrdersQueryEnabled(true, hasParams);
  return useQuery({
    queryKey: ORDER_KEYS.listSearch(params),
    queryFn: () => orderService.searchOrders(params),
    enabled,
  });
};

export const useFilterOrders = (params: OrderFilterParams) => {
  const hasParams = !!(params.status || params.paymentStatus);
  const enabled = useOrdersQueryEnabled(true, hasParams);
  return useQuery({
    queryKey: ORDER_KEYS.listFilter(params),
    queryFn: () => orderService.filterOrders(params),
    enabled,
  });
};

export const useGetOrderById = (id: string | number | undefined) => {
  const enabled = useOrdersQueryEnabled(true, !!id);
  return useQuery({
    queryKey: ORDER_KEYS.detail(id!),
    queryFn: () => orderService.getOrderById(id!),
    enabled,
  });
};


export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderData) => orderService.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateOrderData }) =>
      orderService.updateOrder(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ORDER_KEYS.lists() });
      await queryClient.cancelQueries({ queryKey: ORDER_KEYS.detail(id) });

      const previousOrder = queryClient.getQueryData<Order>(ORDER_KEYS.detail(id));

      if (previousOrder) {
        queryClient.setQueryData<Order>(ORDER_KEYS.detail(id), {
          ...previousOrder,
          ...data,
        });
      }

      return { previousOrder };
    },
    onError: (err, { id }, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(ORDER_KEYS.detail(id), context.previousOrder);
      }
    },
    onSettled: (data, error, { id }) => {
      if (!error && data != null && typeof data === "object" && "id" in data) {
        const updated = data as Order;
        queryClient.setQueryData<Order>(ORDER_KEYS.detail(id), updated);
      }
      void queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(id) });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string | number;
      data: { status: OrderStatus; rejectReason?: string; passcode?: string }
    }) => orderService.updateOrderStatus(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ORDER_KEYS.lists() });
      await queryClient.cancelQueries({ queryKey: DASHBOARD_KEYS.kitchen() });

      const previousKitchenData = queryClient.getQueryData<KitchenDashboardData>(DASHBOARD_KEYS.kitchen());

      if (previousKitchenData) {
        queryClient.setQueryData<KitchenDashboardData>(DASHBOARD_KEYS.kitchen(), (old) => {
          if (!old) return old;

          const newOrders = old.orders.map((order) => {
            if (String(order.id) === String(id)) {
              return { ...order, status: data.status.toLowerCase() };
            }
            return order;
          });

          const metrics = {
            allOrdersCount: newOrders.length,
            pendingOrdersCount: newOrders.filter(o => o.status === "pending").length,
            preparingOrdersCount: newOrders.filter(o => o.status === "preparing").length,
            readyOrdersCount: newOrders.filter(o => o.status === "ready").length,
            holdOrdersCount: newOrders.filter(o => o.status === "hold").length,
          };

          return { ...old, orders: newOrders, metrics };
        });
      }

      return { previousKitchenData };
    },
    onError: (err, variables, context) => {
      if (context?.previousKitchenData) {
        queryClient.setQueryData(DASHBOARD_KEYS.kitchen(), context.previousKitchenData);
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEYS.kitchen() });
    },
  });
};

export const useUpdateOrderItemStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      status
    }: {
      itemId: string | number;
      status: "pending" | "complete"
    }) => orderService.updateOrderItemStatus(itemId, status as OrderStatus),
    onMutate: async ({ itemId, status }) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_KEYS.kitchen() });

      const previousKitchenData = queryClient.getQueryData<KitchenDashboardData>(DASHBOARD_KEYS.kitchen());

      if (previousKitchenData) {
        queryClient.setQueryData<KitchenDashboardData>(DASHBOARD_KEYS.kitchen(), (old) => {
          if (!old) return old;

          const newOrders = old.orders.map((order) => {
            const itemIndex = order.items.findIndex(i => String(i.id) === String(itemId));
            if (itemIndex !== -1) {
              const newItems = [...order.items];
              newItems[itemIndex] = { ...newItems[itemIndex], status };
              return { ...order, items: newItems };
            }
            return order;
          });

          return { ...old, orders: newOrders };
        });
      }

      return { previousKitchenData };
    },
    onError: (err, variables, context) => {
      if (context?.previousKitchenData) {
        queryClient.setQueryData(DASHBOARD_KEYS.kitchen(), context.previousKitchenData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEYS.kitchen() });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => orderService.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });
    },
  });
};
