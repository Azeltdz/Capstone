import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useTables } from "../../../hooks/useTables";
import TableTile from "../../../components/TableTile";
import TableLegend from "../../../components/TableLegend";
import { getTableTone } from "../../../utils/orderStatus";

export default function TableStep({ selectedId, onSelect, onSkip, onBack }) {
  const { user } = useAuth();
  const { data: tables, isLoading, error } = useTables(user?.branch_id);

  return (
    <div className="pos-main">
      {onBack && (
        <button type="button" className="back-link" onClick={onBack}>← Back to menu</button>
      )}
      <h2 className="step-label">Step 1 — Select a table</h2>
      <p className="step-sub">
        Pick an available table, then enter the number of guests. Table still marked occupied?{" "}
        <Link to="/cashier/tables">Settle or clear it on the Tables page</Link>.
      </p>

      <button type="button" className="skip-table-btn" onClick={onSkip}>
        <ShoppingBag size={18} aria-hidden="true" />
        No table — Take-out or Delivery
      </button>

      <TableLegend />

      <div className="floor-grid">
        {error && <p className="error-text">Couldn't load tables. {error.message}</p>}
        {isLoading && <p className="loading-text">Loading tables…</p>}
        {tables && tables.length === 0 && (
          <p className="loading-text">No tables are set up for this branch yet. Ask the owner to add them.</p>
        )}
        {tables?.map((table) => {
          const occupied = getTableTone(table) !== "available";
          return (
            <TableTile
              key={table.table_id}
              table={table}
              disabled={occupied}
              selected={table.table_id === selectedId}
              onClick={() =>
                onSelect({
                  table_id: table.table_id,
                  table_number: table.table_number,
                  guest_capacity: table.guest_capacity,
                })
              }
            />
          );
        })}
      </div>
    </div>
  );
}