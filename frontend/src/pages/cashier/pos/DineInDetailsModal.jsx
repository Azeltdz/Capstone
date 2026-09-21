// src/pages/cashier/pos/DineInDetailsModal.jsx
import { useEffect, useRef, useState } from "react";

const MIN_GUESTS = 1;
const MAX_GUESTS = 20;

export default function DineInDetailsModal({ onSubmit, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(MIN_GUESTS);
  const [nameError, setNameError] = useState("");
  const nameRef = useRef(null);

  // Focus the name field on open, and close on Escape.
  useEffect(() => {
    nameRef.current?.focus();
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Enter the customer's name.");
      nameRef.current?.focus();
      return;
    }
    onSubmit({ name: trimmed, phone: phone.trim(), guests });
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-order-title">
        <div className="modal-header">
          <h3 id="create-order-title">Create Order</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="customer-name">
              Customer Name
            </label>
            <input
              id="customer-name"
              ref={nameRef}
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="Enter customer name"
            />
            {nameError && <span className="form-error">{nameError}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="customer-phone">
              Customer Phone <span className="form-optional">(optional)</span>
            </label>
            <input
              id="customer-phone"
              className="form-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+63 9XX XXX XXXX"
            />
          </div>

          <div className="form-field">
            <span className="form-label" id="guest-label">
              Guest
            </span>
            <div className="guest-stepper" role="group" aria-labelledby="guest-label">
              <button
                type="button"
                className="guest-btn"
                onClick={() => setGuests((g) => Math.max(MIN_GUESTS, g - 1))}
                disabled={guests <= MIN_GUESTS}
                aria-label="Remove one guest"
              >
                −
              </button>
              <span className="guest-count" aria-live="polite">
                {guests} {guests === 1 ? "Person" : "People"}
              </span>
              <button
                type="button"
                className="guest-btn"
                onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))}
                disabled={guests >= MAX_GUESTS}
                aria-label="Add one guest"
              >
                +
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-navy modal-submit">
            Create Order
          </button>
        </form>
      </div>
    </div>
  );
}