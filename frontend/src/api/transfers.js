import { apiFetch } from "./client";

export const createTransfer = (payload) =>
  apiFetch("/api/transfers", { method: "POST", body: JSON.stringify(payload) });

export const getTransfers = () => apiFetch("/api/transfers");