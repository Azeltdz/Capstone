import { useModal } from "../../../hooks/useModal";

export default function ExportConfirmModal({ count, busy, onCancel, onConfirm }) {
  useModal(() => {
    if (!busy) onCancel();
  });

  return (
    <div className="modal-backdrop" onClick={() => !busy && onCancel()}>
      <div className="modal-card modal-confirm" role="dialog" aria-modal="true" aria-label="Confirm export" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Export transactions?</h3>
          <button type="button" className="modal-close" onClick={onCancel} disabled={busy} aria-label="Close">✕</button>
        </div>

        <p className="modal-subtitle">
          This downloads a CSV of all {count.toLocaleString()} transaction{count === 1 ? "" : "s"} matching your
          current filters and search, not just the page you're viewing.
        </p>

        <div className="confirm-actions">
          <button type="button" className="btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn-solid" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? "Preparing…" : "⬇ Export CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}