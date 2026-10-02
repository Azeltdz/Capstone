// src/pages/cashier/pos/OrderPlacedModal.jsx
import { format } from "date-fns";
import { useModal } from "../../../hooks/useModal";
import PrintReceiptButton from "../../../components/receipt/PrintReceiptButton";
import { formatOrderNumber, formatPeso, ORDER_TYPE_LABELS, paymentLabel } from "../../../utils/format";

export default function OrderPlacedModal({ order, onClose }) {
  useModal(onClose);

  const {
    transaction_id, order_type, table_number, customer_name, guest_count,
    payment_method, transaction_at, items, total_amount,
  } = order;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const details = [
    ["Order type", ORDER_TYPE_LABELS[order_type] ?? order_type],
    table_number ? ["Table", `Table ${table_number}`] : null,
    customer_name ? ["Customer", customer_name] : null,
    guest_count ? ["Guests", `${guest_count} ${guest_count === 1 ? "Person" : "People"}`] : null,
    ["Payment", paymentLabel(payment_method)],
    ["Placed", format(new Date(transaction_at), "MMM d, yyyy h:mm a")],
  ].filter(Boolean);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-receipt" role="dialog" aria-modal="true" aria-labelledby="order-placed-title">
        <div className="modal-header">
          <div>
            <h3 id="order-placed-title">Order Placed</h3>
            <span className="receipt-id">{formatOrderNumber(transaction_id)}</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <dl className="receipt-details">
            {details.map(([label, value]) => (
              <div className="receipt-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <ul className="receipt-items">
            {items.map((line) => (
              <li className="receipt-item" key={line.item_id}>
                <span className="receipt-item-name">
                  {line.item_name} <span className="receipt-item-qty">×{line.quantity}</span>
                </span>
                <span>{formatPeso(line.subtotal)}</span>
              </li>
            ))}
          </ul>

          <div className="receipt-summary">
            <div className="receipt-row receipt-total">
              <dt>Total ({itemCount} items)</dt>
              <dd>{formatPeso(total_amount)}</dd>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {/* the original receipt: no REPRINT mark */}
            <PrintReceiptButton orderId={transaction_id} className="btn btn-outline" style={{ flex: 1 }} />
            <button type="button" className="btn btn-navy" style={{ flex: 1 }} onClick={onClose} autoFocus>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}