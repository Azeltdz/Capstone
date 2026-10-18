import { useState } from "react";
import toast from "react-hot-toast";
import { useModal } from "../../../hooks/useModal";
import { useReleaseTable } from "../../../hooks/useTables";
import { useSettleOrder, useUpdateOrderStatus } from "../../../hooks/useOrderActions";
import StatusBadge from "../../../components/StatusBadge";
import { formatOrderNumber, formatPeso } from "../../../utils/format";
import { getTableTone, PAYMENT_METHOD_OPTIONS } from "../../../utils/orderStatus";

function elapsedLabel(since, now) {
  const mins = Math.max(0, Math.floor((now - new Date(since).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min ago`;
}

export default function TableOrderModal({ table, now, onClose }) {
  const settle = useSettleOrder();
  const markCompleted = useUpdateOrderStatus();
  const release = useReleaseTable();

  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState("");

  const busy = settle.isPending || markCompleted.isPending || release.isPending;
  useModal(() => {
    if (!busy) onClose();
  });

  const orderId = table.seated_transaction_id;
  const isPaid = getTableTone(table) === "paid";
  const orderStatus = table.seated_order_status ?? "pending";
  const total = table.seated_total != null ? formatPeso(Number(table.seated_total)) : "—";

  async function run(action, successMessage) {
    setError("");
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      return false;
    }
  }

  async function handleSettle() {
    const ok = await run(
      () => settle.mutateAsync({ orderId, payment_method: method }),
      `Payment received · ${total}`
    );
    if (ok) {
      setPaying(false);
      setMethod(null);
    }
  }

  function handleComplete() {
    return run(
      () => markCompleted.mutateAsync({ orderId, order_status: "completed" }),
      "Order marked as completed"
    );
  }

  async function handleClear() {
    const ok = await run(
      () => release.mutateAsync(table.table_id),
      `Table ${table.table_number} is now available`
    );
    if (ok) onClose();
  }

  const details = [
    ["Customer", table.seated_customer || "—"],
    ["Guests", table.seated_guests ? `${table.seated_guests} of ${table.guest_capacity} seats` : "—"],
    ["Cashier", table.seated_cashier || "—"],
    ["Seated", table.seated_at ? elapsedLabel(table.seated_at, now) : "—"],
    ["Total", total],
  ];

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="table-order-title">
        <div className="modal-header">
          <div>
            <h3 id="table-order-title">Table {table.table_number}</h3>
            {orderId && <span className="receipt-id">{formatOrderNumber(orderId)}</span>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <div className="receipt-statuses">
            <StatusBadge kind="payment" value={isPaid ? "paid" : "unpaid"} />
            <StatusBadge kind="order" value={orderStatus} />
          </div>

          <dl className="receipt-details">
            {details.map(([label, value]) => (
              <div className="receipt-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {error && <p className="form-error" role="alert">{error}</p>}

          {paying && !isPaid && (
            <div className="pay-panel">
              <span className="form-label" id="settle-method-label">Payment method</span>
              <div className="payment-row" role="group" aria-labelledby="settle-method-label">
                {PAYMENT_METHOD_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value} type="button"
                    className={`payment-btn ${method === value ? "selected" : ""}`}
                    aria-pressed={method === value} onClick={() => setMethod(value)} disabled={busy}
                  >{label}</button>
                ))}
              </div>
              <div className="confirm-row">
                <button type="button" className="btn btn-outline" onClick={() => setPaying(false)} disabled={busy}>
                  Back
                </button>
                <button type="button" className="btn btn-navy" onClick={handleSettle} disabled={!method || busy}>
                  {settle.isPending ? "Saving…" : `Confirm payment · ${total}`}
                </button>
              </div>
            </div>
          )}

          {!paying && (
            <div className="table-order-actions">
              {!isPaid && (
                <button type="button" className="btn btn-navy" onClick={() => setPaying(true)} disabled={busy}>
                  Settle payment · {total}
                </button>
              )}
              {orderStatus !== "completed" && (
                <button type="button" className="btn btn-outline" onClick={handleComplete} disabled={busy}>
                  {markCompleted.isPending ? "Saving…" : "Mark as completed"}
                </button>
              )}

              {confirmClear ? (
                <div className="pay-panel">
                  <p className="order-hint">Only clear it once the guests have left. It becomes available right away.</p>
                  <div className="confirm-row">
                    <button type="button" className="btn btn-outline" onClick={() => setConfirmClear(false)} disabled={busy}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-navy" onClick={handleClear} disabled={busy} autoFocus>
                      {release.isPending ? "Clearing…" : "Yes, clear table"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button" className="btn btn-outline"
                  onClick={() => setConfirmClear(true)} disabled={!isPaid || busy}
                >
                  Clear table
                </button>
              )}
              {!isPaid && <p className="order-hint">Settle payment before clearing the table.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}