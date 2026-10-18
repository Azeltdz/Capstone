import { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { formatPeso } from "../../utils/format";
import { buildPaymentBody, isPaymentReady } from "../../validation/orderSchemas";
import PaymentPanel from "./PaymentPanel";

// "Collect payment" popup: shows the total, takes the method and cash received, prints the change.
export default function PaymentModal({ total, title = "Collect payment", confirmLabel = "Confirm payment", busy = false, error = "", onConfirm, onClose }) {
  const [method, setMethod] = useState("cash");
  const [cashInput, setCashInput] = useState("");
  useModal(() => {
    if (!busy) onClose();
  });

  const ready = isPaymentReady(method, cashInput, total) && !busy;

  function submit(e) {
    e.preventDefault();
    if (ready) onConfirm(buildPaymentBody(method, cashInput, total));
  }

  return (
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <form className="modal-card pay-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close">✕</button>
        </div>

        <div className="pay-total">
          <span>Amount due</span>
          <strong>{formatPeso(total)}</strong>
        </div>

        <PaymentPanel total={total} method={method} onMethodChange={setMethod} cashInput={cashInput} onCashChange={setCashInput} disabled={busy} autoFocus />

        {error && <p className="error-text" role="alert">{error}</p>}

        <div className="confirm-actions">
          <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>Back</button>
          <button type="submit" className="btn-solid" disabled={!ready}>
            {busy ? "Saving…" : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}