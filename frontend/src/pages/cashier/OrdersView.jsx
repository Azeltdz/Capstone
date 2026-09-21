// src/pages/cashier/OrdersView.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { fetchOrders } from "../../api/mockCashier";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "Dine-in", label: "Dine-in" },
  { value: "Take-out", label: "Take-out" },
  { value: "Delivery", label: "Delivery" },
];

function badgeClassForType(type) {
  if (type === "Dine-in") return "badge-dinein";
  if (type === "Take-out") return "badge-takeout";
  if (type === "Delivery") return "badge-delivery";
  return "";
}

function formatPeso(amount) {
  return "₱" + amount.toFixed(2);
}

// "Lomi Special ×2, Chopsuey ×1" -> [{ name: "Lomi Special", qty: "2" }, ...]
function parseItems(itemsString = "") {
  return itemsString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, qty] = part.split("×").map((p) => p.trim());
      return { name, qty: qty || "1" };
    });
}

function OrderDetailsModal({ order, onClose }) {
  const closeBtnRef = useRef(null);

  // Close on Escape, lock background scroll, focus the close button.
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

  const items = parseItems(order.items);

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
            <h3 className="modal-title" id="order-modal-title">
              Order Details
            </h3>
            <span className="modal-subtitle">{order.id}</span>
          </div>
          <button
            ref={closeBtnRef}
            className="modal-close"
            onClick={onClose}
            aria-label="Close order details"
          >
            ✕
          </button>
        </div>

        <div className="modal-customer">
          <span className="order-card-avatar">{order.initials}</span>
          <div className="order-card-identity">
            <span className="order-card-customer">{order.customer}</span>
            <span className="order-card-label">{order.orderLabel}</span>
          </div>
        </div>

        <dl className="modal-grid">
          <div>
            <dt>Order type</dt>
            <dd>
              <span className={`badge ${badgeClassForType(order.type)}`}>{order.type}</span>
            </dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>{order.payment}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`status-dot ${order.dotClass}`} /> {order.status}
              <span className="modal-muted"> · {order.subtext}</span>
            </dd>
          </div>
          <div>
            <dt>Date &amp; time</dt>
            <dd>{order.date}</dd>
          </div>
        </dl>

        <div className="modal-items">
          <div className="modal-items-head">
            <span>Item</span>
            <span>Qty</span>
          </div>
          {items.map((it, i) => (
            <div className="modal-items-row" key={i}>
              <span>{it.name}</span>
              <span>×{it.qty}</span>
            </div>
          ))}
        </div>

        <div className="modal-total">
          <span>{order.itemCount} Items · Total</span>
          <span>{formatPeso(order.total)}</span>
        </div>

        <button className="modal-done" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default function OrdersView() {
  const [activeType, setActiveType] = useState("all");
  const [activePayment, setActivePayment] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const closeModal = useCallback(() => setSelectedOrder(null), []);

  // Debounce the customer-name search, same pattern used elsewhere in the app.
  const debounceTimer = useRef(null);
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  // Guards against a slower, older request (e.g. from a filter click that's
  // since been superseded by another) resolving AFTER a newer one and
  // overwriting it with stale data. Real risk here since two filters
  // (type + payment) can each trigger a fetch in quick succession.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setStatus("loading");
    try {
      const data = await fetchOrders({
        type: activeType,
        payment: activePayment === "All" ? "all" : activePayment,
        search,
      });
      if (requestId !== requestIdRef.current) return; // a newer request has since started — ignore this one
      setOrders(data.orders);
      setStatus("ready");
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [activeType, activePayment, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="orders-header">
        <h2 className="orders-title">Orders</h2>

        <div className="orders-header-controls">
          <select
            className="type-select"
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            aria-label="Filter by order type"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
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

      {status === "loading" && <p className="loading-text">Loading orders…</p>}
      {status === "error" && <p className="error-text">Couldn't load orders. {errorMsg}</p>}
      {status === "ready" && orders.length === 0 && (
        <p className="loading-text">No orders match your filters.</p>
      )}

      {status === "ready" && orders.length > 0 && (
        <div className="order-card-grid">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-card-top">
                <span className="order-card-avatar">{order.initials}</span>
                <div className="order-card-identity">
                  <span className="order-card-customer">{order.customer}</span>
                  <span className="order-card-label">{order.orderLabel}</span>
                </div>
                <div className="order-card-status">
                  <span className={`badge ${badgeClassForType(order.type)}`}>{order.type}</span>
                  <span className="order-card-subtext">{order.payment}</span>
                </div>
              </div>

              <div className="order-card-meta">
                <span>{order.date}</span>
                <span>{order.itemCount} Items</span>
              </div>

              <div className="order-card-divider" />

              <div className="order-card-total">
                <span>Total</span>
                <span>{formatPeso(order.total)}</span>
              </div>

              <button className="order-card-view" onClick={() => setSelectedOrder(order)}>
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={closeModal} />}
    </>
  );
}