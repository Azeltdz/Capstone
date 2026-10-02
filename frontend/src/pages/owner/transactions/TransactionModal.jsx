import { format } from "date-fns";
import { useOrder } from "../../../hooks/useOrders";
import { useModal } from "../../../hooks/useModal";
import PrintReceiptButton from "../../../components/receipt/PrintReceiptButton";
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
              <div><dt>Payment</dt><dd>{paymentLabel(order.payment_method)}</dd></div>
              {order.table_number && <div><dt>Table</dt><dd>Table {order.table_number}</dd></div>}
              {order.customer_name && <div><dt>Customer</dt><dd>{order.customer_name}</dd></div>}
              {order.guest_count && <div><dt>Guests</dt><dd>{order.guest_count}</dd></div>}
            </dl>

            {order.items.length > 0 ? (
              <div className="modal-items">
                <div className="modal-items-head"><span>Item</span><span>Amount</span></div>
                {order.items.map((it) => (
                  <div className="modal-items-row" key={it.tx_item_id}>
                    <span>{it.quantity}× {it.item_name}</span>
                    <span>{formatPeso(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="modal-muted">No item details available.</p>
            )}

            <div className="modal-total">
              <span>Total</span>
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