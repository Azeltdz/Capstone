import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTables } from "../../../hooks/useTables";

export default function TableStep({ onSelect, onBack, guests }) {
  const { user } = useAuth();
  const { data: tables, isLoading, error } = useTables(user?.branch_id);

  return (
    <div className="pos-main">
      <button className="back-link" onClick={onBack}>← Back to order type</button>
      <h2 className="step-label">Step 2 — Select a table</h2>
      <p className="step-sub">
        Choose an available table for this dine-in order. Table still marked occupied?{" "}
        <Link to="/cashier/tables">Clear it on the Tables page</Link>.
      </p>

      <div className="table-grid">
        {error && <p className="error-text">Couldn't load tables. {error.message}</p>}
        {isLoading && <p className="loading-text">Loading tables…</p>}
        {tables && tables.length === 0 && (
          <p className="loading-text">No tables are set up for this branch yet. Ask the owner to add them.</p>
        )}
        {tables?.map((table) => {
          const isOccupied = table.status === "occupied";
          const tooSmall = !isOccupied && guests && table.guest_capacity < guests;
          return (
            <button
              key={table.table_id}
              className={`table-card ${isOccupied ? "table-occupied" : "table-available"}`}
              disabled={isOccupied}
              onClick={() => onSelect({ table_id: table.table_id, table_number: table.table_number })}
            >
              <span className="table-icon">🍽️</span>
              <span className="table-name">Table {table.table_number}</span>
              <span className="table-seats">{table.guest_capacity} seats</span>
              <span className={`badge ${isOccupied ? "badge-flag" : "badge-good"}`}>
                {isOccupied ? "Occupied" : "Available"}
              </span>
              {tooSmall && <span className="badge badge-warn">Small for {guests}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}