import { useId } from "react";
import { formatPeso } from "../../utils/format";
import { cashSuggestions } from "../../utils/pricing";
import { sanitizeMoneyTyping, validateCash } from "../../validation/orderSchemas";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "gcash", label: "GCash" },
];

export default function PaymentPanel({ total, method, onMethodChange, cashInput, onCashChange, disabled = false, autoFocus = false }) {
  const uid = useId();
  const cashId = `${uid}-cash`;
  const resultId = `${uid}-result`;
  const cash = method === "cash" ? validateCash(cashInput, total) : null;
  const quick = cashSuggestions(total);

  return (
    <div className="pay-form">
      <div className="pay-methods" role="radiogroup" aria-label="Payment method">
        {METHODS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={method === value}
            className={`payment-btn ${method === value ? "selected" : ""}`}
            onClick={() => onMethodChange(value)}
            disabled={disabled}
          >
            {label}
          </button>
        ))}
      </div>

      {method === "cash" && (
        <>
          <label className="form-label" htmlFor={cashId}>Cash received</label>
          <div className={`pay-cash ${cash?.error ? "has-error" : ""}`}>
            <span aria-hidden="true">₱</span>
            <input
              id={cashId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={cashInput}
              onChange={(e) => onCashChange(sanitizeMoneyTyping(e.target.value))}
              disabled={disabled}
              autoFocus={autoFocus}
              aria-invalid={!!cash?.error}
              aria-describedby={resultId}
            />
          </div>

          <div className="pay-quick" aria-label="Quick amounts">
            <button type="button" className="pay-chip" onClick={() => onCashChange(String(total))} disabled={disabled}>
              Exact
            </button>
            {quick.map((v) => (
              <button key={v} type="button" className="pay-chip" onClick={() => onCashChange(String(v))} disabled={disabled}>
                {formatPeso(v)}
              </button>
            ))}
          </div>

          <div id={resultId} className="pay-result" aria-live="polite">
            {cash?.error && <p className="field-error">{cash.error}</p>}
            {cash?.empty && <p className="pay-hint">Type what the customer handed over.</p>}
            {cash?.short !== undefined && (
              <p className="pay-short">Short by <strong>{formatPeso(cash.short)}</strong></p>
            )}
            {cash?.change !== undefined && (
              <p className="pay-change">Change <strong>{formatPeso(cash.change)}</strong></p>
            )}
          </div>
        </>
      )}

      {method === "gcash" && (
        <p className="pay-hint">
          The customer pays exactly {formatPeso(total)} by GCash. Confirm once the transfer shows on your phone.
        </p>
      )}
    </div>
  );
}