import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTransfer, getTransfers } from "../api/transfers";

export function useTransferHistory() {
  return useQuery({ queryKey: ["transfers"], queryFn: getTransfers, staleTime: 30 * 1000 });
}

export function useRecordTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      for (const key of ["transfers", "inventory", "analytics"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}