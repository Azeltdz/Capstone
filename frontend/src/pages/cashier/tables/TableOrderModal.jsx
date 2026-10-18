import { useState } from "react";
import toast from "react-hot-toast";
import { useOrder } from "../../../hooks/useOrders";
import { useReleaseTable } from "../../../hooks/useTables";
import { useUpdateOrderStatus } from "../../../hooks/useOrderActions";
import { useModal } from "../../../hooks/useModal";
import StatusBadge from "../../../components/StatusBadge";
import ConfirmDialog from "../../../components/ConfirmDialog";
import SettlePayment from "../../../components/payment/SettlePayment";
import PrintReceiptButton from "../../../components/receipt/PrintReceiptButton";
import { formatOrderNumber, formatPeso, paymentLabel } from "../../../utils/format";
import { calcChange } from "../../../utils/pricing";

// Opens when the cashier taps a seated table: see the bill, settle it, mark it completed, clear the table.
export default function TableOrderModal({ table, onClose }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearError, setClearError] = useState("");
  useModal(() => {
    if (!confirmClear) onClose();
  });

  const { data: order, isLoading, error } = useOrder(table.seated_transaction_id);
  const complete = useUpdateOrderStatus();
  const release = useReleaseTable();

  const unpaid = order?.payment_status === "unpaid";
  const tendered = order?.amount_tendered != null ? Number(order.amount_tendered) : null;

  async function markCompleted() {
    try {
      await complete.mutateAsync({ orderId: order.transaction_id, order_status: "completed" });
      toast.success("Order marked completed");
    } catch (err) {
      toast.error(err.message || "Couldn't update the order");
    }
  }

  async function clearTable() {
    setClearError("");
    try {
      await release.mutateAsync(table.table_id);
      toast.success(`Table ${table.table_number} is now available`);
      setConfirmClear(false);
      onClose();
    } catch (err) {
      setClearError(err.message);
    }
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card table-modal" role="dialog" aria-modal="true" aria-label={`Table ${table.table_number}`} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3 className="modal-title">Table {table.table_number}</h3>
              <div className="modal-subtitle">
                {formatOrderNumber(table.seated_transaction_id)}
                {table.seated_customer ? ` · ${table.seated_customer}` : ""}
                {table.seated_guests ? ` · ${table.seated_guests} guests` : ""}
              </div>
            </div>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {isLoading && <p className="loading-text">Loading order…</p>}
          {error && <p className="error-text">Couldn't load this order. {error.message}</p>}

          {order && (
            <>
              <p>
                <StatusBadge kind="payment" value={order.payment_status} />{" "}
                <StatusBadge kind="order" value={order.order_status} />
              </p>

              <div className="modal-items">
                <div className="modal-items-head"><span>Item</span><span>Amount</span></div>
                {order.items.map((it) => (
                  <div className="modal-items-row" key={it.tx_item_id}>
                    <span>
                      {it.quantity}× {it.item_name}
                      {it.pwd_applied && <em className="receipt-item-note">PWD</em>}
                      {it.note && <em className="receipt-item-note">Note: {it.note}</em>}
                    </span>
                    <span>{formatPeso(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {Number(order.pwd_discount) > 0 && (
                <p className="pay-hint">
                  PWD discount −{formatPeso(order.pwd_discount)}
                  {order.pwd_name ? ` · ${order.pwd_name}` : ""}{order.pwd_id_number ? ` · ID ${order.pwd_id_number}` : ""}
                </p>
              )}

              <div className="modal-total">
                <span>{unpaid ? "Amount due" : "Total"}</span>
                <span>{formatPeso(order.total_amount)}</span>
              </div>
              {order.vat_amount != null && <p className="order-hint">VAT 12% included: {formatPeso(order.vat_amount)}</p>}

              {!unpaid && (
                <dl className="placed-figures">
                  <div><dt>Paid by</dt><dd>{paymentLabel(order.payment_method)}</dd></div>
                  {tendered !== null && <div><dt>Cash received</dt><dd>{formatPeso(tendered)}</dd></div>}
                  {tendered !== null && <div className="placed-change"><dt>Change</dt><dd>{formatPeso(calcChange(tendered, order.total_amount))}</dd></div>}
                </dl>
              )}

              {unpaid && <SettlePayment order={order} />}

              <div className="confirm-actions table-modal-actions">
                <PrintReceiptButton orderId={order.transaction_id} copy={!unpaid} />
                {order.order_status === "pending" && (
                  <button type="button" className="btn-outline" onClick={markCompleted} disabled={complete.isPending}>
                    {complete.isPending ? "Saving…" : "Mark completed"}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-solid"
                  onClick={() => { setClearError(""); setConfirmClear(true); }}
                  disabled={unpaid}
                  title={unpaid ? "Settle the payment first" : undefined}
                >
                  Clear table
                </button>
              </div>
              {unpaid && <p className="pay-hint">Settle the payment first. A table with an unpaid bill can't be cleared.</p>}
            </>
          )}
        </div>
      </div>

      {confirmClear && (
        <ConfirmDialog
          title={`Clear Table ${table.table_number}?`}
          message="Only clear it once the guests have left. It becomes available for the next party right away."
          confirmLabel="Clear table"
          busy={release.isPending}
          error={clearError}
          onConfirm={clearTable}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </>
  );
}