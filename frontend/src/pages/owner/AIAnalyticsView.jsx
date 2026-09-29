// src/pages/owner/AIAnalyticsView.jsx
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { TrendingUp, TrendingDown, Minus, Package, AlertTriangle, X } from "lucide-react";
import { getAnalyticsData, getAnalyticsFilters } from "../../api/mockOwner";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const COLOR_SELECTED = "#f59e0b"; // amber — the day the owner clicked on
const COLOR_HIGH = "#3b82f6"; // blue — above the 7-day average
const COLOR_NORMAL = "#1e3a5f"; // navy — everything else
const COLOR_AVG_LINE = "#d97706";

function trendBadgeClass(trend) {
  if (trend === "INCREASING") return "badge-good";
  if (trend === "DECREASING") return "badge-flag";
  return "badge-card";
}

function TrendIcon({ trend, size = 14 }) {
  if (trend === "INCREASING") return <TrendingUp size={size} />;
  if (trend === "DECREASING") return <TrendingDown size={size} />;
  return <Minus size={size} />;
}

export default function AIAnalyticsView() {
  const [filters, setFilters] = useState(null); // { menuItems, branches }
  const [itemId, setItemId] = useState(1);
  const [branchId, setBranchId] = useState(null); // null = "All Branches"

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedDayIndex, setSelectedDayIndex] = useState(null); // clicked bar, filters the callout below the chart
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);

  // Populate the two dropdowns once on mount.
  useEffect(() => {
    let cancelled = false;
    getAnalyticsFilters().then((f) => !cancelled && setFilters(f));
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-run the analytics engine whenever either filter changes.
  useEffect(() => {
    let cancelled = false;
    setData(null);
    setSelectedDayIndex(null);
    getAnalyticsData({ itemId, branchId })
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [itemId, branchId]);

  if (error) return <p className="error-text">Couldn't load analytics. {error}</p>;
  if (!data || !filters) return <p className="loading-text">Loading analytics…</p>;

  const { trend, movingAvg, trendDirection, trendNote, demandClass, demandNote, summary, procurement, branchFlag, branchAnomalies } = data;
  const selectedItemName = filters.menuItems.find((m) => m.id === itemId)?.name ?? "";
  const selectedBranchName = branchId == null ? "All Branches" : filters.branches.find((b) => b.id === branchId)?.name ?? "";

  const chartData = {
    labels: trend.map((d) => d.day),
    datasets: [
      {
        type: "bar",
        label: "Daily Sales",
        data: trend.map((d) => d.value),
        backgroundColor: trend.map((d, i) => (i === selectedDayIndex ? COLOR_SELECTED : d.highVolume ? COLOR_HIGH : COLOR_NORMAL)),
        borderRadius: 4,
        order: 2,
      },
      {
        type: "line",
        label: "7-Day Moving Avg",
        data: trend.map(() => movingAvg),
        borderColor: COLOR_AVG_LINE,
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        order: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 14 } },
      tooltip: {
        callbacks: {
          label: (ctx) => (ctx.dataset.type === "line" ? `Moving avg: ${ctx.parsed.y}` : `${ctx.parsed.y} servings sold`),
        },
      },
    },
    scales: { y: { beginAtZero: true } },
    // Clicking a bar selects/deselects that day — this is the "filter" the chart supports.
    onClick: (_evt, elements) => {
      if (elements.length === 0) return;
      const clicked = elements.find((el) => el.datasetIndex === 0) ?? elements[0];
      setSelectedDayIndex((prev) => (prev === clicked.index ? null : clicked.index));
    },
  };

  const selectedDay = selectedDayIndex != null ? trend[selectedDayIndex] : null;
  const selectedDayPctVsAvg = selectedDay && movingAvg > 0 ? ((selectedDay.value - movingAvg) / movingAvg) * 100 : 0;

  return (
    <>
      <h2 className="view-title">Analytics &amp; Procurement Recommendations</h2>

      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-header-row">
            <h3 className="panel-title">
              7-Day Sales Trend — {selectedItemName} ({selectedBranchName})
            </h3>
            <div className="view-filters">
              <select className="select-input select-sm" value={itemId} onChange={(e) => setItemId(Number(e.target.value))}>
                {filters.menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                className="select-input select-sm"
                value={branchId ?? "all"}
                onChange={(e) => setBranchId(e.target.value === "all" ? null : Number(e.target.value))}
              >
                <option value="all">All Branches</option>
                {filters.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ height: 260 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>

          {selectedDay && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "0.5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: 6,
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                fontSize: "0.875rem",
              }}
            >
              <span>
                <strong>{selectedDay.day}:</strong> {selectedDay.value} servings sold —{" "}
                {selectedDayPctVsAvg > 0
                  ? `${selectedDayPctVsAvg.toFixed(0)}% above the 7-day average`
                  : selectedDayPctVsAvg < 0
                  ? `${Math.abs(selectedDayPctVsAvg).toFixed(0)}% below the 7-day average`
                  : "right at the 7-day average"}
              </span>
              <button
                onClick={() => setSelectedDayIndex(null)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
                aria-label="Clear selected day"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="mini-stat-row">
            <div className="mini-stat">
              <span className="mini-stat-label">7-Day Moving Avg</span>
              <span className="mini-stat-value">{movingAvg}</span>
              <span className="mini-stat-sub">servings/day</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-label">Trend Direction</span>
              <span className="mini-stat-value green" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <TrendIcon trend={trendDirection} size={16} /> {trendDirection}
              </span>
              <span className="mini-stat-sub">{trendNote}</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-label">Demand Class</span>
              <span className="mini-stat-value orange">{demandClass}</span>
              <span className="mini-stat-sub">{demandNote}</span>
            </div>
          </div>

          <h3 className="panel-title panel-title-spaced">
            All Menu Items — Trend Summary {branchId == null ? "" : `(${selectedBranchName})`}
          </h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>7-Day Avg</th>
                  <th>Trend</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.item} className={row.item === selectedItemName ? "row-highlight" : undefined}>
                    <td>{row.item}</td>
                    <td>{row.avg}</td>
                    <td>
                      <span className={`badge ${trendBadgeClass(row.trend)}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <TrendIcon trend={row.trend} /> {row.trend}
                      </span>
                    </td>
                    <td>{row.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="analytics-side">
          <div className="panel panel-ai">
            <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Package size={18} /> Procurement Recommendations
            </h3>
            {procurement.length === 0 ? (
              <p className="loading-text">No reorders needed this cycle — every ingredient tied to rising-demand items is sufficiently stocked.</p>
            ) : (
              <ul className="procurement-list">
                {procurement.map((p) => (
                  <li key={p.item}>
                    <span>{p.item}</span>
                    <strong>{p.amount}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel panel-danger">
            <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={18} /> Branch Flag
            </h3>
            <p className="danger-text">{branchFlag.text}</p>
            <p className="danger-sub">{branchFlag.sub}</p>
            <button className="btn btn-red btn-block" onClick={() => setShowAnomalyModal(true)}>
              Investigate →
            </button>
          </div>
        </div>
      </div>

      {showAnomalyModal && (
        <div
          onClick={() => setShowAnomalyModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "1.25rem 1.5rem",
              width: "min(560px, 92vw)",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <AlertTriangle size={20} /> Branch Anomaly Detail
              </h3>
              <button
                onClick={() => setShowAnomalyModal(false)}
                aria-label="Close"
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
              >
                <X size={22} />
              </button>
            </div>

            <p className="danger-sub" style={{ marginTop: 0 }}>
              A branch is flagged when today's transaction count is more than 20% below its prior 7-day average.
            </p>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Expected</th>
                    <th>Actual Today</th>
                    <th>% Below</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {branchAnomalies.map((a) => (
                    <tr key={a.branchId}>
                      <td>{a.branch}</td>
                      <td>{Math.round(a.expected)}</td>
                      <td>{a.actual}</td>
                      <td>{a.pctBelow.toFixed(0)}%</td>
                      <td>
                        <span className={`badge ${a.flagged ? "badge-flag" : "badge-good"}`}>{a.flagged ? "⚠ Flagged" : "OK"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: "right", marginTop: "1rem" }}>
              <button className="btn btn-red" onClick={() => setShowAnomalyModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}