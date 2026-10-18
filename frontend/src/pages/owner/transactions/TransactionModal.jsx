import { format } from "date-fns";
import { useOrder } from "../../../hooks/useOrders";
import { useModal } from "../../../hooks/useModal";
import PrintReceiptButton from "../../../components/receipt/PrintReceiptButton";
import StatusBadge from "../../../components/StatusBadge";
import { formatOrderNumber, formatPeso, ORDER_TYPE_LABELS, paymentLabel } from "../../../utils/format";

export default function TransactionModal({ orderId, onClose }) {
  useModal(onClose);
  const { data: order, isLoading, error } = useOrder(orderId);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="txn-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title" id="txn-modal-title">Transaction {formatOrderNumber(orderId)}</h3>
            {order && (
              <div className="modal-subtitle">{format(new Date(order.transaction_at), "MMMM d, yyyy h:mm a")}</div>
            )}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {isLoading && <p className="loading-text">Loading transaction…</p>}
        {error && <p className="error-text">Couldn't load this transaction. {error.message}</p>}

        {order && (
          <>
            <dl className="modal-grid">
              <div><dt>Branch</dt><dd>{order.branch_name}</dd></div>
              <div><dt>Cashier</dt><dd>{order.cashier_name}</dd></div>
              <div><dt>Type</dt><dd>{ORDER_TYPE_LABELS[order.order_type] ?? order.order_type}</dd></div>
              <div>
                <dt>Payment</dt>
                <dd>{order.payment_status === "unpaid" ? "Not paid yet" : paymentLabel(order.payment_method)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge kind="payment" value={order.payment_status} />{" "}
                  <StatusBadge kind="order" value={order.order_status} />
                </dd>
              </div>
              {order.table_number && <div><dt>Table</dt><dd>Table {order.table_number}</dd></div>}
              {order.customer_name && <div><dt>Customer</dt><dd>{order.customer_name}</dd></div>}
              {order.guest_count && <div><dt>Guests</dt><dd>{order.guest_count}</dd></div>}
              {order.pwd_name && <div><dt>PWD</dt><dd>{order.pwd_name} · ID {order.pwd_id_number}</dd></div>}
            </dl>

            {order.items.length > 0 ? (
              <div className="modal-items">
                <div className="modal-items-head"><span>Item</span><span>Amount</span></div>
                {order.items.map((it) => (
                  <div className="modal-items-row" key={it.tx_item_id}>
                    <span>
                      {it.quantity}× {it.item_name}
                      {it.note && <em className="receipt-item-note">Note: {it.note}</em>}
                    </span>
                    <span>{formatPeso(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="modal-muted">No item details available.</p>
            )}

            {order.vat_amount != null && (
              <dl className="modal-grid">
                <div><dt>Subtotal (VAT incl.)</dt><dd>{formatPeso(order.subtotal_amount)}</dd></div>
                <div><dt>VATable sales</dt><dd>{formatPeso(order.vatable_sales)}</dd></div>
                <div><dt>VAT 12%</dt><dd>{formatPeso(order.vat_amount)}</dd></div>
                <div><dt>VAT-exempt sales</dt><dd>{formatPeso(order.vat_exempt_sales ?? 0)}</dd></div>
                {Number(order.pwd_discount) > 0 && (
                  <div><dt>PWD discount (20%)</dt><dd>−{formatPeso(order.pwd_discount)}</dd></div>
                )}
              </dl>
            )}

            <div className="modal-total">
              <span>{order.payment_status === "unpaid" ? "Amount due" : "Total"}</span>
              <span>{formatPeso(order.total_amount)}</span>
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <PrintReceiptButton orderId={orderId} copy />
          <button type="button" className="modal-done" onClick={onClose} autoFocus>Close</button>
        </div>
      </div>
    </div>
  );
}