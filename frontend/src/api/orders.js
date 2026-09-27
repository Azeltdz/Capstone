import { apiFetch } from "./client";

export function placeOrder(payload) {
  return apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/orders${query ? `?${query}` : ""}`);
}

export function getOrderById(id) {
  return apiFetch(`/api/orders/${id}`);
}