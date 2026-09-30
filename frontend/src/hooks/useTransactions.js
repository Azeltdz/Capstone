import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  getTransactions, getTransactionSummary, getTransactionTrend, downloadTransactionsCsv,
} from "../api/transactions";

const live = (params) => (params.period === "today" ? 60 * 1000 : false);

export function useTransactions(params) {
  return useQuery({
    queryKey: ["transactions", "list", params],
    queryFn: () => getTransactions(params),
    placeholderData: keepPreviousData,
    refetchInterval: live(params),
  });
}

export function useTransactionSummary(params) {
  return useQuery({
    queryKey: ["transactions", "summary", params],
    queryFn: () => getTransactionSummary(params),
    placeholderData: keepPreviousData,
    refetchInterval: live(params),
  });
}

export function useTransactionTrend(params) {
  return useQuery({
    queryKey: ["transactions", "trend", params],
    queryFn: () => getTransactionTrend(params),
    placeholderData: keepPreviousData,
    refetchInterval: live(params),
  });
}

export function useExportTransactions() {
  return useMutation({ mutationFn: ({ params, filename }) => downloadTransactionsCsv(params, filename) });
}