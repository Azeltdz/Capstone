import { apiFetch, toQuery } from "./client";

export function getInventoryByBranch(branchId) {
  return apiFetch(`/api/branches/${branchId}/inventory`);
}

export function getAllInventory() {
  return apiFetch("/api/inventory");
}

export function getLowStockByBranch(branchId) {
  return apiFetch(`/api/branches/${branchId}/inventory/low-stock`);
}

export function getLowStockAllBranches() {
  return apiFetch("/api/inventory/low-stock");
}

export function createInventoryEntry(branchId, payload) {
  return apiFetch(`/api/branches/${branchId}/inventory`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const updateInventoryEntry = (id, payload) =>
  apiFetch(`/api/inventory/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const recordMovement = (id, payload) =>
  apiFetch(`/api/inventory/${id}/movements`, { method: "POST", body: JSON.stringify(payload) });

export const getMovements = (id, params) => 
  apiFetch(`/api/inventory/${id}/movements${toQuery(params)}`);

export function deleteInventoryEntry(id) {
  return apiFetch(`/api/inventory/${id}`, { method: "DELETE" });
}