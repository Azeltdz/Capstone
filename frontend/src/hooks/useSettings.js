import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSettings, updateSettings, getSecurityStatus, getReceiptSettings, updateReceiptSettings,
} from "../api/settings";

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: getSettings });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useSecurityStatus() {
  return useQuery({
    queryKey: ["security-status"],
    queryFn: getSecurityStatus,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReceiptSettings(branchId) {
  return useQuery({
    queryKey: ["receipt-settings", branchId],
    queryFn: () => getReceiptSettings(branchId),
    enabled: !!branchId,
  });
}

export function useUpdateReceiptSettings(branchId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateReceiptSettings(branchId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["receipt-settings", branchId] }),
  });
}