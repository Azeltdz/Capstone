import { apiFetch } from "./client";

const scope = (branchId) => (branchId ? `?branchId=${branchId}` : "");

export const getDashboard = () => apiFetch("/api/analytics/dashboard");
export const getTrends = (branchId) => apiFetch(`/api/analytics/trends${scope(branchId)}`);
export const getProcurement = (branchId) => apiFetch(`/api/analytics/procurement${scope(branchId)}`);
export const getBranchAnomalies = () => apiFetch("/api/analytics/branch-anomalies");
export const refreshForecasts = () => apiFetch("/api/analytics/forecasts/refresh", { method: "POST" });