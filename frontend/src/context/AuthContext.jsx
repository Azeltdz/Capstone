// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import { logoutRequest } from "../api/auth";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    return user && sessionStorage.getItem("token") ? user : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback(async (user_name, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ user_name, password }),
    });
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    logoutRequest().catch(() => {});
    sessionStorage.clear();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}