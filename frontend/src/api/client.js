// src/api/client.js
export const API_BASE = import.meta.env.VITE_API_BASE;
const NOTICE_FOR = { SESSION_EXPIRED: "expired", ACCOUNT_INACTIVE: "account", BRANCH_INACTIVE: "branch" };

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function toQuery(params = {}) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function request(path, options = {}) {
  const token = sessionStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(typeof options.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && token) {
    const body = await res.json().catch(() => ({}));
    sessionStorage.clear();
    window.location.href = `/?notice=${NOTICE_FOR[body.code] ?? "expired"}`;
    throw new ApiError("Session ended", 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      body.message ||
      (Array.isArray(body.errors) && body.errors.map((e) => e.msg).join(" ")) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return res;
}

export async function apiFetch(path, options = {}) {
  const res = await request(path, options);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function apiDownload(path, filename) {
  const res = await request(path);
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}