import { apiFetch } from "./client";

export function placeOrder(payload) {
  return apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOrders(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const query = new URLSearchParams(clean).toString();
  return apiFetch(`/api/orders${query ? `?${query}` : ""}`);
}

export function getOrderById(id) {
  return apiFetch(`/api/orders/${id}`);
}

export const getReceipt = (id) => apiFetch(`/api/orders/${id}/receipt`);