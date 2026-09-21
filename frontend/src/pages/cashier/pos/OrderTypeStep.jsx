// src/pages/cashier/pos/OrderTypeStep.jsx
import { useEffect, useState } from "react";
import { getOrderTypes } from "../../../api/mockCashier";

export default function OrderTypeStep({ onSelect }) {
  const [orderTypes, setOrderTypes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getOrderTypes()
      .then((data) => !cancelled && setOrderTypes(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pos-main">
      <h2 className="step-label">Step 1 — Select order type</h2>
      <p className="step-sub">Choose how the customer wants to receive their order</p>

      <div className="order-type-grid">
        {error && <p className="error-text">Couldn't load order types. {error}</p>}
        {!error && !orderTypes && <p className="loading-text">Loading order types…</p>}
        {orderTypes &&
          orderTypes.map(({ type, icon, desc }) => (
            <button key={type} className="order-type-card" onClick={() => onSelect(type)}>
              <span className="order-type-icon">{icon}</span>
              <span className="order-type-title">{type}</span>
              <span className="order-type-desc">{desc}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
