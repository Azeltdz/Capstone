import { useState } from "react";
import { useModal } from "../../../hooks/useModal";

const MIN_GUESTS = 1;
const MAX_GUESTS = 20;
const QUICK_PICKS = [1, 2, 3, 4, 5, 6];

export default function GuestsModal({ table, initial = MIN_GUESTS, onSubmit, onClose }) {
  const [guests, setGuests] = useState(initial);
  const overCapacity = table.guest_capacity && guests > table.guest_capacity;

  useModal(onClose);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(guests);
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="guests-title">
        <div className="modal-header">
          <div>
            <h3 id="guests-title">Table {table.table_number}</h3>
            {table.guest_capacity ? <span className="order-id">Seats {table.guest_capacity}</span> : null}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-field">
            <span className="form-label" id="guest-label">How many guests?</span>
            <div className="guest-stepper" role="group" aria-labelledby="guest-label">
              <button
                type="button" className="guest-btn" aria-label="Remove one guest"
                onClick={() => setGuests((g) => Math.max(MIN_GUESTS, g - 1))} disabled={guests <= MIN_GUESTS}
              >−</button>
              <span className="guest-count" aria-live="polite">
                {guests} {guests === 1 ? "Person" : "People"}
              </span>
              <button
                type="button" className="guest-btn" aria-label="Add one guest"
                onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))} disabled={guests >= MAX_GUESTS}
              >+</button>
            </div>

            <div className="guest-chips" role="group" aria-label="Quick pick">
              {QUICK_PICKS.map((n) => (
                <button
                  key={n} type="button"
                  className={`guest-chip ${guests === n ? "is-active" : ""}`}
                  aria-pressed={guests === n}
                  onClick={() => setGuests(n)}
                >{n}</button>
              ))}
            </div>

            {overCapacity && (
              <p className="order-hint order-hint--warn" role="status">
                This table seats {table.guest_capacity}. Continue only if you're joining tables.
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-navy modal-submit" autoFocus>
            Continue to menu
          </button>
        </form>
      </div>
    </div>
  );
}