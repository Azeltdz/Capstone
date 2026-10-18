import { useId, useMemo, useState } from "react";
import MenuImage from "../../../components/MenuImage";
import { formatPeso } from "../../../utils/format";
import { calcOrderTotals } from "../../../utils/pricing";
import { LIMITS } from "../../../validation/orderSchemas";

const TYPE_META = {
  "dine-in": { icon: "🍽️", label: "Dine-in" },
  "take-out": { icon: "🥡", label: "Take-out" },
  delivery: { icon: "🛵", label: "Delivery" },
};

const cleanText = (s) => s.replace(/[\u0000-\u001F\u007F<>]/g, "");
const cleanId = (s) => s.replace(/[^A-Za-z0-9\-/ ]/g, "");

function CartLine({ line, pwdOn, onQtyChange, onNoteChange, onTogglePwd }) {
  const [noteOpen, setNoteOpen] = useState(Boolean(line.note));
  const noteId = useId();
  return (
    <div className="order-line">
      <div className="order-line-info">
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <MenuImage variant="thumb" url={line.image_url} category={line.category} />
          <span className="order-line-name">{line.name}</span>
        </span>
        <span className="order-line-qty">x{line.qty}</span>
      </div>

      <div className="order-line-footer">
        <div className="order-line-actions">
          <button type="button" className="order-line-add" onClick={() => onQtyChange(line, line.qty + 1)} disabled={line.qty >= 99} aria-label={`Add one ${line.name}`}>＋</button>
          <button type="button" className="order-line-minus" onClick={() => onQtyChange(line, line.qty - 1)} disabled={line.qty <= 1} aria-label={`Remove one ${line.name}`}>－</button>
          <button type="button" className="order-line-remove" onClick={() => onQtyChange(line, 0)} aria-label={`Delete ${line.name}`}>🗑</button>
        </div>
        <span className="order-line-price">{formatPeso(line.price * line.qty)}</span>
      </div>

      <div className="order-line-extras">
        {!noteOpen ? (
          <button type="button" className="btn-text" onClick={() => setNoteOpen(true)}>＋ Add note</button>
        ) : (
          <div className="line-note">
            <label className="sr-only" htmlFor={noteId}>Note for {line.name}</label>
            <input
              id={noteId}
              type="text"
              className="form-input"
              placeholder="e.g. leg part, no onions"
              maxLength={LIMITS.note}
              value={line.note ?? ""}
              onChange={(e) => onNoteChange(line.id, cleanText(e.target.value))}
              autoComplete="off"
            />
            <span className="line-note-count" aria-hidden="true">{(line.note ?? "").length}/{LIMITS.note}</span>
          </div>
        )}
        {pwdOn && (
          <label className="line-pwd">
            <input type="checkbox" checked={Boolean(line.pwd)} onChange={() => onTogglePwd(line.id)} />
            PWD
          </label>
        )}
      </div>
    </div>
  );
}

export default function CartPanel({
  orderLabel, mode, table, guests, cart, onQtyChange, onNoteChange, onTogglePwd,
  customerName, onCustomerName, pwd, onPwdChange, payTiming, onPayTimingChange,
  errors, submitted, onSubmit, onCancel, isPlacing,
}) {
  const nameId = useId();
  const pwdNameId = useId();
  const pwdIdId = useId();
  const lines = Object.values(cart);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const totals = useMemo(
    () => calcOrderTotals(lines.map((l) => ({ price: l.price, qty: l.qty, pwd: pwd.enabled && l.pwd }))),
    [lines, pwd.enabled]
  );
  const meta = TYPE_META[mode] ?? TYPE_META["take-out"];
  const hasPwdDiscount = totals.pwdDiscount > 0;
  const payNow = payTiming === "now";

  return (
    <aside className="order-panel" aria-label="Current order">
      <div className="order-panel-scroll">
      <div className="order-panel-header">
        <h3>Current Order</h3>
        <span className="order-id">{orderLabel}</span>
      </div>

      {/* Read-only: to change these, use Back on the menu. */}
      <dl className="cart-meta">
        <div><dt>Order type</dt><dd><span aria-hidden="true">{meta.icon}</span> {meta.label}</dd></div>
        {mode === "dine-in" && table && (
          <>
            <div><dt>Table</dt><dd>Table {table.table_number}</dd></div>
            <div><dt>Guests</dt><dd>{guests} {guests === 1 ? "guest" : "guests"}</dd></div>
          </>
        )}
      </dl>

      <div className="form-field cart-field">
        <label className="form-label" htmlFor={nameId}>Customer name <span className="optional">(optional)</span></label>
        <input
          id={nameId}
          type="text"
          className="form-input"
          maxLength={LIMITS.customerName}
          value={customerName}
          onChange={(e) => onCustomerName(cleanText(e.target.value))}
          autoComplete="off"
          aria-invalid={!!errors.customerName}
        />
        {errors.customerName && <p className="field-error">{errors.customerName}</p>}
      </div>

      {lines.length === 0 ? (
        <p className="order-panel-placeholder">No items added yet — select items from the menu.</p>
      ) : (
        <div className="order-lines">
          {lines.map((line) => (
            <CartLine key={line.id} line={line} pwdOn={pwd.enabled} onQtyChange={onQtyChange} onNoteChange={onNoteChange} onTogglePwd={onTogglePwd} />
          ))}
        </div>
      )}
      {submitted && errors.lineCount && <p className="field-error">{errors.lineCount}</p>}

      {lines.length > 0 && (
        <div className="pwd-box">
          <label className="pwd-toggle">
            <input type="checkbox" checked={pwd.enabled} onChange={(e) => onPwdChange({ enabled: e.target.checked })} />
            <span>PWD discount <small>(20% off, VAT-exempt)</small></span>
          </label>
          {pwd.enabled && (
            <>
              <p className="pay-hint">Untick any shared dish the PWD isn't eating. Only ticked items get the discount.</p>
              {submitted && errors.pwdItems && <p className="field-error">{errors.pwdItems}</p>}
              <div className="pwd-fields">
                <div className="form-field">
                  <label className="form-label" htmlFor={pwdNameId}>PWD name <span className="optional">(optional)</span></label>
                  <input id={pwdNameId} type="text" className="form-input" maxLength={LIMITS.pwdName} value={pwd.name} onChange={(e) => onPwdChange({ name: cleanText(e.target.value) })} autoComplete="off" aria-invalid={!!errors.pwdName} />
                  {errors.pwdName && <p className="field-error">{errors.pwdName}</p>}
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor={pwdIdId}>PWD ID number <span className="optional">(optional)</span></label>
                  <input id={pwdIdId} type="text" className="form-input" maxLength={LIMITS.pwdId} value={pwd.id} onChange={(e) => onPwdChange({ id: cleanId(e.target.value) })} autoComplete="off" aria-invalid={!!errors.pwdId} />
                  {errors.pwdId && <p className="field-error">{errors.pwdId}</p>}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="order-panel-footer"></div>
      <div className="order-summary">
        {hasPwdDiscount && (
          <>
            <div className="order-summary-row"><span>Subtotal (VAT incl.)</span><span>{formatPeso(totals.subtotal)}</span></div>
            <div className="order-summary-row"><span>Less VAT exemption</span><span>−{formatPeso(totals.vatExemption)}</span></div>
            <div className="order-summary-row"><span>Less PWD discount (20%)</span><span>−{formatPeso(totals.pwdDiscount)}</span></div>
          </>
        )}
        <div className="order-summary-row order-summary-total">
          <span>Total ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
          <span>{formatPeso(totals.total)}</span>
        </div>
        {totals.vatAmount > 0 && <div className="order-summary-row"><span>VAT 12% included</span><span>{formatPeso(totals.vatAmount)}</span></div>}
      </div>

      <div className="pay-timing" role="radiogroup" aria-label="When will the customer pay?">
        <button type="button" role="radio" aria-checked={payNow} className={`payment-btn ${payNow ? "selected" : ""}`} onClick={() => onPayTimingChange("now")}>Pay now</button>
        <button type="button" role="radio" aria-checked={!payNow} className={`payment-btn ${!payNow ? "selected" : ""}`} onClick={() => onPayTimingChange("later")}>Pay later</button>
      </div>
      {!payNow && <p className="pay-hint">The bill stays unpaid. Settle it from the Tables or Orders screen after the meal.</p>}

      <div className="order-actions">
        <button type="button" className="btn btn-navy" onClick={onSubmit} disabled={lines.length === 0 || isPlacing}>
          {isPlacing ? "Placing…" : payNow ? `Charge ${formatPeso(totals.total)}` : "Place order · pay later"}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={lines.length === 0 || isPlacing}>Cancel Order</button>
      </div>
      </div>
    </aside>
  );
}