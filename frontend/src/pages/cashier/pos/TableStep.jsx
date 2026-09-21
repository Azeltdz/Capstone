// src/pages/cashier/pos/TableStep.jsx
import { useEffect, useState } from "react";
import { getTables } from "../../../api/mockCashier";

export default function TableStep({ onSelect, onBack }) {
  const [tables, setTables] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTables()
      .then((data) => !cancelled && setTables(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pos-main">
      <button className="back-link" onClick={onBack}>
        ← Back to order type
      </button>
      <h2 className="step-label">Step 2 — Select a table</h2>
      <p className="step-sub">Choose an available table for this dine-in order</p>

      <div className="table-grid">
        {error && <p className="error-text">Couldn't load tables. {error}</p>}
        {!error && !tables && <p className="loading-text">Loading tables…</p>}
        {tables &&
          tables.map((table) => {
            const isOccupied = table.status === "occupied";
            return (
              <button
                key={table.number}
                className={`table-card ${isOccupied ? "table-occupied" : "table-available"}`}
                disabled={isOccupied}
                onClick={() => onSelect(table.number)}
              >
                <span className="table-icon">🍽️</span>
                <span className="table-name">Table {table.number}</span>
                <span className="table-seats">{table.seats} seats</span>
                <span className={`badge ${isOccupied ? "badge-flag" : "badge-good"}`}>
                  {isOccupied ? "Occupied" : "Available"}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}