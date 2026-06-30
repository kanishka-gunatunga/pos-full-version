import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tableService } from "@/services/tableService";
import { CreateTableRequest, UpdateTableRequest } from "@/types/table";

export const useGetTables = (search?: string) => {
  return useQuery({
    queryKey: ["tables", search],
    queryFn: () => tableService.getTables(search),
  });
};

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTableRequest) => tableService.createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTableRequest }) =>
      tableService.updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tableService.deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
};
