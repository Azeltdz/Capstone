// src/pages/owner/AIAnalyticsView.jsx
import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend,
} from "chart.js";
import { TrendingUp, TrendingDown, Minus, Package, AlertTriangle, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useBranches } from "../../hooks/useBranches";
import { useTrends, useProcurement, useBranchAnomalies, useRefreshForecasts } from "../../hooks/useAnalytics";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const COLOR_SELECTED = "#f59e0b"; // the day the owner clicked
const COLOR_HIGH = "#3b82f6";     // above the moving average
const COLOR_NORMAL = "#1e3a5f";
const COLOR_AVG_LINE = "#d97706";

const TREND_META = {
  increasing: { label: "Increasing", badge: "badge-good", Icon: TrendingUp },
  decreasing: { label: "Decreasing", badge: "badge-flag", Icon: TrendingDown },
  stable: { label: "Stable", badge: "badge-card", Icon: Minus },
  insufficient_data: { label: "Not enough data", badge: "badge-muted", Icon: Minus },
};

function TrendBadge({ trend }) {
  const { label, badge, Icon } = TREND_META[trend] ?? TREND_META.insufficient_data;
  return (
    <span className={`badge ${badge}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Icon size={14} /> {label}
    </span>
  );
}

const dayLabel = (iso) => format(parseISO(iso), "EEE d");
const formatPct = (n) => `${n > 0 ? "+" : ""}${Math.round(n)}%`;

export default function AIAnalyticsView() {
  const [branchId, setBranchId] = useState("all");
  const [itemId, setItemId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAnomalies, setShowAnomalies] = useState(false);

  const scope = branchId === "all" ? null : Number(branchId);

  const { data: branches = [] } = useBranches();
  const activeBranches = useMemo(() => branches.filter((b) => b.is_active), [branches]);

  const trends = useTrends(scope);
  const procurement = useProcurement(scope);
  const anomalies = useBranchAnomalies();
  const { mutate: refreshForecasts } = useRefreshForecasts();

  // Save today's forecast snapshot (one row per branch/item/day, so revisits don't pile up rows).
  useEffect(() => {
    refreshForecasts();
  }, [refreshForecasts]);

  useEffect(() => {
    if (!showAnomalies) return;
    const onKey = (e) => e.key === "Escape" && setShowAnomalies(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showAnomalies]);

  const items = useMemo(() => trends.data?.items ?? [], [trends.data]);
  const info = trends.data?.scope;
  const selected = items.find((i) => i.item_id === itemId) ?? items[0] ?? null;
  const scopeName =
    scope == null ? "All Branches" : activeBranches.find((b) => b.branch_id === scope)?.branch_name ?? "";

  function changeBranch(value) {
    setBranchId(value);
    setSelectedDay(null);
  }

  function changeItem(id) {
    setItemId(id);
    setSelectedDay(null);
  }

  const chart = useMemo(() => {
    if (!selected) return null;
    const avg = selected.moving_average;
    return {
      data: {
        labels: selected.series.map((s) => dayLabel(s.date)),
        datasets: [
          {
            type: "bar",
            label: "Daily Sales",
            data: selected.series.map((s) => s.quantity),
            backgroundColor: selected.series.map((s, i) =>
              i === selectedDay ? COLOR_SELECTED : s.quantity > avg ? COLOR_HIGH : COLOR_NORMAL
            ),
            borderRadius: 4,
            order: 2,
          },
          {
            type: "line",
            label: `${selected.series.length}-Day Moving Avg`,
            data: selected.series.map(() => avg),
            borderColor: COLOR_AVG_LINE,
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 14 } },
          tooltip: {
            callbacks: {
              label: (ctx) => (ctx.dataset.type === "line" ? `Moving avg: ${avg}` : `${ctx.parsed.y} servings sold`),
            },
          },
        },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        onClick: (_evt, elements) => {
          const bar = elements.find((el) => el.datasetIndex === 0);
          if (bar) setSelectedDay((prev) => (prev === bar.index ? null : bar.index));
        },
      },
    };
  }, [selected, selectedDay]);

  const day = selectedDay != null ? selected?.series[selectedDay] : null;
  const dayVsAvg =
    day && selected.moving_average > 0
      ? ((day.quantity - selected.moving_average) / selected.moving_average) * 100
      : 0;

  const flagged = (anomalies.data?.branches ?? []).filter((b) => b.flagged);
  const procurementItems = procurement.data?.items ?? [];

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">Analytics &amp; Procurement Recommendations</h2>
        <div className="view-filters">
          <select
            className="select-input"
            value={branchId}
            onChange={(e) => changeBranch(e.target.value)}
            aria-label="Branch"
          >
            <option value="all">All Branches</option>
            {activeBranches.map((b) => (
              <option key={b.branch_id} value={String(b.branch_id)}>
                {b.branch_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="panel" style={{ opacity: trends.isFetching && !trends.isLoading ? 0.6 : 1 }}>
          <div className="panel-header-row">
            <h3 className="panel-title">
              {info?.days_of_data ? `${info.days_of_data}-Day ` : ""}Sales Trend
              {selected ? ` — ${selected.item_name}` : ""} ({scopeName})
            </h3>
            <div className="view-filters">
              <select
                className="select-input select-sm"
                value={selected?.item_id ?? ""}
                onChange={(e) => changeItem(Number(e.target.value))}
                disabled={items.length === 0}
                aria-label="Menu item"
              >
                {items.map((m) => (
                  <option key={m.item_id} value={m.item_id}>
                    {m.item_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {trends.isLoading && <p className="loading-text">Loading analytics…</p>}

          {trends.error && !trends.data && (
            <div>
              <p className="error-text">Couldn't load analytics. {trends.error.message}</p>
              <button className="btn btn-navy" onClick={() => trends.refetch()}>Try again</button>
            </div>
          )}

          {info && info.days_of_data === 0 && (
            <p className="loading-text">
              No completed days of sales yet. Analytics use full days only, so today's sales appear tomorrow.
            </p>
          )}

          {info && info.days_of_data > 0 && items.length === 0 && (
            <p className="loading-text">No sales recorded for {scopeName} in this period.</p>
          )}

          {info && info.days_of_data > 0 && (
            <p className="panel-sub">
              Based on {info.days_of_data} completed day{info.days_of_data === 1 ? "" : "s"} (
              {format(parseISO(info.period_start), "MMM d")} – {format(parseISO(info.period_end), "MMM d")}).
              Today's sales are excluded until the day ends.
            </p>
          )}

          {selected && chart && (
            <>
              <div style={{ height: 260 }}>
                <Bar
                  data={chart.data}
                  options={chart.options}
                  role="img"
                  aria-label={`Daily servings of ${selected.item_name}. ${selected.series
                    .map((s) => `${dayLabel(s.date)}: ${s.quantity}`)
                    .join(". ")}. Moving average ${selected.moving_average}.`}
                />
              </div>

              {day && (
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: 6,
                    background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.4)",
                    fontSize: "0.875rem",
                  }}
                >
                  <span>
                    <strong>{dayLabel(day.date)}:</strong> {day.quantity} servings sold —{" "}
                    {dayVsAvg > 0
                      ? `${Math.round(dayVsAvg)}% above the average`
                      : dayVsAvg < 0
                      ? `${Math.abs(Math.round(dayVsAvg))}% below the average`
                      : "right at the average"}
                  </span>
                  <button
                    onClick={() => setSelectedDay(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
                    aria-label="Clear selected day"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="mini-stat-row">
                <div className="mini-stat">
                  <span className="mini-stat-label">{selected.series.length}-Day Moving Avg</span>
                  <span className="mini-stat-value">{selected.moving_average}</span>
                  <span className="mini-stat-sub">servings/day</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat-label">Trend Direction</span>
                  <span className="mini-stat-value" style={{ fontSize: "1rem" }}>
                    <TrendBadge trend={selected.trend} />
                  </span>
                  <span className="mini-stat-sub">
                    {selected.percent_change == null
                      ? `Needs at least 4 days (have ${selected.series.length})`
                      : `${formatPct(selected.percent_change)} vs earlier in the period`}
                  </span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat-label">Demand Rank</span>
                  <span className="mini-stat-value">#{selected.rank}</span>
                  <span className="mini-stat-sub">of {items.length} items sold</span>
                </div>
              </div>

              <h3 className="panel-title panel-title-spaced">All Menu Items — Trend Summary ({scopeName})</h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Avg / day</th>
                      <th>Trend</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.item_id} className={row.item_id === selected.item_id ? "row-highlight" : undefined}>
                        <td>
                          <button type="button" className="action-link" onClick={() => changeItem(row.item_id)}>
                            {row.item_name}
                          </button>
                        </td>
                        <td>{row.moving_average}</td>
                        <td><TrendBadge trend={row.trend} /></td>
                        <td>{row.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="analytics-side">
          <div className="panel panel-ai" style={{ opacity: procurement.isFetching && !procurement.isLoading ? 0.6 : 1 }}>
            <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Package size={18} /> Procurement Recommendations
            </h3>

            {procurement.data && (
              <p className="panel-sub">
                Sized to cover the next {procurement.data.horizon_days} days (
                {procurement.data.lead_time_days} days supplier lead time + {procurement.data.safety_stock_days} days safety stock).
              </p>
            )}
            {procurement.isLoading && <p className="loading-text">Calculating…</p>}
            {procurement.error && !procurement.data && (
              <p className="error-text">Couldn't load recommendations. {procurement.error.message}</p>
            )}

            {procurement.data && procurementItems.length === 0 && (
              <p className="loading-text">
                No reorders needed. Current stock covers projected demand for every ingredient.
              </p>
            )}

            {procurementItems.length > 0 && (
              <ul className="procurement-list">
                {procurementItems.map((p) => (
                  <li key={`${p.branch_id}-${p.ingredient_id}`}>
                    <span>
                      {p.ingredient_name}
                      {scope == null && <span className="modal-muted"> · {p.branch_name}</span>}
                      {p.urgent && (
                        <span className="badge badge-flag" style={{ marginLeft: 6 }}>Urgent</span>
                      )}
                      <small className="modal-muted" style={{ display: "block" }}>
                        {p.days_of_cover != null && `Stock lasts about ${p.days_of_cover} days`}
                        {p.used_by.length > 0 && ` · used by ${p.used_by.join(", ")}`}
                      </small>
                    </span>
                    <strong>Order {p.reorder_qty} {p.unit}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`panel ${flagged.length ? "panel-danger" : ""}`}>
            <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={18} /> Branch Flag
            </h3>

            {anomalies.isLoading && <p className="loading-text">Checking branches…</p>}
            {anomalies.error && <p className="error-text">Couldn't check branches. {anomalies.error.message}</p>}

            {anomalies.data && flagged.length > 0 && (
              <>
                <p className="danger-text">
                  {flagged.length === 1
                    ? `${flagged[0].branch_name} is ${flagged[0].percent_below}% below its usual pace`
                    : `${flagged.length} branches are below their usual pace`}
                </p>
                <p className="danger-sub">
                  Compares orders so far today with the average for this time of day over the last{" "}
                  {anomalies.data.window_days} days. Possible under-reporting or an operational issue.
                </p>
              </>
            )}
            {anomalies.data && flagged.length === 0 && <p>All branches are on their usual pace.</p>}

            <button
              className={`btn ${flagged.length ? "btn-red" : "btn-outline"} btn-block`}
              onClick={() => setShowAnomalies(true)}
              disabled={!anomalies.data}
            >
              View details →
            </button>
          </div>
        </div>
      </div>

      {showAnomalies && anomalies.data && (
        <div className="modal-overlay" onClick={() => setShowAnomalies(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="anomaly-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="anomaly-title">Branch Anomaly Detail</h3>
              <button type="button" className="modal-close" onClick={() => setShowAnomalies(false)} aria-label="Close">
                X
              </button>
            </div>
            <div className="modal-body">
              <p className="danger-sub" style={{ marginTop: 0 }}>
                A branch is flagged when its orders so far today are at least {anomalies.data.anomaly_threshold}% below
                the average for this time of day over the last {anomalies.data.window_days} days. Branches with very
                low volume are not judged.
              </p>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Expected by now</th>
                      <th>Actual today</th>
                      <th>% Below</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.data.branches.map((a) => (
                      <tr key={a.branch_id}>
                        <td>{a.branch_name}</td>
                        <td>{a.expected}</td>
                        <td>{a.actual}</td>
                        <td>{a.percent_below}%</td>
                        <td>
                          {a.flagged ? (
                            <span className="badge badge-flag">⚠ Flagged</span>
                          ) : !a.enough_history ? (
                            <span className="badge badge-muted">Not enough data</span>
                          ) : (
                            <span className="badge badge-good">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-outline btn-block" onClick={() => setShowAnomalies(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}