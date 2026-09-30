import { useState } from "react";
import toast from "react-hot-toast";
import ModalShell from "../../../components/ModalShell";
import { useTables, useSaveTableLayout } from "../../../hooks/useTables";

const MAX_TABLES = 50;
const MAX_SEATS = 50;
const DEFAULT_SEATS = 4;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const toInt = (v) => Math.trunc(Number(v)) || 0;

function LayoutEditor({ branch, tables, onClose }) {
  const save = useSaveTableLayout();

  const [initial] = useState(() => ({
    count: tables.reduce((max, t) => Math.max(max, t.table_number), 0),
    seats: Object.fromEntries(tables.map((t) => [t.table_number, t.guest_capacity])),
  }));

  const occupied = new Set(tables.filter((t) => t.status === "occupied").map((t) => t.table_number));
  const minCount = Math.max(0, ...occupied);

  const [count, setCount] = useState(initial.count);
  const [seats, setSeats] = useState(initial.seats);
  const [bulk, setBulk] = useState(DEFAULT_SEATS);
  const [error, setError] = useState("");

  const seatsFor = (n) => seats[n] ?? DEFAULT_SEATS;
  const numbers = Array.from({ length: count }, (_, i) => i + 1);
  const dirty =
    count !== initial.count || numbers.some((n) => seatsFor(n) !== (initial.seats[n] ?? DEFAULT_SEATS));

  const changeCount = (value) => setCount(clamp(toInt(value), minCount, MAX_TABLES));
  const setSeat = (n, value) => setSeats((s) => ({ ...s, [n]: clamp(toInt(value) || 1, 1, MAX_SEATS) }));
  const applyToAll = () => setSeats(Object.fromEntries(numbers.map((n) => [n, clamp(bulk, 1, MAX_SEATS)])));

  function requestClose() {
    if (dirty && !save.isPending && !window.confirm("Discard your unsaved changes?")) return;
    onClose();
  }

  async function handleSave() {
    setError("");
    try {
      await save.mutateAsync({
        branchId: branch.branch_id,
        count,
        capacities: numbers.map((n) => ({ table_number: n, guest_capacity: seatsFor(n) })),
      });
      toast.success(`Tables updated for ${branch.branch_name}`);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ModalShell title={`Tables — ${branch.branch_name}`} subtitle="Number of tables and seats per table" onClose={requestClose}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
        <label className="menu-field">
          Number of tables
          <span style={{ display: "flex", gap: 6 }}>
            <button type="button" className="menu-btn" aria-label="Remove one table"
                    onClick={() => changeCount(count - 1)} disabled={count <= minCount}>−</button>
            <input className="menu-input" type="number" min={minCount} max={MAX_TABLES} style={{ width: 80 }}
                    value={count} onChange={(e) => changeCount(e.target.value)} />
            <button type="button" className="menu-btn" aria-label="Add one table"
                    onClick={() => changeCount(count + 1)} disabled={count >= MAX_TABLES}>+</button>
          </span>
        </label>

        <label className="menu-field">
          Set every table to
          <span style={{ display: "flex", gap: 6 }}>
            <input className="menu-input" type="number" min={1} max={MAX_SEATS} style={{ width: 80 }}
                    value={bulk} onChange={(e) => setBulk(clamp(toInt(e.target.value) || 1, 1, MAX_SEATS))} />
            <button type="button" className="menu-btn" onClick={applyToAll} disabled={count === 0}>Apply</button>
          </span>
        </label>
      </div>

      {minCount > 0 && (
        <p className="menu-subtle">Table {minCount} has guests, so you can't go below {minCount} tables until it's cleared.</p>
      )}
      {count < initial.count && (
        <p className="menu-subtle" role="status">
          {count + 1 === initial.count ? `Table ${initial.count}` : `Tables ${count + 1}–${initial.count}`} will be removed
          from the floor. Their order history is kept.
        </p>
      )}

      {count === 0 ? (
        <p className="loading-text">No tables. Dine-in orders won't be possible at this branch.</p>
      ) : (
        <div className="table-wrap" style={{ maxHeight: 320, overflowY: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Table</th><th>Seats</th><th>Status</th></tr></thead>
            <tbody>
              {numbers.map((n) => (
                <tr key={n}>
                  <td className="cell-strong">Table {n}</td>
                  <td>
                    <input className="menu-input" type="number" min={1} max={MAX_SEATS} style={{ width: 80 }}
                            aria-label={`Seats at table ${n}`} value={seatsFor(n)}
                            onChange={(e) => setSeat(n, e.target.value)} />
                  </td>
                  <td>
                    {occupied.has(n) ? <span className="badge badge-flag">Occupied</span>
                      : n > initial.count ? <span className="badge badge-cash">New</span>
                      : <span className="badge badge-good">Available</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="error-text" role="alert">{error}</p>}

      <div className="menu-modal-actions">
        <button type="button" className="menu-btn" onClick={requestClose} disabled={save.isPending}>Cancel</button>
        <button type="button" className="menu-btn menu-btn-primary" onClick={handleSave} disabled={!dirty || save.isPending}>
          {save.isPending ? "Saving…" : "Save tables"}
        </button>
      </div>
    </ModalShell>
  );
}

export default function ManageTablesModal({ branch, onClose }) {
  const { data: tables, error, refetch } = useTables(branch.branch_id);

  if (tables) return <LayoutEditor branch={branch} tables={tables} onClose={onClose} />;

  return (
    <ModalShell title={`Tables — ${branch.branch_name}`} onClose={onClose}>
      {error ? (
        <>
          <p className="error-text">Couldn't load tables. {error.message}</p>
          <button type="button" className="menu-btn" onClick={() => refetch()}>Try again</button>
        </>
      ) : (
        <p className="loading-text">Loading tables…</p>
      )}
    </ModalShell>
  );
}