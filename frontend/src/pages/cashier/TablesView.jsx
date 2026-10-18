import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTables } from "../../hooks/useTables";
import TableTile from "../../components/TableTile";
import TableLegend from "../../components/TableLegend";
import TableOrderModal from "./tables/TableOrderModal";
import { getTableTone } from "../../utils/orderStatus";

function useNow(intervalMs) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
  { key: "available", label: "Available" },
];

export default function TablesView() {
  const { user } = useAuth();
  const { data: tables = [], isLoading, error, refetch } = useTables(user?.branch_id);
  const now = useNow(30000);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const counts = useMemo(() => {
    const c = { all: tables.length, unpaid: 0, paid: 0, available: 0 };
    for (const t of tables) c[getTableTone(t)] += 1;
    return c;
  }, [tables]);

  const visible = filter === "all" ? tables : tables.filter((t) => getTableTone(t) === filter);

  // Read the open table from live data so the modal updates after payment / status changes.
  const selected = tables.find((t) => t.table_id === selectedId);
  const showModal = selected && getTableTone(selected) !== "available";

  return (
    <div className="pos-main">
      <h2 className="step-label">Tables</h2>
      <p className="step-sub">
        {tables.length > 0
          ? `${counts.unpaid} unpaid · ${counts.paid} paid · ${counts.available} available. Tap an occupied table to settle payment, mark it completed, or clear it.`
          : "See which tables are in use, who still has to pay, and free tables when guests leave."}
      </p>

      <div className="filter-row" role="group" aria-label="Filter tables">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key} type="button" className="filter-chip"
            aria-pressed={filter === key} onClick={() => setFilter(key)}
          >
            {label} <span className="filter-chip-count">{counts[key]}</span>
          </button>
        ))}
      </div>

      <TableLegend />

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
      {tables.length > 0 && visible.length === 0 && (
        <p className="loading-text">No {filter} tables right now.</p>
      )}

      <div className="floor-grid">
        {visible.map((t) => {
          const occupied = getTableTone(t) !== "available";
          return (
            <TableTile
              key={t.table_id}
              table={t}
              selected={t.table_id === selectedId}
              onClick={occupied ? () => setSelectedId(t.table_id) : undefined}
            />
          );
        })}
      </div>

      {showModal && (
        <TableOrderModal table={selected} now={now} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}