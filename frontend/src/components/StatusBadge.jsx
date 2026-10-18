import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../utils/orderStatus";

export default function StatusBadge({ kind, value }) {
  if (!value) return null;
  const labels = kind === "payment" ? PAYMENT_STATUS_LABELS : ORDER_STATUS_LABELS;
  return <span className={`status-pill status-pill--${value}`}>{labels[value] ?? value}</span>;
}