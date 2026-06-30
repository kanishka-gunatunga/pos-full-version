import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as customerService from "@/services/customerService";
import {
  Customer,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerSearchParams,
  CustomerFilterParams,
  BulkPromotionData,
} from "@/types/customer";

export const CUSTOMER_KEYS = {
  all: ["customers"] as const,
  lists: () => [...CUSTOMER_KEYS.all, "list"] as const,
  list: (params: CustomerFilterParams | CustomerSearchParams) =>
    [...CUSTOMER_KEYS.lists(), params] as const,
  details: () => [...CUSTOMER_KEYS.all, "detail"] as const,
  detail: (id: string | number) => [...CUSTOMER_KEYS.details(), id] as const,
  byMobile: (mobile: string) => [...CUSTOMER_KEYS.all, "mobile", mobile] as const,
  loyalty: (mobile: string) => [...CUSTOMER_KEYS.all, "loyalty", mobile] as const,
};

export const useGetAllCustomers = (params?: CustomerFilterParams) => {
  return useQuery({
    queryKey: CUSTOMER_KEYS.list(params || {}),
    queryFn: () => customerService.getAllCustomers(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSearchCustomers = (params: CustomerSearchParams) => {
  return useQuery({
    queryKey: CUSTOMER_KEYS.list(params),
    queryFn: () => customerService.searchCustomers(params),
    enabled: !!params.query,
  });
};

export const useGetCustomerByMobile = (mobile: string) => {
  return useQuery({
    queryKey: CUSTOMER_KEYS.byMobile(mobile),
    queryFn: () => customerService.getCustomerByMobile(mobile),
    enabled: !!mobile,
  });
};

export const useGetCustomerById = (id: string | number | undefined) => {
  return useQuery({
    queryKey: CUSTOMER_KEYS.detail(id!),
    queryFn: () => customerService.getCustomerById(id!),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerData) => customerService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
    },
  });
};

export const useFindOrCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerData) => customerService.findOrCreateCustomer(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.setQueryData(CUSTOMER_KEYS.detail(data.id), data);
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateCustomerData }) =>
      customerService.updateCustomer(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: CUSTOMER_KEYS.lists() });
      await queryClient.cancelQueries({ queryKey: CUSTOMER_KEYS.detail(id) });

      const previousCustomers = queryClient.getQueryData<Customer[]>(CUSTOMER_KEYS.lists());
      const previousCustomer = queryClient.getQueryData<Customer>(CUSTOMER_KEYS.detail(id));

      if (previousCustomers) {
        queryClient.setQueryData<Customer[]>(CUSTOMER_KEYS.lists(), (old) =>
          old?.map((customer) => (customer.id === id ? { ...customer, ...data } : customer))
        );
      }

      if (previousCustomer) {
        queryClient.setQueryData<Customer>(CUSTOMER_KEYS.detail(id), {
          ...previousCustomer,
          ...data,
        });
      }

      return { previousCustomers, previousCustomer };
    },
    onError: (err, { id }, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(CUSTOMER_KEYS.lists(), context.previousCustomers);
      }
      if (context?.previousCustomer) {
        queryClient.setQueryData(CUSTOMER_KEYS.detail(id), context.previousCustomer);
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(id) });
    },
  });
};

export const useUpdatePromotionPreference = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string | number; enabled: boolean }) =>
      customerService.updatePromotionPreference(id, enabled),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(id) });
    },
  });
};

export const useSendBulkPromotions = () => {
  return useMutation({
    mutationFn: (data: BulkPromotionData) => customerService.sendBulkPromotions(data),
  });
};

export const useActivateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => customerService.activateCustomer(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(id) });
    },
  });
};

export const useDeactivateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => customerService.deactivateCustomer(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(id) });
    },
  });
};

export const useGetLoyaltyPoints = (mobile: string) => {
  return useQuery({
    queryKey: CUSTOMER_KEYS.loyalty(mobile),
    queryFn: () => customerService.getLoyaltyPointsByMobile(mobile),
    enabled: !!mobile && mobile.length >= 9,
  });
};
