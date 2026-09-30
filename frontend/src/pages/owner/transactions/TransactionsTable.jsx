import { format } from "date-fns";
import { formatOrderNumber, formatPeso, ORDER_TYPE_LABELS, paymentLabel } from "../../../utils/format";

const PAGE_SIZES = [10, 25, 50, 100]; // the backend rejects anything above 100
const TYPE_BADGE = { "dine-in": "badge-dinein", "take-out": "badge-takeout", delivery: "badge-delivery" };
const COLUMN_COUNT = 9;

function SortHeader({ label, sortKey, activeKey, dir, onSort, className }) {
  const active = activeKey === sortKey;
  return (
    <th className={className} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`sort-btn ${active ? "sort-active" : ""}`} onClick={() => onSort(sortKey)}>
        {label}
        <span className="sort-arrow">{active ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}

function BranchBadge({ id, name, colors }) {
  const color = colors.get(id) ?? "#6b7280";
  return <span className="badge" style={{ background: `${color}1a`, color }}>{name}</span>;
}

export default function TransactionsTable({
  rows, total, page, pageCount, pageSize, isLoading, isFetching, error, onRetry,
  sort, dir, onSort, onPage, onPageSize, onView, colors, hasActiveFilters, onClear,
}) {
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <>
      <div className="table-wrap" aria-busy={isFetching} style={{ opacity: isFetching && !isLoading ? 0.6 : 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Branch</th>
              <th>Cashier</th>
              <th>Customer</th>
              <SortHeader label="Time" sortKey="time" activeKey={sort} dir={dir} onSort={onSort} />
              <th>Type</th>
              <SortHeader label="Total" sortKey="total" activeKey={sort} dir={dir} onSort={onSort} className="align-right" />
              <th>Payment</th>
              <th className="align-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={COLUMN_COUNT} className="table-status">Loading transactions…</td></tr>
            )}

            {error && !rows.length && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="table-status table-status-error">
                  Couldn't load transactions. {error.message}{" "}
                  <button type="button" className="btn-text" onClick={onRetry}>Try again</button>
                </td>
              </tr>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="empty-cell">
                  <div className="empty-state">
                    <span className="empty-icon" aria-hidden="true">🧾</span>
                    <p>No transactions match your filters.</p>
                    {hasActiveFilters && (
                      <button type="button" className="btn-text" onClick={onClear}>Clear filters</button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.transaction_id} className="row-clickable" onClick={() => onView(row.transaction_id)}>
                <td className="cell-strong">{formatOrderNumber(row.transaction_id)}</td>
                <td><BranchBadge id={row.branch_id} name={row.branch_name} colors={colors} /></td>
                <td>{row.cashier_name}</td>
                <td>{row.customer_name || "—"}</td>
                <td>{format(new Date(row.transaction_at), "MMM d, h:mm a")}</td>
                <td>
                  <span className={`badge ${TYPE_BADGE[row.order_type] ?? ""}`}>
                    {ORDER_TYPE_LABELS[row.order_type] ?? row.order_type}
                  </span>
                  {row.table_number && <span className="modal-muted"> Table {row.table_number}</span>}
                </td>
                <td className="align-right cell-strong">{formatPeso(row.total_amount)}</td>
                <td>
                  <span className={`badge ${row.payment_method === "cash" ? "badge-cash" : "badge-card"}`}>
                    {paymentLabel(row.payment_method)}
                  </span>
                </td>
                <td className="align-right">
                  <button
                    type="button"
                    className="btn-view"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(row.transaction_id);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing {rangeStart}–{rangeEnd} of {total.toLocaleString()}
            <select
              className="select-input select-sm"
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              aria-label="Rows per page"
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="pagination-controls">
            <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(1)}>« First</button>
            <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ Prev</button>
            <span className="pagination-page">Page {page} of {pageCount}</span>
            <button type="button" className="btn-outline btn-sm" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>Next ›</button>
            <button type="button" className="btn-outline btn-sm" disabled={page >= pageCount} onClick={() => onPage(pageCount)}>Last »</button>
          </div>
        </div>
      )}
    </>
  );
}