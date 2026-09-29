// src/pages/owner/DashboardView.jsx
import { useCallback, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Title } from "chart.js";
import { BarChart3, Trophy, Lightbulb, Clock, RefreshCw, X } from "lucide-react";
import { format } from "date-fns";
import StatCard from "../../components/StatCard";
import { useDashboard } from "../../hooks/useAnalytics";
import { formatPeso, formatPesoWhole } from "../../utils/format";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Title);

const COLORS = {
  navy: "#1e3a5f",
  navyDark: "#16304e",
  blue: "#4a90d9",
  purple: "#7c5cbf",
  green: "#1e7a3e",
  orange: "#b3600a",
  border: "#e2e5ea",
  textSecondary: "#6b7280",
};

const BRANCH_COLORS = [COLORS.navy, COLORS.blue, COLORS.purple, COLORS.orange];
const withAlpha = (hex, alpha) => `${hex}${alpha}`;

const MAX_TOP_ITEMS = 10;
const MAX_NOTICES = 6;

const tooltipStyle = {
  backgroundColor: "#ffffff",
  titleColor: "#1a1a1a",
  bodyColor: COLORS.textSecondary,
  borderColor: COLORS.border,
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
  titleFont: { weight: "700", size: 13 },
  bodyFont: { size: 12.5 },
  displayColors: false,
};

const baseScaleOptions = {
  grid: { color: COLORS.border, drawTicks: false },
  ticks: { color: COLORS.textSecondary, font: { size: 12.5 } },
  border: { display: false },
};

const responsiveBase = {
  responsive: true,
  maintainAspectRatio: false,
  resizeDelay: 200,
  animation: false,
};

function changeVsYesterday(current, previous) {
  if (previous === 0) return { change: "No data at this time yesterday", changeType: "muted" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { change: "→ Same as this time yesterday", changeType: "muted" };
  return pct > 0
    ? { change: `↑ ${pct}% vs this time yesterday`, changeType: "up" }
    : { change: `↓ ${Math.abs(pct)}% vs this time yesterday`, changeType: "warn" };
}

function summarizeNames(names, max = 2) {
  const unique = [...new Set(names)];
  const shown = unique.slice(0, max).join(", ");
  return unique.length > max ? `${shown} +${unique.length - max} more` : shown;
}

function DashboardSkeleton() {
  return (
    <>
      <div className="stat-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card skeleton skeleton-stat-card" />
        ))}
      </div>
      <div className="dash-grid">
        <div className="panel panel-modern">
          <div className="skeleton skeleton-line skeleton-title" />
          <div className="skeleton skeleton-chart" />
        </div>
        <div className="panel panel-modern">
          <div className="skeleton skeleton-line skeleton-title" />
          <div className="skeleton skeleton-chart" />
        </div>
        <div className="panel panel-modern">
          <div className="skeleton skeleton-line skeleton-title" style={{ width: "40%" }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-line" />
          ))}
        </div>
        <div className="panel panel-modern">
          <div className="skeleton skeleton-line skeleton-title" style={{ width: "50%" }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-line" />
          ))}
        </div>
      </div>
    </>
  );
}

export default function DashboardView() {
  const { data, error, isLoading, isFetching, refetch, dataUpdatedAt } = useDashboard();
  const [selectedId, setSelectedId] = useState(null);

  const branches = useMemo(() => data?.branches ?? [], [data]);

  // If the selected branch disappears (e.g. deactivated), quietly fall back to "all".
  const activeId = branches.some((b) => b.branch_id === selectedId) ? selectedId : null;
  const selectedBranch = branches.find((b) => b.branch_id === activeId) ?? null;

  const toggleBranch = useCallback(
    (id) => setSelectedId((prev) => (prev === id ? null : id)),
    []
  );

  const visible = useMemo(
    () => (activeId ? branches.filter((b) => b.branch_id === activeId) : branches),
    [branches, activeId]
  );
  const visibleIds = useMemo(() => new Set(visible.map((b) => b.branch_id)), [visible]);

  // Stat cards follow the same filter as the panels.
  const totals = useMemo(
    () =>
      visible.reduce(
        (t, b) => ({
          sales: t.sales + b.sales_today,
          salesPrev: t.salesPrev + b.sales_yesterday,
          tx: t.tx + b.transactions_today,
          txPrev: t.txPrev + b.transactions_yesterday,
        }),
        { sales: 0, salesPrev: 0, tx: 0, txPrev: 0 }
      ),
    [visible]
  );

  const lowStock = useMemo(
    () => (data?.low_stock ?? []).filter((r) => visibleIds.has(r.branch_id)),
    [data, visibleIds]
  );

  const topItems = useMemo(() => {
    const byItem = new Map();
    for (const row of data?.top_items ?? []) {
      if (!visibleIds.has(row.branch_id)) continue;
      const entry = byItem.get(row.item_id) ?? { name: row.item_name, sold: 0 };
      entry.sold += row.total_sold;
      byItem.set(row.item_id, entry);
    }
    return [...byItem.values()].sort((a, b) => b.sold - a.sold).slice(0, MAX_TOP_ITEMS);
  }, [data, visibleIds]);

  // Branch pace anomalies first, then reorder advice, then "demand falling" notes.
  const notices = useMemo(() => {
    if (!data) return [];
    const list = [];
    for (const b of visible) {
      if (b.flagged) {
        list.push({
          key: `pace-${b.branch_id}`,
          kind: "pace",
          warn: true,
          text: `${b.branch_name} is ${b.percent_below}% below its usual pace for this time of day (${b.today_count} orders vs about ${b.baseline_avg}).`,
        });
      }
    }
    for (const r of data.recommendations) {
      if (!visibleIds.has(r.branch_id)) continue;
      list.push({
        key: `rec-${r.branch_id}-${r.item_id}`,
        kind: r.reorder_qty > 0 ? "reorder" : "trend",
        warn: r.reorder_qty > 0,
        text: activeId ? r.recommendation : `${r.branch_name}: ${r.recommendation}`,
      });
    }
    return list;
  }, [data, visible, visibleIds, activeId]);

  const salesChart = useMemo(() => {
    if (!branches.length) return null;
    return {
      data: {
        labels: branches.map((b) => b.branch_name),
        datasets: [
          {
            label: "Sales",
            data: branches.map((b) => b.sales_today),
            backgroundColor: branches.map((b, i) => {
              const base = BRANCH_COLORS[i % BRANCH_COLORS.length];
              if (!activeId) return base;
              return b.branch_id === activeId ? base : withAlpha(base, "33");
            }),
            borderRadius: 8,
            maxBarThickness: 64,
          },
        ],
      },
      options: {
        ...responsiveBase,
        onHover: (event, elements) => {
          event.native.target.style.cursor = elements.length ? "pointer" : "default";
        },
        onClick: (event, elements) => {
          if (!elements.length) return;
          toggleBranch(branches[elements[0].index].branch_id);
        },
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltipStyle, callbacks: { label: (ctx) => formatPeso(ctx.parsed.y) } },
        },
        scales: {
          x: { ...baseScaleOptions, grid: { display: false } },
          y: {
            ...baseScaleOptions,
            beginAtZero: true,
            ticks: { ...baseScaleOptions.ticks, callback: (v) => formatPesoWhole(v) },
          },
        },
      },
    };
  }, [branches, activeId, toggleBranch]);

  const topItemsChart = useMemo(() => {
    if (!topItems.length) return null;
    return {
      data: {
        labels: topItems.map((i) => i.name),
        datasets: [
          {
            label: "Sold",
            data: topItems.map((i) => i.sold),
            backgroundColor: COLORS.green,
            borderRadius: 6,
            maxBarThickness: 18,
          },
        ],
      },
      options: {
        ...responsiveBase,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltipStyle, callbacks: { label: (ctx) => `${ctx.parsed.x} sold` } },
        },
        scales: {
          x: { ...baseScaleOptions, beginAtZero: true, grid: { display: false } },
          y: {
            ...baseScaleOptions,
            grid: { display: false },
            ticks: {
              ...baseScaleOptions.ticks,
              callback: function (value) {
                const label = this.getLabelForValue(value);
                return label.length > 14 ? `${label.slice(0, 13)}…` : label;
              },
            },
          },
        },
      },
    };
  }, [topItems]);

  if (isLoading) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div>
        <p className="error-text">Couldn't load dashboard. {error?.message}</p>
        <button className="btn btn-navy" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const updatedLabel = format(new Date(dataUpdatedAt), "h:mm a");
  const topSeller = topItems[0];
  const pacePlaces = notices.filter((n) => n.kind === "pace").length;
  const reorders = notices.filter((n) => n.kind === "reorder").length;
  const flagCount = pacePlaces + reorders;
  const lowStockNames = summarizeNames(lowStock.map((r) => r.ingredient_name));

  return (
    <>
      <div className="dashboard-meta">
        <Clock size={14} />
        <span>Updated {updatedLabel}</span>
        <button
          type="button"
          className="filter-chip"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={13} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="error-text" role="alert">
          Couldn't refresh. Showing data from {updatedLabel}.
        </p>
      )}

      <div className="stat-grid">
        <StatCard
          label="Today's Sales"
          value={formatPeso(totals.sales)}
          {...changeVsYesterday(totals.sales, totals.salesPrev)}
        />
        <StatCard
          label="Transactions"
          value={totals.tx}
          {...changeVsYesterday(totals.tx, totals.txPrev)}
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStock.length}
          change={lowStock.length ? `⚠ ${lowStockNames}` : "All ingredients stocked"}
          changeType={lowStock.length ? "warn" : "up"}
        />
        <StatCard
          label="Analytics Flags"
          value={flagCount}
          change={flagCount ? `⚠ ${pacePlaces} branch pace, ${reorders} reorder` : "No flags"}
          changeType={flagCount ? "warn" : "up"}
          valueClassName="accent-purple"
        />
      </div>

      <div className="dash-grid">
        <div className="panel panel-modern panel-accent-navy">
          <div className="panel-header-row">
            <h3 className="panel-title panel-title-icon">
              <BarChart3 size={18} color={COLORS.navy} />
              Sales by Branch — Today
            </h3>
            {selectedBranch && (
              <button
                className="filter-chip"
                onClick={() => setSelectedId(null)}
                aria-label={`Clear ${selectedBranch.branch_name} filter`}
              >
                {selectedBranch.branch_name}
                <X size={13} />
              </button>
            )}
          </div>
          <p className="panel-sub">Click a bar or a branch below to filter the dashboard</p>
          {salesChart ? (
            <div className="chart-box">
              <Bar
                data={salesChart.data}
                options={salesChart.options}
                role="img"
                aria-label={`Bar chart of today's sales by branch. ${branches
                  .map((b) => `${b.branch_name}: ${formatPeso(b.sales_today)}`)
                  .join(". ")}`}
              />
            </div>
          ) : (
            <p className="panel-sub" style={{ margin: "1rem 0" }}>
              No active branches yet.
            </p>
          )}
        </div>

        <div className="panel panel-modern panel-accent-green">
          <h3 className="panel-title panel-title-icon">
            <Trophy size={18} color={COLORS.green} />
            Top Menu Items Today
          </h3>
          {topItemsChart ? (
            <div className="chart-box">
              <Bar
                data={topItemsChart.data}
                options={topItemsChart.options}
                role="img"
                aria-label={`Bar chart of top selling items today. ${topItems
                  .map((i) => `${i.name}: ${i.sold} sold`)
                  .join(". ")}`}
              />
            </div>
          ) : (
            <p className="panel-sub" style={{ margin: "1rem 0" }}>
              No items sold yet today{selectedBranch ? ` at ${selectedBranch.branch_name}` : ""}.
            </p>
          )}
          {topSeller && (
            <div className="best-seller-note">
              <Trophy size={14} />
              <span>
                <strong>{topSeller.name}</strong> is today's best seller — {topSeller.sold} sold
              </span>
            </div>
          )}
        </div>

        <div className="panel panel-modern panel-accent-blue">
          <h3 className="panel-title">Branch Status</h3>
          {branches.map((b) => {
            const dimmed = activeId && b.branch_id !== activeId;
            return (
              <div
                className="branch-status-row"
                key={b.branch_id}
                role="button"
                tabIndex={0}
                aria-pressed={activeId === b.branch_id}
                onClick={() => toggleBranch(b.branch_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleBranch(b.branch_id);
                  }
                }}
                style={{ cursor: "pointer", opacity: dimmed ? 0.5 : 1 }}
              >
                <span className={`status-dot-lg ${b.flagged ? "orange" : "green"}`} />
                <span className="branch-name">{b.branch_name}</span>
                <span className={`branch-sales ${b.flagged ? "orange" : "green"}`}>
                  {formatPeso(b.sales_today)}
                </span>
                <span className={`badge badge-${b.flagged ? "warn" : "good"}`}>
                  {b.flagged ? "Flagged" : "On pace"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="panel panel-ai panel-modern panel-accent-purple">
          <h3 className="panel-title panel-title-icon">
            <Lightbulb size={18} color={COLORS.purple} />
            Recommendations
          </h3>
          {notices.length > 0 ? (
            <ul className="ai-list">
              {notices.slice(0, MAX_NOTICES).map((n) => (
                <li key={n.key} className={n.warn ? "ai-warn" : ""}>
                  {n.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-sub" style={{ margin: "1rem 0" }}>
              Nothing needs attention right now.
            </p>
          )}
          {notices.length > MAX_NOTICES && (
            <p className="panel-sub">+{notices.length - MAX_NOTICES} more in Analytics</p>
          )}
          <p className="panel-sub">
            {data.recommendations_as_of
              ? `Forecasts computed ${format(new Date(data.recommendations_as_of), "MMM d, h:mm a")}`
              : "No recent forecast yet. Open Analytics to generate one."}
          </p>
        </div>
      </div>
    </>
  );
}