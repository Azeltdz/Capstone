import { apiFetch } from "./client";

export function getBranches() {
  return apiFetch("/api/branches");
}

export function getBranchesSummary() {
  return apiFetch("/api/branches/summary");
}

export function createBranch(payload) {
  return apiFetch("/api/branches", { method: "POST", body: JSON.stringify(payload) });
}

export function updateBranch(id, payload) {
  return apiFetch(`/api/branches/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteBranch(id) {
  return apiFetch(`/api/branches/${id}`, { method: "DELETE" });
}