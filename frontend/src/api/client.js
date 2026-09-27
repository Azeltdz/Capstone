// src/api/client.js
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

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
    if (token) {
      sessionStorage.clear();
      window.location.href = "/";
      throw new ApiError("Session expired", 401);
    }
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message || "Invalid credentials", 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message || `Request failed (${res.status})`, res.status);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}