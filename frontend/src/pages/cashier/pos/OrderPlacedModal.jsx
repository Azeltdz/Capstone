// src/pages/cashier/pos/OrderPlacedModal.jsx
import { useEffect } from "react";

const peso = (n) => `₱${n.toFixed(2)}`;

export default function OrderPlacedModal({ order, onClose }) {
  // Close on Escape (same as the Create Order popup).
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const { id, orderType, table, customer, paymentMethod, placedAt, lines, itemCount, subtotal, tax, total } = order;

  // Only show the rows that exist for this order type (customer/table are Dine-in only).
  const details = [
    ["Order type", orderType],
    table ? ["Table", `Table ${table}`] : null,
    customer ? ["Customer", customer.name] : null,
    customer?.phone ? ["Phone", customer.phone] : null,
    customer ? ["Guests", `${customer.guests} ${customer.guests === 1 ? "Person" : "People"}`] : null,
    ["Payment", paymentMethod],
    ["Placed", placedAt],
  ].filter(Boolean);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-receipt" role="dialog" aria-modal="true" aria-labelledby="order-placed-title">
        <div className="modal-header">
          <div>
            <h3 id="order-placed-title">Order Placed</h3>
            <span className="receipt-id">{id}</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
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
            {lines.map((line) => (
              <li className="receipt-item" key={line.id}>
                <span className="receipt-item-name">
                  {line.name} <span className="receipt-item-qty">×{line.qty}</span>
                </span>
                <span>{peso(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="receipt-summary">
            <div className="receipt-row">
              <dt>Items ({itemCount})</dt>
              <dd>{peso(subtotal)}</dd>
            </div>
            <div className="receipt-row">
              <dt>Tax (5.25%)</dt>
              <dd>{peso(tax)}</dd>
            </div>
            <div className="receipt-row receipt-total">
              <dt>Total</dt>
              <dd>{peso(total)}</dd>
            </div>
          </div>

          <button type="button" className="btn btn-navy modal-submit" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}