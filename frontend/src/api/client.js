// src/api/client.js
import { CASHIER_LOGIN_PATH, OWNER_LOGIN_PATH } from "../constants/routes";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

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

const NOTICE_FOR = { SESSION_EXPIRED: "expired", ACCOUNT_INACTIVE: "account", BRANCH_INACTIVE: "branch" };

async function request(path, options = {}) {
  const { auth = true, ...fetchOptions } = options; // auth: false = don't send or react to a session token
  const token = auth ? sessionStorage.getItem("token") : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: {
      ...(typeof fetchOptions.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });

  if (res.status === 401 && token) {
    const body = await res.json().catch(() => ({}));
    let role = null;
    try {
      role = JSON.parse(sessionStorage.getItem("user"))?.role;
    } catch {
      /* ignore */
    }
    sessionStorage.clear();
    const loginPath = role === "owner" ? OWNER_LOGIN_PATH : CASHIER_LOGIN_PATH;
    window.location.href = `${loginPath}?notice=${NOTICE_FOR[body.code] ?? "expired"}`;
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