import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../api/analytics";

export function useDashboard() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: getDashboard,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}