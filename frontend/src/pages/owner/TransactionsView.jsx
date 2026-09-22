// src/pages/owner/TransactionsView.jsx
import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import StatCard from "../../components/StatCard";
import { getTransactionsData } from "../../api/mockOwner";

// Register once per app — cheap to call on every module load, Chart.js dedupes it.
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Match these to your .bar.navy / .bar.blue colors
const BRANCH_COLORS = { Poblacion: "#1e3a8a", "San Roque": "#3b82f6" };
const BRANCH_COLORS_FADED = { Poblacion: "#1e3a8a66", "San Roque": "#3b82f666" };

const BRANCH_OPTIONS = ["All Branches", "Poblacion", "San Roque"];

// value is what you'll send to the backend later; label is what the owner sees
const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "last-week", label: "Last Week" },
  { value: "last-month", label: "Last Month" },
  { value: "last-year", label: "Last Year" },
];

const PAGE_SIZE_OPTIONS = [8, 15, 25, 50];

const peso = (n) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// "11:42 AM" -> a real Date so it sorts chronologically, not alphabetically.
function parseTimeOfDay(timeStr) {
  const t = Date.parse(`1970/01/01 ${timeStr}`);
  return Number.isNaN(t) ? 0 : t;
}

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

function downloadCsv(rows) {
  const header = ["Order #", "Branch", "Cashier", "Time", "Type", "Total", "Payment"];
  const body = rows.map((r) => [r.id, r.branch, r.cashier, r.time, r.type, r.total.toFixed(2), r.payment]);
  const csv = [header, ...body].map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SortHeader({ label, sortKey, activeKey, dir, onSort, className }) {
  const isActive = activeKey === sortKey;
  return (
    <th className={className}>
      <button type="button" className={`sort-btn ${isActive ? "sort-active" : ""}`} onClick={() => onSort(sortKey)}>
        {label}
        <span className="sort-arrow">{isActive ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}

function ExportConfirmModal({ count, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-card modal-confirm"
        role="dialog"
        aria-modal="true"
        aria-label="Confirm export"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Export transactions?</h3>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="modal-subtitle">
          This will download a CSV of {count} transaction{count === 1 ? "" : "s"} matching your current
          filters and search.
        </p>

        <div className="confirm-actions">
          <button type="button" className="btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-solid" onClick={onConfirm}>
            ⬇ Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}

function TransactionModal({ row, onClose }) {
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
                <span>{peso(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="modal-muted">No item details available.</p>
        )}

        <div className="modal-total">
          <span>Total</span>
          <span>{peso(row.total)}</span>
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
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null); // "time" | "total" | null
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTransactionsData()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Safe fallbacks so the hooks below always run, whether or not `data` has loaded yet.
  // (Hooks must be called in the same order on every render — an early return above
  // this point would skip hooks on the loading/error render and break that rule.)
  const weeklyTrend = data?.weeklyTrend ?? [];
  const allRows = data?.rows ?? [];
  const isAll = branch === "All Branches";
  const showPoblacion = isAll || branch === "Poblacion";
  const showSanRoque = isAll || branch === "San Roque";

  // Chart.js wants one dataset per series, not per-row objects — built once per data/branch change
  // so large datasets (thousands of points) aren't reshaped on every render.
  // Both datasets always exist so their legend entries stay clickable; `hidden` (not
  // omission) is what reflects the branch filter, so clicking a hidden legend item
  // can bring it back.
  const chartData = useMemo(
    () => ({
      labels: weeklyTrend.map((d) => d.day),
      datasets: [
        {
          label: "Poblacion",
          data: weeklyTrend.map((d) => d.poblacion),
          backgroundColor: weeklyTrend.map((d) =>
            d.projected ? BRANCH_COLORS_FADED.Poblacion : BRANCH_COLORS.Poblacion
          ),
          borderRadius: 4,
          maxBarThickness: 28,
          hidden: !showPoblacion,
        },
        {
          label: "San Roque",
          data: weeklyTrend.map((d) => d.sanRoque),
          backgroundColor: weeklyTrend.map((d) =>
            d.projected ? BRANCH_COLORS_FADED["San Roque"] : BRANCH_COLORS["San Roque"]
          ),
          borderRadius: 4,
          maxBarThickness: 28,
          hidden: !showSanRoque,
        },
      ],
    }),
    [weeklyTrend, showPoblacion, showSanRoque]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: true,
      normalized: true,
      interaction: { mode: "index", intersect: false },
      // Clicking an actual bar filters by that bar's branch — same behavior as the
      // legend click below, so either one keeps the whole page (table, stat cards,
      // CSV export) in sync. `nearest` + `intersect: true` here (deliberately
      // different from the hover/tooltip `interaction` above) means only a bar the
      // cursor is actually over counts as a click, not just the nearest category.
      onClick: (event, _activeElements, chart) => {
        const points = chart.getElementsAtEventForMode(event, "nearest", { intersect: true }, true);
        if (!points.length) return;
        const clicked = chart.data.datasets[points[0].datasetIndex].label;
        setBranch((prev) => (prev === clicked ? "All Branches" : clicked));
        setPage(1);
      },
      onHover: (event, activeElements) => {
        if (event.native?.target) {
          event.native.target.style.cursor = activeElements.length ? "pointer" : "default";
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: { usePointStyle: true, boxWidth: 8 },
          // Clicking a branch in the legend drives the same `branch` filter as the
          // dropdown, instead of Chart.js's default per-dataset show/hide toggle —
          // so the chart, table, and stat cards never fall out of sync. Clicking the
          // branch that's already selected clears the filter back to "All Branches".
          onClick: (_event, legendItem) => {
            const clicked = legendItem.text;
            setBranch((prev) => (prev === clicked ? "All Branches" : clicked));
            setPage(1);
          },
          onHover: (event) => {
            if (event.native?.target) event.native.target.style.cursor = "pointer";
          },
          onLeave: (event) => {
            if (event.native?.target) event.native.target.style.cursor = "default";
          },
        },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${peso(ctx.parsed.y ?? 0)}` } },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "#eee" }, ticks: { callback: (v) => `₱${v}` } },
      },
    }),
    []
  );

  // Branch filter -> search -> sort, in that order. Memoized since this is the
  // step that matters most once there are thousands of rows.
  const filteredSortedRows = useMemo(() => {
    let result = isAll ? allRows : allRows.filter((r) => r.branch === branch);

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.cashier.toLowerCase().includes(q) ||
          r.total.toFixed(2).includes(q)
      );
    }

    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        if (sortKey === "total") return (a.total - b.total) * dir;
        if (sortKey === "time") return (parseTimeOfDay(a.time) - parseTimeOfDay(b.time)) * dir;
        return 0;
      });
    }

    return result;
  }, [allRows, isAll, branch, search, sortKey, sortDir]);

  const totalRows = filteredSortedRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredSortedRows.slice(start, start + pageSize);
  }, [filteredSortedRows, safePage, pageSize]);

  if (error) return <p className="error-text">Couldn't load transactions. {error}</p>;
  if (!data) {
    return (
      <>
        <div className="view-header">
          <h2 className="view-title">All Transactions</h2>
        </div>

        <div className="stat-grid stat-grid-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-stat-card" />
          ))}
        </div>

        <div className="panel">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-chart" />
        </div>

        <div className="panel table-panel">
          <div className="skeleton skeleton-title" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-line" />
          ))}
        </div>
      </>
    );
  }

  const stats = (!isAll && data.branchStats?.[branch]) || data.stats;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setBranch("All Branches");
    setPeriod("today");
    setSearch("");
    setSortKey(null);
    setSortDir("asc");
    setPage(1);
  };

  const hasActiveFilters = branch !== "All Branches" || search.trim() !== "" || sortKey !== null;

  const rangeStart = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalRows);

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">All Transactions</h2>
        <div className="view-filters">
          <select
            className="select-input"
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setPage(1);
            }}
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
        <StatCard label="Total Today" value={peso(stats.totalToday)} />
        <StatCard label="Count" value={stats.count} />
        <StatCard label="Avg Order Value" value={peso(stats.avgOrder)} />
        <StatCard label="GCash / Cash / Card" value={stats.paymentSplit} valueClassName="stat-value-sm" />
      </div>

      <div className="panel">
        <h3 className="panel-title">📊 Sales per Branch — Daily Trend (This Week)</h3>
        <p className="panel-hint">Click a bar or legend item to filter the page by that branch.</p>
        <div className="trend-chart-rc" style={{ width: "100%", height: 280 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="Search order #, cashier, or amount…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button type="button" className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                ✕
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button type="button" className="btn-text" onClick={clearFilters}>
              Clear filters
            </button>
          )}

          <button type="button" className="btn-outline" onClick={() => setShowExportConfirm(true)}>
            ⬇ Export CSV
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Branch</th>
                <th>Cashier</th>
                <SortHeader label="Time" sortKey="time" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <th>Type</th>
                <SortHeader
                  label="Total"
                  sortKey="total"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  className="align-right"
                />
                <th>Payment</th>
                <th className="align-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    <div className="empty-state">
                      <span className="empty-icon" aria-hidden="true">
                        🧾
                      </span>
                      <p>No transactions match your filters.</p>
                      {hasActiveFilters && (
                        <button type="button" className="btn-text" onClick={clearFilters}>
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.id} className="row-clickable" onClick={() => setSelectedRow(row)}>
                    <td className="cell-strong">{row.id}</td>
                    <td>
                      <span className={`badge ${badgeClassForBranch(row.branch)}`}>{row.branch}</span>
                    </td>
                    <td>{row.cashier}</td>
                    <td>{row.time}</td>
                    <td>
                      <span className={`badge ${badgeClassForType(row.typeKey)}`}>{row.type}</span>
                    </td>
                    <td className="align-right cell-strong">{peso(row.total)}</td>
                    <td>
                      <span className={`badge ${badgeClassForPayment(row.payment)}`}>{row.payment}</span>
                    </td>
                    <td className="align-right">
                      <button
                        type="button"
                        className="btn-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRow(row);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalRows > 0 && (
          <div className="table-pagination">
            <div className="pagination-info">
              Showing {rangeStart}–{rangeEnd} of {totalRows}
              <select
                className="select-input select-sm"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="Rows per page"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
            <div className="pagination-controls">
              <button type="button" className="btn-outline btn-sm" disabled={safePage <= 1} onClick={() => setPage(1)}>
                « First
              </button>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹ Prev
              </button>
              <span className="pagination-page">
                Page {safePage} of {pageCount}
              </span>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next ›
              </button>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={safePage >= pageCount}
                onClick={() => setPage(pageCount)}
              >
                Last »
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedRow && <TransactionModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
      {showExportConfirm && (
        <ExportConfirmModal
          count={filteredSortedRows.length}
          onCancel={() => setShowExportConfirm(false)}
          onConfirm={() => {
            downloadCsv(filteredSortedRows);
            setShowExportConfirm(false);
          }}
        />
      )}
    </>
  );
}