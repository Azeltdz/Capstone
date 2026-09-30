import { apiFetch } from "./client";

export function getMenuItems() {
  return apiFetch("/api/menu-items");
} 
export const getRecipe = (itemId) => apiFetch(`/api/menu-items/${itemId}/bom`);

export const saveRecipe = (itemId, payload) =>
  apiFetch(`/api/menu-items/${itemId}/recipe`, { method: "PUT", body: JSON.stringify(payload) });

export const createMenuItem = (body) => apiFetch("/api/menu-items", { method: "POST", body });
export const updateMenuItem = (id, body) => apiFetch(`/api/menu-items/${id}`, { method: "PUT", body });
export const deleteMenuItem = (id) => apiFetch(`/api/menu-items/${id}`, { method: "DELETE" });