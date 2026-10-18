import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settleOrder, updateOrderStatus } from "../api/orders";

function useRefreshAfterOrderChange() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["tables"] });
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
  };
}

export function useSettleOrder() {
  const refresh = useRefreshAfterOrderChange();
  return useMutation({
    mutationFn: ({ orderId, payment_method }) => settleOrder(orderId, { payment_method }),
    onSuccess: refresh,
  });
}

export function useUpdateOrderStatus() {
  const refresh = useRefreshAfterOrderChange();
  return useMutation({
    mutationFn: ({ orderId, order_status }) => updateOrderStatus(orderId, { order_status }),
    onSuccess: refresh,
  });
}