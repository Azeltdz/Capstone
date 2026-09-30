import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useTables, useReleaseTable } from "../../hooks/useTables";
import { useModal } from "../../hooks/useModal";
import { formatOrderNumber } from "../../utils/format";

function useNow(intervalMs) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function elapsedLabel(since, now) {
  const mins = Math.max(0, Math.floor((now - new Date(since).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

function ConfirmRelease({ table, busy, error, onCancel, onConfirm }) {
  useModal(() => {
    if (!busy) onCancel();
  });

  return (
    <div className="modal-backdrop" onClick={() => !busy && onCancel()}>
      <div className="modal-card modal-confirm" role="dialog" aria-modal="true"
            aria-label={`Clear table ${table.table_number}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Clear Table {table.table_number}?</h3>
          <button type="button" className="modal-close" onClick={onCancel} disabled={busy} aria-label="Close">✕</button>
        </div>
        <p className="modal-subtitle">
          Only clear it once the guests have left. It becomes available for the next party right away.
        </p>
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="confirm-actions">
          <button type="button" className="btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn-solid" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? "Clearing…" : "Clear table"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TablesView() {
  const { user } = useAuth();
  const { data: tables = [], isLoading, error, refetch } = useTables(user?.branch_id);
  const release = useReleaseTable();
  const now = useNow(30000);
  const [target, setTarget] = useState(null);
  const [releaseError, setReleaseError] = useState("");

  const occupied = tables.filter((t) => t.status === "occupied").length;

  async function confirmRelease() {
    setReleaseError("");
    try {
      await release.mutateAsync(target.table_id);
      toast.success(`Table ${target.table_number} is now available`);
      setTarget(null);
    } catch (err) {
      setReleaseError(err.message);
    }
  }

  return (
    <div className="pos-main">
      <h2 className="step-label">Tables</h2>
      <p className="step-sub">
        {tables.length > 0
          ? `${occupied} occupied · ${tables.length - occupied} available. Clear a table once its guests have left.`
          : "See which tables are in use and free them when guests leave."}
      </p>

      {isLoading && <p className="loading-text">Loading tables…</p>}
      {error && !tables.length && (
        <p className="error-text">
          Couldn't load tables. {error.message}{" "}
          <button type="button" className="btn-text" onClick={() => refetch()}>Try again</button>
        </p>
      )}
      {!isLoading && !error && tables.length === 0 && (
        <p className="loading-text">No tables are set up for this branch yet. Ask the owner to add them in Branch Management.</p>
      )}

      <div className="table-grid">
        {tables.map((t) => {
          const isOccupied = t.status === "occupied";
          return (
            <div key={t.table_id} className={`table-card ${isOccupied ? "table-occupied" : "table-available"}`}>
              <span className="table-icon">🍽️</span>
              <span className="table-name">Table {t.table_number}</span>
              <span className="table-seats">
                {isOccupied && t.seated_guests ? `${t.seated_guests} of ${t.guest_capacity} seats` : `${t.guest_capacity} seats`}
              </span>
              <span className={`badge ${isOccupied ? "badge-flag" : "badge-good"}`}>
                {isOccupied ? "Occupied" : "Available"}
              </span>
              {isOccupied && (
                <>
                  {t.seated_transaction_id && (
                    <span className="table-seats">
                      {t.seated_customer || formatOrderNumber(t.seated_transaction_id)}
                    </span>
                  )}
                  {t.seated_at && <span className="table-seats">Seated {elapsedLabel(t.seated_at, now)}</span>}
                  <button type="button" className="btn-outline btn-sm"
                          onClick={() => { setReleaseError(""); setTarget(t); }}>
                    Clear table
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {target && (
        <ConfirmRelease
          table={target} busy={release.isPending} error={releaseError}
          onCancel={() => setTarget(null)} onConfirm={confirmRelease}
        />
      )}
    </div>
  );
}