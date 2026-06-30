import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as customerService from "@/services/customerService";
import { CategoryDiscount } from "@/types/customer";

export const useGetCategoryDiscounts = () => {
  return useQuery({
    queryKey: ["categoryDiscounts"],
    queryFn: customerService.getCategoryDiscounts,
  });
};

export const useUpdateCategoryDiscounts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (discounts: CategoryDiscount[]) => 
      customerService.updateCategoryDiscounts(discounts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryDiscounts"] });
    },
  });
};
