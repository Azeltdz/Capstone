// src/pages/cashier/OrdersView.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useOrders, useOrder } from "../../hooks/useOrders";
import { useSettleOrder } from "../../hooks/useOrderActions";
import StatusBadge from "../../components/StatusBadge";
import { useDebounce } from "../../hooks/useDebounce";
import PrintReceiptButton from "../../components/receipt/PrintReceiptButton";
import { manilaToday, paymentLabel } from "../../utils/format";
import { PAYMENT_METHOD_OPTIONS } from "../../utils/orderStatus";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "dine-in", label: "Dine-in" },
  { value: "take-out", label: "Take-out" },
  { value: "delivery", label: "Delivery" },
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "cash", label: "Cash" },
  { value: "gcash", label: "GCash" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Paid & Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];

function badgeClassForType(type) {
  if (type === "dine-in") return "badge-dinein";
  if (type === "take-out") return "badge-takeout";
  if (type === "delivery") return "badge-delivery";
  return "";
}

function typeLabel(type) {
  return TYPE_OPTIONS.find((t) => t.value === type)?.label || type;
}

function formatPeso(amount) {
  return "₱" + Number(amount).toFixed(2);
}

function initialsFor(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function guestsLabel(count) {
  return `${count} ${count === 1 ? "guest" : "guests"}`;
}

function orderLabelFor(order) {
  const base =
    order.order_type === "dine-in" && order.table_number
      ? `Dine-in · Table ${order.table_number}`
      : typeLabel(order.order_type);
  return order.guest_count ? `${base} · ${guestsLabel(order.guest_count)}` : base;
}

function SettleBox({ order }) {
  const settle = useSettleOrder();
  const [method, setMethod] = useState(null);
  const [error, setError] = useState("");

  async function confirm() {
    setError("");
    try {
      await settle.mutateAsync({ orderId: order.transaction_id, payment_method: method });
      toast.success("Payment received");
    } catch (err) {
      setError(err.message || "Couldn't record the payment. Please try again.");
    }
  }

  return (
    <div className="pay-panel" style={{ margin: "0.75rem 0" }}>
      <span className="form-label">Settle payment · {formatPeso(order.total_amount)}</span>
      <div className="payment-row">
        {PAYMENT_METHOD_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`payment-btn ${method === value ? "selected" : ""}`}
            aria-pressed={method === value}
            onClick={() => setMethod(value)}
            disabled={settle.isPending}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="button" className="btn btn-navy" onClick={confirm} disabled={!method || settle.isPending}>
        {settle.isPending ? "Saving…" : "Confirm payment"}
      </button>
    </div>
  );
}

function OrderDetailsModal({ orderId, onClose }) {
  const closeBtnRef = useRef(null);
  const { data: order, isLoading, error } = useOrder(orderId);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title" id="order-modal-title">Order Details</h3>
            <span className="modal-subtitle">#TXN-{String(orderId).padStart(4, "0")}</span>
          </div>
          <button ref={closeBtnRef} className="modal-close" onClick={onClose} aria-label="Close order details">
            ✕
          </button>
        </div>

        {isLoading && <p className="loading-text">Loading order…</p>}
        {error && <p className="error-text">Couldn't load order. {error.message}</p>}

        {order && (
          <>
            <div className="modal-customer">
              <span className="order-card-avatar">
                {order.customer_name ? initialsFor(order.customer_name) : "—"}
              </span>
              <div className="order-card-identity">
                <span className="order-card-customer">{order.customer_name || "No customer name"}</span>
                <span className="order-card-label">{orderLabelFor(order)}</span>
              </div>
            </div>

            <dl className="modal-grid">
              <div>
                <dt>Order type</dt>
                <dd><span className={`badge ${badgeClassForType(order.order_type)}`}>{typeLabel(order.order_type)}</span></dd>
              </div>
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
              {order.table_number && (
                <div>
                  <dt>Table</dt>
                  <dd>Table {order.table_number}</dd>
                </div>
              )}
              {order.guest_count && (
                <div>
                  <dt>Guests</dt>
                  <dd>{guestsLabel(order.guest_count)}</dd>
                </div>
              )}
              <div>
                <dt>Cashier</dt>
                <dd>{order.cashier_name}</dd>
              </div>
              <div>
                <dt>Date &amp; time</dt>
                <dd>{format(new Date(order.transaction_at), "MMMM d, yyyy h:mm a")}</dd>
              </div>
            </dl>

            <div className="modal-items">
              <div className="modal-items-head">
                <span>Item</span>
                <span>Qty</span>
              </div>
              {order.items.map((it) => (
                <div className="modal-items-row" key={it.tx_item_id}>
                  <span>
                    {it.item_name}
                    {it.note && <em className="receipt-item-note">Note: {it.note}</em>}
                  </span>
                  <span>x{it.quantity}</span>
                </div>
              ))}
            </div>

            {Number(order.pwd_discount) > 0 && (
              <dl className="modal-grid">
                <div><dt>PWD</dt><dd>{order.pwd_name} · ID {order.pwd_id_number}</dd></div>
                <div><dt>PWD discount (20%)</dt><dd>-{formatPeso(order.pwd_discount)}</dd></div>
              </dl>
            )}

            <div className="modal-total">
              <span>{order.items.reduce((sum, i) => sum + i.quantity, 0)} Items · Total</span>
              <span>{formatPeso(order.total_amount)}</span>
            </div>
            {order.vat_amount != null && (
              <p className="order-hint">VAT 12% included: {formatPeso(order.vat_amount)}</p>
            )}

            {order.payment_status === "unpaid" && <SettleBox order={order} />}
          </>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <PrintReceiptButton orderId={orderId} copy />
          <button className="modal-done" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersView() {
  const [activeType, setActiveType] = useState("all");
  const [activePayment, setActivePayment] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [date, setDate] = useState(() => manilaToday());

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const closeModal = useCallback(() => setSelectedOrderId(null), []);

  const { data: orders, isLoading, error } = useOrders({
    order_type: activeType === "all" ? undefined : activeType,
    payment_status: activeStatus === "all" ? undefined : activeStatus,
    date: activeStatus === "unpaid" ? undefined : date,
  });
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => activePayment === "all" || o.payment_method === activePayment);
  }, [orders, activePayment]);

  return (
    <>
      <div className="orders-header">
        <h2 className="orders-title">Orders</h2>

        <div className="orders-header-controls">
          <input
            type="date"
            className="date-select"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Filter by date"
            disabled={activeStatus === "unpaid"}
          />

          <select className="type-select" value={activeType} onChange={(e) => setActiveType(e.target.value)} aria-label="Filter by order type">
            {TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <select className="type-select" value={activeStatus} onChange={(e) => setActiveStatus(e.target.value)} aria-label="Filter by payment status">
            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <select className="type-select" value={activePayment} onChange={(e) => setActivePayment(e.target.value)} aria-label="Filter by payment method">
            {PAYMENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search customer name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {isLoading && <p className="loading-text">Loading orders…</p>}
      {error && <p className="error-text">Couldn't load orders. {error.message}</p>}
      {!isLoading && !error && filteredOrders.length === 0 && (
        <p className="loading-text">No orders match your filters.</p>
      )}

      {!isLoading && !error && filteredOrders.length > 0 && (
        <div className="order-card-grid">
          {filteredOrders.map((order) => (
            <div className="order-card" key={order.transaction_id}>
              <div className="order-card-top">
                <span className="order-card-avatar">
                  {order.customer_name ? initialsFor(order.customer_name) : "—"}
                </span>
                <div className="order-card-identity">
                  <span className="order-card-customer">{order.customer_name || "No customer name"}</span>
                  <span className="order-card-label">{orderLabelFor(order)}</span>
                </div>
                <div className="order-card-status">
                  <span className={`badge ${badgeClassForType(order.order_type)}`}>{typeLabel(order.order_type)}</span>
                  <StatusBadge kind="payment" value={order.payment_status} />
                  <span className="order-card-subtext">{order.payment_method ? paymentLabel(order.payment_method) : "Pay later"}</span>
                </div>
              </div>

              <div className="order-card-meta">
                <span>{format(new Date(order.transaction_at), "MMM d, yyyy h:mm a")}</span>
                <span>#TXN-{String(order.transaction_id).padStart(4, "0")}</span>
              </div>

              <div className="order-card-divider" />

              <div className="order-card-total">
                <span>Total</span>
                <span>{formatPeso(order.total_amount)}</span>
              </div>

              <button className="order-card-view" onClick={() => setSelectedOrderId(order.transaction_id)}>
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedOrderId && <OrderDetailsModal orderId={selectedOrderId} onClose={closeModal} />}
    </>
  );
}