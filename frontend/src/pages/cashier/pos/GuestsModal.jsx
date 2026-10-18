import { useId, useState } from "react";
import { useModal } from "../../../hooks/useModal";
import { LIMITS, check, guestsSchema } from "../../../validation/orderSchemas";

export default function GuestsModal({ table, onSubmit, onClose }) {
  useModal(onClose);
  const id = useId();
  const [value, setValue] = useState(String(Math.min(2, table.guest_capacity || 2)));
  const [touched, setTouched] = useState(false);

  const parsed = check(guestsSchema, value);
  const guests = parsed.value;
  const over = guests !== undefined && table.guest_capacity && guests > table.guest_capacity;
  const showError = touched && parsed.error;
  const chips = Array.from({ length: Math.min(Math.max(table.guest_capacity || 4, 4), 8) }, (_, i) => i + 1);

  function step(delta) {
    const n = Number(value) || 0;
    setValue(String(Math.min(LIMITS.guestsMax, Math.max(LIMITS.guestsMin, n + delta))));
    setTouched(true);
  }

  function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (guests !== undefined) onSubmit(guests);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card guests-modal" role="dialog" aria-modal="true" aria-label={`Guests at table ${table.table_number}`} onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Table {table.table_number}</h3>
            <div className="modal-subtitle">Seats {table.guest_capacity}. How many guests?</div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <label className="form-label" htmlFor={id}>Number of guests</label>
        <div className="guests-stepper">
          <button type="button" className="stepper-btn" onClick={() => step(-1)} aria-label="One fewer guest" disabled={!(guests > LIMITS.guestsMin)}>−</button>
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={2}
            value={value}
            onChange={(e) => { setValue(e.target.value.replace(/\D/g, "")); setTouched(true); }}
            aria-invalid={!!showError}
            aria-describedby={`${id}-msg`}
          />
          <button type="button" className="stepper-btn stepper-btn--plus" onClick={() => step(1)} aria-label="One more guest" disabled={guests >= LIMITS.guestsMax}>+</button>
        </div>

        <div className="pay-quick" aria-label="Common group sizes">
          {chips.map((n) => (
            <button key={n} type="button" className={`pay-chip ${guests === n ? "is-on" : ""}`} onClick={() => { setValue(String(n)); setTouched(true); }}>
              {n}
            </button>
          ))}
        </div>

        <div id={`${id}-msg`} aria-live="polite">
          {showError && <p className="field-error">{parsed.error}</p>}
          {!showError && over && <p className="pay-hint">That's more than the table's {table.guest_capacity} seats. You can still continue.</p>}
        </div>

        <div className="confirm-actions">
          <button type="button" className="btn-outline" onClick={onClose}>Back</button>
          <button type="submit" className="btn-solid" disabled={guests === undefined}>Start order</button>
        </div>
      </form>
    </div>
  );
}