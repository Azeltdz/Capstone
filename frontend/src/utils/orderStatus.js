export const ORDER_STATUS_LABELS = { pending: "Pending", completed: "Completed" };
export const PAYMENT_STATUS_LABELS = { unpaid: "Unpaid", paid: "Paid" };

export const ORDER_TYPE_OPTIONS = [
  { value: "dine-in", label: "Dine-in" },
  { value: "take-out", label: "Take-out" },
  { value: "delivery", label: "Delivery" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "gcash", label: "GCash" },
];

export function getTableTone(table) {
  if (table.status !== "occupied") return "available";
  return table.seated_payment_status === "unpaid" ? "unpaid" : "paid";
}