import { apiFetch } from "./client";

export function getMenuItems() {
  return apiFetch("/api/menu-items");
} 