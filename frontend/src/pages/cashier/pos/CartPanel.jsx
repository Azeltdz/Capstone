import { useMemo, useState } from "react";
import { Bike, ShoppingBag, StickyNote, UtensilsCrossed } from "lucide-react";
import MenuImage from "../../../components/MenuImage";
import { calcOrderTotals, PWD_DISCOUNT_RATE, VAT_RATE } from "../../../utils/pricing";
import { formatPeso } from "../../../utils/format";
import { ORDER_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS } from "../../../utils/orderStatus";

const TYPE_ICONS = { "dine-in": UtensilsCrossed, "take-out": ShoppingBag, delivery: Bike };
const MAX_NOTE = 120;
const pct = (rate) => Math.round(rate * 100);

/** Per-item request (e.g. "Leg part") + the line's PWD checkbox. */
function LineExtras({ line, pwdEnabled, onNoteChange, onTogglePwd }) {
  const [open, setOpen] = useState(false);
  const showInput = open || !!line.note;

  return (
    <div className="order-line-extras">
      {showInput ? (
        <input
          className="line-note-input"
          type="text"
          autoFocus={open}
          maxLength={MAX_NOTE}
          value={line.note ?? ""}
          placeholder="e.g. Leg part, no onions"
          aria-label={`Note for ${line.name}`}
          onChange={(e) => onNoteChange(line.id, e.target.value)}
          onBlur={() => {
            if (!line.note?.trim()) {
              onNoteChange(line.id, "");
              setOpen(false);
            }
          }}
        />
      ) : (
        <button type="button" className="line-note-btn" onClick={() => setOpen(true)}>
          <StickyNote size={14} aria-hidden="true" /> Add note
        </button>
      )}

      {pwdEnabled && (
        <label className="line-pwd">
          <input type="checkbox" checked={line.pwd !== false} onChange={() => onTogglePwd(line.id)} />
          PWD
        </label>
      )}
    </div>
  );
}

export default function CartPanel({
  orderLabel, orderType, onOrderTypeChange, table, guests, onChangeTable,
  customerName, nameRequired, onCustomerNameChange,
  cart, onQtyChange, onNoteChange, onTogglePwdLine,
  pwd, onPwdChange,
  payNow, onPayNowChange, paymentMethod, onSelectPayment,
  blockers, onPlaceOrder, onCancel, isPlacing,
}) {
  const lines = useMemo(() => Object.values(cart), [cart]);
  const totals = useMemo(() => calcOrderTotals(lines, { pwdEnabled: pwd.enabled }), [lines, pwd.enabled]);
  const canPlaceOrder = blockers.length === 0 && !isPlacing;

  return (
    <aside className="order-panel" aria-label="Current order">
      <div className="order-panel-scroll">
        <div className="order-panel-header">
          <h3>Current Order</h3>
          <span className="order-id">{orderLabel}</span>
        </div>

        {/* Order type */}
        <div className="segmented" role="radiogroup" aria-label="Order type">
          {ORDER_TYPE_OPTIONS.map(({ value, label }) => {
            const Icon = TYPE_ICONS[value];
            const active = orderType === value;
            return (
              <button
                key={value} type="button" role="radio" aria-checked={active}
                className={`segmented-btn ${active ? "is-active" : ""}`}
                onClick={() => onOrderTypeChange(value)}
              >
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            );
          })}
        </div>

        {/* Table + guests (dine-in only) */}
        {orderType === "dine-in" && (
          <div className={`order-context ${table ? "" : "is-empty"}`}>
            {table ? (
              <>
                <span>
                  <strong>Table {table.table_number}</strong> · {guests} {guests === 1 ? "guest" : "guests"}
                </span>
                <button type="button" className="link-btn" onClick={onChangeTable}>Change</button>
              </>
            ) : (
              <>
                <span>No table selected</span>
                <button type="button" className="link-btn" onClick={onChangeTable}>Select table</button>
              </>
            )}
          </div>
        )}

        {/* Customer name */}
        <div className="form-field">
          <label className="form-label" htmlFor="cart-customer-name">
            Customer name{!nameRequired && <span className="optional"> (optional)</span>}
          </label>
          <input
            id="cart-customer-name" className="form-input" type="text" autoComplete="off"
            maxLength={100} value={customerName} placeholder="Enter customer name"
            onChange={(e) => onCustomerNameChange(e.target.value)}
          />
        </div>

        {/* Items */}
        {lines.length === 0 ? (
          <p className="order-panel-placeholder">
            {orderType === "dine-in" && !table
              ? "Select a table or choose Take-out / Delivery to begin."
              : "No items added yet — select items from the menu."}
          </p>
        ) : (
          <div className="order-lines">
            {lines.map((line) => (
              <div className="order-line" key={line.id}>
                <div className="order-line-info">
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <MenuImage variant="thumb" url={line.image_url} category={line.category} />
                    <span className="order-line-name">{line.name}</span>
                  </span>
                  <span className="order-line-qty">×{line.qty}</span>
                </div>
                <div className="order-line-footer">
                  <div className="order-line-actions">
                    <button type="button" className="order-line-add" onClick={() => onQtyChange(line, line.qty + 1)} aria-label={`Add one ${line.name}`}>＋</button>
                    <button type="button" className="order-line-minus" onClick={() => onQtyChange(line, line.qty - 1)} disabled={line.qty <= 1} aria-label={`Remove one ${line.name}`}>－</button>
                    <button type="button" className="order-line-remove" onClick={() => onQtyChange(line, 0)} aria-label={`Delete ${line.name}`}>🗑</button>
                  </div>
                  <span className="order-line-price">{formatPeso(line.price * line.qty)}</span>
                </div>
                <LineExtras
                  line={line} pwdEnabled={pwd.enabled}
                  onNoteChange={onNoteChange} onTogglePwd={onTogglePwdLine}
                />
              </div>
            ))}
          </div>
        )}

        {/* PWD discount */}
        {lines.length > 0 && (
          <div className="pwd-box">
            <label className="switch-row">
              <input
                type="checkbox" role="switch" checked={pwd.enabled}
                onChange={(e) => onPwdChange({ enabled: e.target.checked })}
              />
              <span>
                PWD discount <small>{pct(PWD_DISCOUNT_RATE)}% off · VAT-exempt</small>
              </span>
            </label>
            {pwd.enabled && (
              <div className="pwd-fields">
                <input
                  className="form-input" type="text" maxLength={100} autoComplete="off"
                  aria-label="PWD full name" placeholder="PWD full name"
                  value={pwd.name} onChange={(e) => onPwdChange({ name: e.target.value })}
                />
                <input
                  className="form-input" type="text" maxLength={50} autoComplete="off"
                  aria-label="PWD ID number" placeholder="PWD ID number"
                  value={pwd.idNumber} onChange={(e) => onPwdChange({ idNumber: e.target.value })}
                />
                <p className="order-hint">
                  Applies to items ticked “PWD” above. Untick dishes the PWD isn't eating.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="order-panel-footer">
        <div className="order-summary">
          <div className="order-summary-row">
            <span>Subtotal (VAT incl.)</span>
            <span>{formatPeso(totals.subtotal)}</span>
          </div>
          {pwd.enabled && totals.pwdDiscount > 0 && (
            <>
              <div className="order-summary-row">
                <span>VAT exemption (PWD)</span>
                <span>−{formatPeso(totals.vatExemption)}</span>
              </div>
              <div className="order-summary-row">
                <span>PWD discount ({pct(PWD_DISCOUNT_RATE)}%)</span>
                <span>−{formatPeso(totals.pwdDiscount)}</span>
              </div>
            </>
          )}
          <div className="order-summary-row order-summary-total">
            <span>Total ({totals.itemCount} items)</span>
            <span>{formatPeso(totals.total)}</span>
          </div>
          <div className="order-summary-row order-summary-note">
            <span>VAT {pct(VAT_RATE)}% included</span>
            <span>{formatPeso(totals.vatAmount)}</span>
          </div>
        </div>

        {/* Payment timing */}
        <div className="segmented segmented--sm" role="radiogroup" aria-label="Payment timing">
          <button
            type="button" role="radio" aria-checked={payNow}
            className={`segmented-btn ${payNow ? "is-active" : ""}`} onClick={() => onPayNowChange(true)}
          >Pay now</button>
          <button
            type="button" role="radio" aria-checked={!payNow}
            className={`segmented-btn ${!payNow ? "is-active" : ""}`} onClick={() => onPayNowChange(false)}
          >Pay later</button>
        </div>

        {payNow ? (
          <div className="payment-row">
            {PAYMENT_METHOD_OPTIONS.map(({ value, label }) => (
              <button
                key={value} type="button"
                className={`payment-btn ${paymentMethod === value ? "selected" : ""}`}
                onClick={() => onSelectPayment(value)} aria-pressed={paymentMethod === value}
              >{label}</button>
            ))}
          </div>
        ) : (
          <p className="order-hint">
            Saved as <strong>Unpaid</strong>. Settle it from the Tables page when the customer pays.
          </p>
        )}

        {blockers.length > 0 && (
          <p className="order-hint order-hint--warn" role="status">{blockers.join(" · ")}</p>
        )}

        <div className="order-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={lines.length === 0 || isPlacing}>
            Cancel Order
          </button>
          <button type="button" className="btn btn-navy" onClick={onPlaceOrder} disabled={!canPlaceOrder}>
            {isPlacing
              ? "Placing…"
              : payNow
                ? `Place order · ${formatPeso(totals.total)}`
                : "Place order · Pay later"}
          </button>
        </div>
      </div>
    </aside>
  );
}