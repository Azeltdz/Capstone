import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBranches, getBranchesSummary, createBranch, updateBranch, deleteBranch } from "../api/branches";

export function useBranches() {
  return useQuery({ queryKey: ["branches"], queryFn: getBranches, staleTime: 5 * 60 * 1000 });
}

export function useBranchesSummary() {
  return useQuery({ queryKey: ["branches", "summary"], queryFn: getBranchesSummary });
}

function invalidateBranches(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["branches"] });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: createBranch, onSuccess: () => invalidateBranches(queryClient) });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => updateBranch(id, payload),
    onSuccess: () => invalidateBranches(queryClient),
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: deleteBranch, onSuccess: () => invalidateBranches(queryClient) });
}