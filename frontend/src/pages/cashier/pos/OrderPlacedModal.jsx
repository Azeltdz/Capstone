import { useEffect } from "react";

const peso = (n) => `₱${Number(n).toFixed(2)}`;

const ORDER_TYPE_LABELS = { "dine-in": "Dine-in", "take-out": "Take-out", "delivery": "Delivery" };

export default function OrderPlacedModal({ order, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const {
    transaction_id, order_type, table_number, payment_method,
    transaction_at, items, total_amount, customer,
  } = order;

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const details = [
    ["Order type", ORDER_TYPE_LABELS[order_type] || order_type],
    table_number ? ["Table", `Table ${table_number}`] : null,
    customer ? ["Customer", customer.name] : null,
    customer?.phone ? ["Phone", customer.phone] : null,
    customer ? ["Guests", `${customer.guests} ${customer.guests === 1 ? "Person" : "People"}`] : null,
    ["Payment", payment_method],
    ["Placed", new Date(transaction_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })],
  ].filter(Boolean);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-receipt" role="dialog" aria-modal="true" aria-labelledby="order-placed-title">
        <div className="modal-header">
          <div>
            <h3 id="order-placed-title">Order Placed</h3>
            <span className="receipt-id">#TXN-{String(transaction_id).padStart(4, "0")}</span>
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
                <span>{peso(line.subtotal)}</span>
              </li>
            ))}
          </ul>

          <div className="receipt-summary">
            <div className="receipt-row receipt-total">
              <dt>Total ({itemCount} items)</dt>
              <dd>{peso(total_amount)}</dd>
            </div>
          </div>

          <button type="button" className="btn btn-navy modal-submit" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}