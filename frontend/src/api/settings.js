import { apiFetch } from "./client";

export function getSettings() {
  return apiFetch("/api/settings");
}

export function updateSettings(payload) {
  return apiFetch("/api/settings", { method: "PUT", body: JSON.stringify(payload) });
}

export function getSecurityStatus() {
  return apiFetch("/api/settings/security-status");
}

export function getReceiptSettings(branchId) {
  return apiFetch(`/api/branches/${branchId}/settings/receipt`);
}

export function updateReceiptSettings(branchId, payload) {
  return apiFetch(`/api/branches/${branchId}/settings/receipt`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}