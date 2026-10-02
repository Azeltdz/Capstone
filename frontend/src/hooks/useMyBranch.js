import { useAuth } from "../context/AuthContext";
import { useBranches } from "./useBranches";

export function useMyBranch() {
  const { user } = useAuth();
  const { data, isLoading, error } = useBranches();
  const branch = data?.find((b) => b.branch_id === user?.branch_id) ?? null;
  return { branch, isLoading, error };
}