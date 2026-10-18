// src/pages/cashier/pos/OrderPlacedModal.jsx
import { format } from "date-fns";
import { useModal } from "../../../hooks/useModal";
import PrintReceiptButton from "../../../components/receipt/PrintReceiptButton";
import StatusBadge from "../../../components/StatusBadge";
import { formatOrderNumber, formatPeso, ORDER_TYPE_LABELS, paymentLabel } from "../../../utils/format";
import { PWD_DISCOUNT_RATE, VAT_RATE } from "../../../utils/pricing";

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function OrderPlacedModal({ order, onClose }) {
  useModal(onClose);

  const {
    transaction_id, order_type, table_number, customer_name, guest_count,
    payment_method, payment_status = "paid", order_status = "pending",
    transaction_at, items, total_amount,
    subtotal_amount, vat_amount, pwd_discount, pwd_name, pwd_id_number,
  } = order;

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = Number(total_amount);
  const subtotal = Number(subtotal_amount ?? total_amount);
  const discount = Number(pwd_discount ?? 0);
  const vatExemption = Math.max(0, round2(subtotal - discount - total));
  const hasPwd = discount > 0 || vatExemption > 0;
  const isPaid = payment_status === "paid";

  const details = [
    ["Order type", ORDER_TYPE_LABELS[order_type] ?? order_type],
    table_number ? ["Table", `Table ${table_number}`] : null,
    customer_name ? ["Customer", customer_name] : null,
    guest_count ? ["Guests", `${guest_count} ${guest_count === 1 ? "Person" : "People"}`] : null,
    ["Payment", isPaid ? paymentLabel(payment_method) : "Pay later"],
    pwd_name ? ["PWD", `${pwd_name}${pwd_id_number ? ` · ID ${pwd_id_number}` : ""}`] : null,
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
          <div className="receipt-statuses">
            <StatusBadge kind="payment" value={payment_status} />
            <StatusBadge kind="order" value={order_status} />
          </div>

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
                  {line.note && <span className="receipt-item-note">Note: {line.note}</span>}
                </span>
                <span>{formatPeso(line.subtotal)}</span>
              </li>
            ))}
          </ul>

          <div className="receipt-summary">
            {hasPwd && (
              <>
                <div className="receipt-row">
                  <dt>Subtotal (VAT incl.)</dt>
                  <dd>{formatPeso(subtotal)}</dd>
                </div>
                <div className="receipt-row">
                  <dt>VAT exemption (PWD)</dt>
                  <dd>−{formatPeso(vatExemption)}</dd>
                </div>
                <div className="receipt-row">
                  <dt>PWD discount ({Math.round(PWD_DISCOUNT_RATE * 100)}%)</dt>
                  <dd>−{formatPeso(discount)}</dd>
                </div>
              </>
            )}
            <div className="receipt-row receipt-total">
              <dt>{isPaid ? "Total" : "Amount due"} ({itemCount} items)</dt>
              <dd>{formatPeso(total)}</dd>
            </div>
            {vat_amount != null && (
              <div className="receipt-row receipt-vat">
                <dt>VAT {Math.round(VAT_RATE * 100)}% included</dt>
                <dd>{formatPeso(Number(vat_amount))}</dd>
              </div>
            )}
          </div>

          {!isPaid && (
            <p className="order-hint order-hint--warn">
              Not paid yet. Settle it from the Tables page when the customer is ready.
            </p>
          )}

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