// src/api/client.js
//
// Every network call in the app goes through this file. When you're
// ready to connect the real Express/Postgres backend, you should
// almost never need to touch the page components — just point
// API_BASE at your deployed backend and (if a page still uses a
// mock*() function) swap that one function's body for a real fetch
// using apiFetch(). The page's rendering code doesn't change.

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    sessionStorage.clear();
    window.location.href = "/";
    throw new ApiError("Session expired", 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  }

  // Some endpoints (e.g. 204 No Content) won't have a JSON body
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
