import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDashboard, getTrends, getProcurement, getBranchAnomalies, refreshForecasts,
} from "../api/analytics";

export function useDashboard() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: getDashboard,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useTrends(branchId) {
  return useQuery({
    queryKey: ["analytics", "trends", branchId ?? "all"],
    queryFn: () => getTrends(branchId),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useProcurement(branchId) {
  return useQuery({
    queryKey: ["analytics", "procurement", branchId ?? "all"],
    queryFn: () => getProcurement(branchId),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useBranchAnomalies() {
  return useQuery({
    queryKey: ["analytics", "anomalies"],
    queryFn: getBranchAnomalies,
    staleTime: 60 * 1000,
  });
}

export function useRefreshForecasts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshForecasts,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analytics", "dashboard"] }),
  });
}