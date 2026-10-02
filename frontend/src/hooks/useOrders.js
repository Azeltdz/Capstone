import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { placeOrder, getOrders, getOrderById, getReceipt } from "../api/orders";

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      // Placing an order changes tables (occupied) and inventory (deducted) too
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      
    },
  });
}

export function useOrders(params) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => getOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });
}

export function useReceipt(id) {
  return useQuery({
    queryKey: ["orders", "receipt", id],
    queryFn: () => getReceipt(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}