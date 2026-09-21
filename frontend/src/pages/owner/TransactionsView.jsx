// src/pages/owner/TransactionsView.jsx
import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import { getTransactionsData } from "../../api/mockOwner";

const BRANCH_OPTIONS = ["All Branches", "Poblacion", "San Roque"];

// value is what you'll send to the backend later; label is what the owner sees
const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "last-week", label: "Last Week" },
  { value: "last-month", label: "Last Month" },
  { value: "last-year", label: "Last Year" },
];

function badgeClassForType(type) {
  if (type === "Dine-in") return "badge-dinein";
  if (type === "Take-out") return "badge-takeout";
  if (type === "Delivery") return "badge-delivery";
  return "";
}

function badgeClassForBranch(branch) {
  return branch === "Poblacion" ? "badge-poblacion" : "badge-sanroque";
}

function badgeClassForPayment(payment) {
  if (payment === "Card") return "badge-card";
  return "badge-cash";
}

function TransactionModal({ row, onClose }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Transaction ${row.id}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Transaction {row.id}</h3>
            <div className="modal-subtitle">{row.time}</div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <dl className="modal-grid">
          <div>
            <dt>Branch</dt>
            <dd>
              <span className={`badge ${badgeClassForBranch(row.branch)}`}>{row.branch}</span>
            </dd>
          </div>
          <div>
            <dt>Cashier</dt>
            <dd>{row.cashier}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>
              <span className={`badge ${badgeClassForType(row.typeKey)}`}>{row.type}</span>
            </dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>
              <span className={`badge ${badgeClassForPayment(row.payment)}`}>{row.payment}</span>
            </dd>
          </div>
        </dl>

        {row.items && row.items.length > 0 ? (
          <div className="modal-items">
            <div className="modal-items-head">
              <span>Item</span>
              <span>Amount</span>
            </div>
            {row.items.map((item) => (
              <div className="modal-items-row" key={item.name}>
                <span>
                  {item.qty}× {item.name}
                </span>
                <span>₱{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="modal-muted">No item details available.</p>
        )}

        <div className="modal-total">
          <span>Total</span>
          <span>₱{row.total.toFixed(2)}</span>
        </div>

        <button type="button" className="modal-done" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

export default function TransactionsView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [branch, setBranch] = useState("All Branches");
  const [period, setPeriod] = useState("today"); // UI only for now — not wired to data yet
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getTransactionsData()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error-text">Couldn't load transactions. {error}</p>;
  if (!data) return <p className="loading-text">Loading transactions…</p>;

  const { weeklyTrend } = data;
  const isAll = branch === "All Branches";

  // Branch filter: table rows, stat cards, and the chart all follow the selection.
  const rows = isAll ? data.rows : data.rows.filter((r) => r.branch === branch);
  const stats = (!isAll && data.branchStats?.[branch]) || data.stats;

  const showPoblacion = isAll || branch === "Poblacion";
  const showSanRoque = isAll || branch === "San Roque";

  const visibleValues = weeklyTrend.flatMap((d) => [
    ...(showPoblacion ? [d.poblacion] : []),
    ...(showSanRoque ? [d.sanRoque] : []),
  ]);
  const maxVal = Math.max(...visibleValues);

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">All Transactions</h2>
        <div className="view-filters">
          <select
            className="select-input"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            aria-label="Filter by branch"
          >
            {BRANCH_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* TODO: pass `period` to getTransactionsData({ branch, period }) once the backend supports it */}
          <select
            className="select-input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Filter by period"
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stat-grid stat-grid-4">
        <StatCard label="Total Today" value={`₱${stats.totalToday.toLocaleString()}`} />
        <StatCard label="Count" value={stats.count} />
        <StatCard label="Avg Order Value" value={`₱${stats.avgOrder}`} />
        <StatCard label="GCash / Cash / Card" value={stats.paymentSplit} valueClassName="stat-value-sm" />
      </div>

      <div className="panel">
        <h3 className="panel-title">📊 Sales per Branch — Daily Trend (This Week)</h3>
        <div className="trend-chart">
          {weeklyTrend.map((d) => (
            <div className="trend-col" key={d.day}>
              <div className="trend-bars">
                {showPoblacion && (
                  <div
                    className={`bar navy ${d.projected ? "faded" : ""}`}
                    style={{ height: `${(d.poblacion / maxVal) * 100}%` }}
                  />
                )}
                {showSanRoque && (
                  <div
                    className={`bar blue ${d.projected ? "faded" : ""}`}
                    style={{ height: `${(d.sanRoque / maxVal) * 100}%` }}
                  />
                )}
              </div>
              <span className="trend-day">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="legend">
          {showPoblacion && (
            <span className="legend-item">
              <i className="legend-swatch navy" /> Poblacion
            </span>
          )}
          {showSanRoque && (
            <span className="legend-item">
              <i className="legend-swatch blue" /> San Roque
            </span>
          )}
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Branch</th>
              <th>Cashier</th>
              <th>Time</th>
              <th>Type</th>
              <th className="align-right">Total</th>
              <th>Payment</th>
              <th className="align-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  No transactions found for {branch}.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="cell-strong">{row.id}</td>
                  <td>
                    <span className={`badge ${badgeClassForBranch(row.branch)}`}>{row.branch}</span>
                  </td>
                  <td>{row.cashier}</td>
                  <td>{row.time}</td>
                  <td>
                    <span className={`badge ${badgeClassForType(row.typeKey)}`}>{row.type}</span>
                  </td>
                  <td className="align-right cell-strong">₱{row.total.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${badgeClassForPayment(row.payment)}`}>{row.payment}</span>
                  </td>
                  <td className="align-right">
                    <button type="button" className="btn-view" onClick={() => setSelectedRow(row)}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRow && <TransactionModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </>
  );
}