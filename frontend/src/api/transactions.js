import { apiFetch, apiDownload, toQuery } from "./client";

export const getTransactions = (params) => apiFetch(`/api/transactions${toQuery(params)}`);
export const getTransactionSummary = (params) => apiFetch(`/api/transactions/summary${toQuery(params)}`);
export const getTransactionTrend = (params) => apiFetch(`/api/transactions/trend${toQuery(params)}`);
export const downloadTransactionsCsv = (params, filename) => apiDownload(`/api/transactions/export${toQuery(params)}`, filename);