// src/pages/cashier/OrdersView.jsx
import { useEffect, useState, useCallback } from "react";
import { fetchOrders } from "../../api/mockCashier";

const STATUS_TABS = ["All", "In Progress", "Ready", "Completed"];

function formatPeso(amount) {
  return "₱" + amount.toFixed(2);
}

export default function OrdersView() {
  const [activeStatus, setActiveStatus] = useState("All");
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await fetchOrders({ status: activeStatus === "All" ? "all" : activeStatus });
      setOrders(data.orders);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [activeStatus]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="orders-header">
        <h2 className="orders-title">Orders</h2>
        <div className="status-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              className={`status-tab ${activeStatus === tab ? "active" : ""}`}
              onClick={() => setActiveStatus(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {status === "loading" && <p className="loading-text">Loading orders…</p>}
      {status === "error" && <p className="error-text">Couldn't load orders. {errorMsg}</p>}
      {status === "ready" && orders.length === 0 && (
        <p className="loading-text">No orders in this status.</p>
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
                  <span className={`badge ${order.status === "Ready" ? "badge-good" : order.status === "Completed" ? "badge-card" : "badge-warn"}`}>
                    {order.status === "Ready" ? "✓ Ready" : order.status}
                  </span>
                  <span className="order-card-subtext">
                    <i className={`status-dot-sm ${order.dotClass}`} /> {order.subtext}
                  </span>
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
            </div>
          ))}
        </div>
      )}
    </>
  );
}