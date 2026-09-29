import { useQuery } from "@tanstack/react-query";
import { getBranches } from "../api/branches";

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
    staleTime: 5 * 60 * 1000,
  });
}