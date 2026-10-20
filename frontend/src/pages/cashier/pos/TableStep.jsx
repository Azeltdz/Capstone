import { useAuth } from "../../../context/AuthContext";
import { useTables } from "../../../hooks/useTables";
import { useNow } from "../../../hooks/useNow";
import TableTile from "../../../components/tables/TableTile";
import TableLegend from "../../../components/tables/TableLegend";

export default function TableStep({ onSelectTable, onSelectNoTable }) {
  const { user } = useAuth();
  const { data: tables = [], isLoading, error, refetch } = useTables(user?.branch_id);
  const now = useNow(30000);

  return (
    <div className="pos-main">
      <h2 className="step-label">Step 1 — Table or no table</h2>
      <p className="step-sub">Tap a free table for Dine-in, or choose Take-out or Delivery if there's no table.</p>

      <div className="start-quick" role="group" aria-label="Orders without a table">
        <button type="button" className="start-quick-btn" onClick={() => onSelectNoTable("take-out")}>
          <span className="start-quick-icon" aria-hidden="true">🥡</span>
          <span><strong>Take-out</strong><small>No table</small></span>
        </button>
        <button type="button" className="start-quick-btn" onClick={() => onSelectNoTable("delivery")}>
          <span className="start-quick-icon" aria-hidden="true">🛵</span>
          <span><strong>Delivery</strong><small>No table</small></span>
        </button>
      </div>

      <div className="start-divider"><span>Or Pick a Table for Dine-in</span></div>

      <TableLegend />

      {isLoading && <p className="loading-text">Loading tables…</p>}
      {error && !tables.length && (
        <p className="error-text">
          Couldn't load tables. {error.message}{" "}
          <button type="button" className="btn-text" onClick={() => refetch()}>Try again</button>
        </p>
      )}
      {!isLoading && !error && tables.length === 0 && (
        <p className="loading-text">No tables are set up for this branch yet. You can still take take-out and delivery orders.</p>
      )}

      <div className="tt-grid">
        {tables.map((t) => (
          <TableTile
            key={t.table_id}
            table={t}
            now={now}
            disabled={t.status === "occupied"}
            onClick={() => onSelectTable({ table_id: t.table_id, table_number: t.table_number, guest_capacity: t.guest_capacity })}
          />
        ))}
      </div>
    </div>
  );
}