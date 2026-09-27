import { apiFetch } from "./client";

export function getTables(branchId) {
  return apiFetch(`/api/branches/${branchId}/tables`);
}

export function updateTableStatus(tableId, status) {
  return apiFetch(`/api/tables/${tableId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}