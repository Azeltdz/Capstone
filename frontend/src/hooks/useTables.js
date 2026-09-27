import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTables, updateTableStatus } from "../api/tables";

export function useTables(branchId) {
  return useQuery({
    queryKey: ["tables", branchId],
    queryFn: () => getTables(branchId),
    enabled: !!branchId,
    refetchInterval: 10000,
  });
}

export function useUpdateTableStatus(branchId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, status }) => updateTableStatus(tableId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tables", branchId] }),
  });
}