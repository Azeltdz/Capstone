// src/context/AuthContext.jsx
//
// Holds the logged-in user + token in memory (backed by sessionStorage
// so a page refresh doesn't log the user out). Every page reads the
// current user via useAuth() instead of touching sessionStorage
// directly — this is the one place that will need to talk to the
// real POST /api/auth/login endpoint (already built and tested).

import { createContext, useContext, useState, useCallback } from "react";
import { API_BASE } from "../api/client";

const AuthContext = createContext(null);

// TEMPORARY — mock accounts so the UI can be clicked through without
// the Express backend running. Checked first in login(); any username
// not listed here falls through to the real fetch below untouched.
// Delete this block once you're testing against the real backend.
const MOCK_ACCOUNTS = [
  { username: "owner", password: "owner123", user: { id: 1, username: "owner", fullName: "Filipina Sarabia", role: "owner", branchId: null } },
  { username: "cashier", password: "cashier123", user: { id: 2, username: "cashier", fullName: "Maria Cruz", role: "cashier", branchId: "poblacion" } },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username, password) => {
    // ---- Mock account check (remove this block when using the real backend) ----
    const mock = MOCK_ACCOUNTS.find((a) => a.username === username && a.password === password);
    if (mock) {
      sessionStorage.setItem("token", "mock-token");
      sessionStorage.setItem("user", JSON.stringify(mock.user));
      setUser(mock.user);
      return mock.user;
    }
    // ---- End mock account check ----

    // This calls your real, already-tested JWT backend
    // (POST /api/auth/login in server.js).
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Invalid username or password.");
    }

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.clear();
    setUser(null);
  }, []);

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
