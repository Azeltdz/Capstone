import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../api/auth";

const FIVE_MINUTES = 5 * 60 * 1000;

export function useSessionSync() {
  const { user, logout } = useAuth();

  const { data: me } = useQuery({
    queryKey: ["session", user?.user_id],
    queryFn: getMe,
    enabled: !!user,
    staleTime: FIVE_MINUTES,
    refetchInterval: FIVE_MINUTES,
    refetchOnWindowFocus: "always",
    retry: false,
  });

  useEffect(() => {
    if (!me || !user) return;
    if (!me.is_active || me.role !== user.role || me.branch_id !== user.branch_id) {
      toast("Your account was changed. Please sign in again.", { id: "session-changed" });
      logout();
    }
  }, [me, user, logout]);
}