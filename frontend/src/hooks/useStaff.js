import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStaff, createStaff, updateStaff, deactivateStaff, activateStaff } from "../api/staff";

export function useStaffList() {
  return useQuery({ queryKey: ["staff"], queryFn: () => getStaff() });
}

function invalidateStaffAndBranches(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["staff"] });
  queryClient.invalidateQueries({ queryKey: ["branches"] });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: createStaff, onSuccess: () => invalidateStaffAndBranches(queryClient) });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => updateStaff(id, payload),
    onSuccess: () => invalidateStaffAndBranches(queryClient),
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: deactivateStaff, onSuccess: () => invalidateStaffAndBranches(queryClient) });
}

export function useActivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: activateStaff, onSuccess: () => invalidateStaffAndBranches(queryClient) });
}