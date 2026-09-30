import { apiFetch } from "./client";

export function getMenuItems() {
  return apiFetch("/api/menu-items");
} 
export const getRecipe = (itemId) => apiFetch(`/api/menu-items/${itemId}/bom`);

export const saveRecipe = (itemId, payload) =>
  apiFetch(`/api/menu-items/${itemId}/recipe`, { method: "PUT", body: JSON.stringify(payload) });