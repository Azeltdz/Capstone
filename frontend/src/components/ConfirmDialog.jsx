import { useModal } from "../hooks/useModal";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", busy = false, error = "", onConfirm, onCancel }) {
  useModal(() => {
    if (!busy) onCancel();
  });
  return (
    <div className="modal-backdrop" onClick={() => !busy && onCancel()}>
      <div className="modal-card modal-confirm" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onCancel} disabled={busy} aria-label="Close">✕</button>
        </div>
        {message && <p className="modal-subtitle">{message}</p>}
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="confirm-actions">
          <button type="button" className="btn-outline" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button type="button" className="btn-solid" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}