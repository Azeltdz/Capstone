import { ORDER_TYPES } from "../../../constants/orderTypes";

export default function OrderTypeStep({ onSelect }) {
  return (
    <div className="pos-main">
      <h2 className="step-label">Step 1 — Select order type</h2>
      <p className="step-sub">Choose how the customer wants to receive their order</p>

      <div className="order-type-grid">
        {ORDER_TYPES.map(({ type, icon, desc }) => (
          <button key={type} type="button" className="order-type-card" onClick={() => onSelect(type)}>
            <span className="order-type-icon">{icon}</span>
            <span className="order-type-title">{type}</span>
            <span className="order-type-desc">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}