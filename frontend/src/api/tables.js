import { apiFetch } from "./client";

export const getTables = (branchId) => apiFetch(`/api/branches/${branchId}/tables`);
export const releaseTable = (tableId) => apiFetch(`/api/tables/${tableId}/release`, { method: "POST" });
export const saveTableLayout = (branchId, payload) =>
  apiFetch(`/api/branches/${branchId}/tables/layout`, { method: "PUT", body: JSON.stringify(payload) });