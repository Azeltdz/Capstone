import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTables } from "../../hooks/useTables";
import { useNow } from "../../hooks/useNow";
import TableTile, { getTableTone } from "../../components/tables/TableTile";
import TableLegend from "../../components/tables/TableLegend";
import TableOrderModal from "./tables/TableOrderModal";

export default function TablesView() {
  const { user } = useAuth();
  const { data: tables = [], isLoading, error, refetch } = useTables(user?.branch_id);
  const now = useNow(30000);
  const [openId, setOpenId] = useState(null);

  const count = (tone) => tables.filter((t) => getTableTone(t) === tone).length;
  const free = count("free");
  const unpaid = count("unpaid");
  const paid = count("paid");
  const open = tables.find((t) => t.table_id === openId && t.status === "occupied");

  return (
    <div className="pos-main">
      <h2 className="step-label">Tables</h2>
      <p className="step-sub">
        {tables.length > 0
          ? `${free} available · ${unpaid} unpaid · ${paid} paid. Tap a seated table to settle the bill or clear it.`
          : "See which tables are in use, settle bills and free tables when guests leave."}
      </p>

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

      <div className="tt-grid">
        {tables.map((t) => (
          <TableTile
            key={t.table_id}
            table={t}
            now={now}
            showDetails
            disabled={t.status !== "occupied"}
            onClick={() => setOpenId(t.table_id)}
          />
        ))}
      </div>

      {open && <TableOrderModal table={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}