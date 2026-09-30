import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTables, releaseTable, saveTableLayout } from "../api/tables";

export function useTables(branchId) {
  return useQuery({
    queryKey: ["tables", branchId],
    queryFn: () => getTables(branchId),
    enabled: !!branchId,
    refetchInterval: 10000,
  });
}

export function useReleaseTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: releaseTable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useSaveTableLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, ...payload }) => saveTableLayout(branchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}