import { useRef, useState } from "react";
import { useModal } from "../../../hooks/useModal";

const MIN_GUESTS = 1;
const MAX_GUESTS = 20;
const MAX_NAME = 100;

export default function DineInDetailsModal({ onSubmit, onClose }) {
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(MIN_GUESTS);
  const [nameError, setNameError] = useState("");
  const nameRef = useRef(null);

  useModal(onClose);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Enter the customer's name.");
      nameRef.current?.focus();
      return;
    }
    onSubmit({ name: trimmed, guests });
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-order-title">
        <div className="modal-header">
          <h3 id="create-order-title">Create Order</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="customer-name">Customer Name</label>
            <input
              id="customer-name"
              ref={nameRef}
              className="form-input"
              type="text"
              autoFocus
              maxLength={MAX_NAME}
              value={name}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "customer-name-error" : undefined}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="Enter customer name"
            />
            {nameError && <span id="customer-name-error" className="form-error" role="alert">{nameError}</span>}
          </div>

          <div className="form-field">
            <span className="form-label" id="guest-label">Guest</span>
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
          </div>

          <button type="submit" className="btn btn-navy modal-submit">Create Order</button>
        </form>
      </div>
    </div>
  );
}