import { apiFetch } from "./client";

export function getBranches() {
  return apiFetch("/api/branches");
}