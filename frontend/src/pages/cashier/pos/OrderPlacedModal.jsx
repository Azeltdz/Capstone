import { useModal } from "../../../hooks/useModal";
import PrintReceiptButton from "../../../components/receipt/PrintReceiptButton";
import StatusBadge from "../../../components/StatusBadge";
import { formatOrderNumber, formatPeso, ORDER_TYPE_LABELS } from "../../../utils/format";

export default function OrderPlacedModal({ order, onClose }) {
  useModal(onClose);
  const unpaid = order.payment_status === "unpaid";
  const total = Number(order.total_amount);
  const tendered = order.amount_tendered != null ? Number(order.amount_tendered) : null;
  const change = order.change_amount != null ? Number(order.change_amount) : null;
  const where = order.table_number ? ` · Table ${order.table_number}` : "";

  return (
    <div className="modal-backdrop">
      <div className="modal-card placed-modal" role="dialog" aria-modal="true" aria-labelledby="placed-title">
        <div className="placed-check" aria-hidden="true">✓</div>
        <h3 className="modal-title" id="placed-title">{unpaid ? "Order placed · unpaid" : "Paid · order placed"}</h3>
        <p className="modal-subtitle">
          {formatOrderNumber(order.transaction_id)} · {ORDER_TYPE_LABELS[order.order_type] ?? order.order_type}{where}
        </p>
        <p>
          <StatusBadge kind="payment" value={order.payment_status} />{" "}
          <StatusBadge kind="order" value={order.order_status} />
        </p>

        <dl className="placed-figures">
          <div><dt>{unpaid ? "Amount due" : "Total"}</dt><dd>{formatPeso(total)}</dd></div>
          {tendered !== null && <div><dt>Cash received</dt><dd>{formatPeso(tendered)}</dd></div>}
          {change !== null && <div className="placed-change"><dt>Change</dt><dd>{formatPeso(change)}</dd></div>}
        </dl>

        {unpaid && <p className="pay-hint">Settle this bill from {order.table_number ? "the Tables screen" : "the Orders screen"} when the customer pays.</p>}

        <div className="confirm-actions">
          <PrintReceiptButton orderId={order.transaction_id} />
          <button type="button" className="btn-solid" onClick={onClose} autoFocus>New order</button>
        </div>
      </div>
    </div>
  );
}