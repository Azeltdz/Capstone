import { apiFetch } from "./client";

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

export function updateInventoryEntry(id, payload) {
  return apiFetch(`/api/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function adjustInventoryEntry(id, delta) {
  return apiFetch(`/api/inventory/${id}/adjust`, {
    method: "PATCH",
    body: JSON.stringify({ delta }),
  });
}

export function deleteInventoryEntry(id) {
  return apiFetch(`/api/inventory/${id}`, { method: "DELETE" });
}