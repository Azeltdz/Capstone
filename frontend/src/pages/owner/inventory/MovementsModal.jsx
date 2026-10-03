import { useState } from "react";
import { format } from "date-fns";
import ModalShell from "../../../components/ModalShell";
import { useMovements } from "../../../hooks/useInventory";
import { formatOrderNumber } from "../../../utils/format";

const TYPES = {
  opening: ["Opening balance", "badge-cash"], sale: ["Sale", "badge-card"], restock: ["Delivery", "badge-good"],
  spoilage: ["Spoilage", "badge-flag"], adjustment: ["Stock count", "badge-warn"],
};

export default function MovementsModal({ item, onClose }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useMovements(item.inventory_id, page);

  return (
    <ModalShell title="Stock history" subtitle={`${item.ingredient_name}${item.branch_name ? ` · ${item.branch_name}` : ""}`} width={720} onClose={onClose}>
      {isLoading && <p className="loading-text">Loading history…</p>}
      {error && !data && (
        <p className="error-text">
          Couldn't load history. {error.message}{" "}
          <button type="button" className="btn-text" onClick={() => refetch()}>Try again</button>
        </p>
      )}

      {data && (
        <>
          <div className="table-wrap" style={{ maxHeight: 380, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr><th>When</th><th>Type</th><th>Change</th><th>Balance</th><th>By</th><th>Note</th></tr>
              </thead>
              <tbody>
                {data.rows.map((m) => {
                  const [label, badge] = TYPES[m.movement_type] ?? [m.movement_type, ""];
                  const d = m.quantity_delta;
                  return (
                    <tr key={m.movement_id}>
                      <td>{format(new Date(m.created_at), "MMM d, h:mm a")}</td>
                      <td><span className={`badge ${badge}`}>{label}</span></td>
                      <td className={d < 0 ? "red-text" : d > 0 ? "green-text" : ""}>
                        {d > 0 ? "+" : d < 0 ? "−" : ""}{Math.abs(d)} {item.unit}
                      </td>
                      <td>{m.quantity_after} {item.unit}</td>
                      <td>{m.performed_by_name ?? (m.movement_type === "opening" ? "System" : "—")}</td>
                      <td>{m.reference_type === "transaction" ? `Order ${formatOrderNumber(m.reference_id)}` : m.reason || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls">
            <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Newer</button>
            <span className="pagination-page">Page {page} of {data.page_count}</span>
            <button type="button" className="btn-outline btn-sm" disabled={page >= data.page_count} onClick={() => setPage((p) => p + 1)}>Older ›</button>
          </div>
        </>
      )}
    </ModalShell>
  );
}