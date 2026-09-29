import { apiFetch } from "./client";

export function getIngredients() {
  return apiFetch("/api/ingredients");
}

export function createIngredient(payload) {
  return apiFetch("/api/ingredients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}