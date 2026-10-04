import { apiFetch } from "./client";

export const getMe = () => apiFetch("/api/auth/me").then((data) => data.user);