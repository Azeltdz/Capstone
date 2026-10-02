const PAYMENT_METHODS = ["Cash", "GCash"];

export default function CartPanel({
  orderId, step, orderType, customer, table, cart, onQtyChange,
  paymentMethod, onSelectPayment, onPlaceOrder, onCancel, isPlacing,
}) {
  const lines = Object.values(cart);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
  const total = lines.reduce((sum, l) => sum + l.qty * l.price, 0);

  const orderLabel = orderType === "Dine-in" && table ? `Dine-in · Table ${table.table_number}` : orderType;
  const canPlaceOrder = lines.length > 0 && paymentMethod !== null && !isPlacing;

  const showCustomer = orderType === "Dine-in" && customer && (step === "table" || step === "menu");

  return (
    <aside className="order-panel">
      <div className="order-panel-header">
        <h3>Current Order</h3>
        <span className="order-id">{orderId}</span>
      </div>

      {showCustomer && (
        <div className="order-customer">
          <span className="order-customer-name">👤 {customer.name}</span>
          <span className="order-customer-guests">
            {customer.guests} {customer.guests === 1 ? "guest" : "guests"}
          </span>
        </div>
      )}

      {!orderType && (
        <>
          <div className="order-status">
            <span className="status-dot" />
            <span>No order type selected</span>
          </div>
          <p className="order-panel-placeholder">Select order type to begin</p>
        </>
      )}

      {orderType && step === "table" && (
        <>
          <div className="order-status filled">
            <span className="status-dot" />
            <span>Dine-in order selected</span>
          </div>
          <p className="order-panel-placeholder">Choose a table to continue</p>
        </>
      )}

      {orderType && step === "menu" && (
        <>
          <div className="order-status filled">
            <span className="status-dot" />
            <span>{orderLabel}</span>
          </div>

          {lines.length === 0 ? (
            <p className="order-panel-placeholder">No items added yet — select items from the menu.</p>
          ) : (
            <div className="order-lines">
              {lines.map((line) => (
                <div className="order-line" key={line.id}>
                  <div className="order-line-info">
                    <span className="order-line-name">{line.name}</span>
                    <span className="order-line-qty">×{line.qty}</span>
                  </div>
                  <div className="order-line-footer">
                    <div className="order-line-actions">
                      <button className="order-line-add" onClick={() => onQtyChange(line, line.qty + 1)} aria-label={`Add one ${line.name}`}>＋</button>
                      <button className="order-line-minus" onClick={() => onQtyChange(line, line.qty - 1)} disabled={line.qty <= 1} aria-label={`Remove one ${line.name}`}>－</button>
                      <button className="order-line-remove" onClick={() => onQtyChange(line, 0)} aria-label={`Delete ${line.name}`}>🗑</button>
                    </div>
                    <span className="order-line-price">₱{(line.price * line.qty).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="order-summary">
            <div className="order-summary-row order-summary-total">
              <span>Total ({itemCount} items)</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-row">
            {PAYMENT_METHODS.map((method) => (
              <button key={method} className={`payment-btn ${paymentMethod === method ? "selected" : ""}`} onClick={() => onSelectPayment(method)} aria-pressed={paymentMethod === method}>
                {method}
              </button>
            ))}
          </div>

          <div className="order-actions">
            <button type="button" className="btn btn-outline" onClick={onCancel} disabled={lines.length === 0 || isPlacing}>
              Cancel Order
            </button>
            <button type="button" className="btn btn-navy" onClick={onPlaceOrder} disabled={!canPlaceOrder}>
              {isPlacing ? "Placing…" : "Place Order"}
            </button>
          </div>
        </>
      )}
    </aside>
  );
}