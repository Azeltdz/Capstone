import { apiFetch } from "./client";

export function getStaff(branchId) {
  const query = branchId ? `?branchId=${branchId}` : "";
  return apiFetch(`/api/staff${query}`);
}

export function createStaff(payload) {
  return apiFetch("/api/staff", { method: "POST", body: JSON.stringify(payload) });
}

export function updateStaff(id, payload) {
  return apiFetch(`/api/staff/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deactivateStaff(id) {
  return apiFetch(`/api/staff/${id}/deactivate`, { method: "PATCH" });
}

export function activateStaff(id) {
  return apiFetch(`/api/staff/${id}/activate`, { method: "PATCH" });
}