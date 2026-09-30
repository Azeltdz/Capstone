// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from "react";
import { apiFetch, ApiError } from "../api/client";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (user_name, password) => {
    let data;
    try {
      data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ user_name, password }),
      });
    } catch (err) {
      if (err instanceof ApiError) throw new Error(err.message);
      throw err;
    }

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.clear();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}