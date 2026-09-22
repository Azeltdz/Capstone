// src/pages/owner/DashboardView.jsx
import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Title,
} from "chart.js";
import { BarChart3, Trophy, Sparkles, Clock, X } from "lucide-react";
import StatCard from "../../components/StatCard";
import { getDashboardData } from "../../api/mockOwner";

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
// Appends alpha (in hex) to a 6-digit hex color, used to fade out
// non-selected bars once a branch is picked.
const withAlpha = (hex, alpha) => `${hex}${alpha}`;

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
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  // Branch selected by clicking a bar in the Sales chart. null = no filter.
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardData()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLastUpdated(new Date());
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const salesChart = useMemo(() => {
    if (!data) return null;
    const branches = data.salesByBranch;
    return {
      data: {
        labels: branches.map((b) => b.branch),
        datasets: [
          {
            label: "Sales",
            data: branches.map((b) => b.sales),
            backgroundColor: branches.map((b, i) => {
              const base = BRANCH_COLORS[i % BRANCH_COLORS.length];
              if (!selectedBranch) return base;
              return b.branch === selectedBranch ? base : withAlpha(base, "33");
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
        // Clicking a bar sets the filter; clicking the already-selected
        // bar again clears it.
        onClick: (event, elements) => {
          if (!elements.length) return;
          const clicked = branches[elements[0].index].branch;
          setSelectedBranch((prev) => (prev === clicked ? null : clicked));
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipStyle,
            callbacks: { label: (ctx) => `₱${ctx.parsed.y.toLocaleString()}` },
          },
        },
        scales: {
          x: { ...baseScaleOptions, grid: { display: false } },
          y: {
            ...baseScaleOptions,
            beginAtZero: true,
            ticks: {
              ...baseScaleOptions.ticks,
              callback: (v) => `₱${Number(v).toLocaleString()}`,
            },
          },
        },
      },
    };
  }, [data, selectedBranch]);

  // Items are shown if they don't carry a branch tag at all (so this still
  // works with your current mock data), or if their branch matches the
  // selected filter.
  const sortedTopItems = useMemo(() => {
    if (!data) return [];
    const inBranch = (item) => !selectedBranch || !item.branch || item.branch === selectedBranch;
    return [...data.topItems].filter(inBranch).sort((a, b) => b.sold - a.sold).slice(0, 20);
  }, [data, selectedBranch]);

  const topItemsChart = useMemo(() => {
    if (!sortedTopItems.length) return null;
    return {
      data: {
        labels: sortedTopItems.map((i) => i.name),
        datasets: [
          {
            label: "Sold",
            data: sortedTopItems.map((i) => i.sold),
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
          tooltip: {
            ...tooltipStyle,
            callbacks: { label: (ctx) => `${ctx.parsed.x} sold` },
          },
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
  }, [sortedTopItems]);

  if (error) return <p className="error-text">Couldn't load dashboard. {error}</p>;
  if (!data) return <DashboardSkeleton />;

  const { stats, branchStatus, aiRecommendations } = data;
  const topSeller = sortedTopItems[0];

  const visibleBranchStatus = selectedBranch
    ? branchStatus.filter((b) => b.name === selectedBranch)
    : branchStatus;

  const visibleAiRecommendations = selectedBranch
    ? aiRecommendations.filter((r) => !r.branch || r.branch === selectedBranch)
    : aiRecommendations;

  return (
    <>
      <div className="dashboard-meta">
        <Clock size={14} />
        <span>
          Updated{" "}
          {lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="stat-grid">
        <StatCard label="Today's Sales" value={`₱${stats.todaySales.toLocaleString()}`} change={`↑ ${stats.todaySalesChange}`} changeType="up" />
        <StatCard label="Transactions" value={stats.transactions} change={`↑ ${stats.transactionsChange}`} changeType="up" />
        <StatCard label="Low Stock Alerts" value={stats.lowStockAlerts} change={`⚠ ${stats.lowStockNote}`} changeType="warn" />
        <StatCard label="AI Flags" value={stats.aiFlags} change={`⚠ ${stats.aiFlagNote}`} changeType="warn" valueClassName="accent-purple" />
      </div>

      <div className="dash-grid">
        <div className="panel panel-modern panel-accent-navy">
          <div className="panel-header-row">
            <h3 className="panel-title panel-title-icon">
              <BarChart3 size={18} color={COLORS.navy} />
              Sales by Branch — Today
            </h3>
            {selectedBranch && (
              <button className="filter-chip" onClick={() => setSelectedBranch(null)}>
                {selectedBranch}
                <X size={13} />
              </button>
            )}
          </div>
          <p className="panel-sub">Click a bar to filter the dashboard by branch</p>
          <div className="chart-box">
            <Bar data={salesChart.data} options={salesChart.options} />
          </div>
        </div>

        <div className="panel panel-modern panel-accent-green">
          <h3 className="panel-title panel-title-icon">
            <Trophy size={18} color={COLORS.green} />
            Top Menu Items Today
          </h3>
          {topItemsChart ? (
            <div className="chart-box">
              <Bar data={topItemsChart.data} options={topItemsChart.options} />
            </div>
          ) : (
            <p className="panel-sub" style={{ margin: "1rem 0" }}>
              No items recorded for {selectedBranch} today.
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
          {visibleBranchStatus.map((b) => (
            <div className="branch-status-row" key={b.name}>
              <span className={`status-dot-lg ${b.dotClass}`} />
              <span className="branch-name">{b.name}</span>
              <span className={`branch-sales ${b.dotClass === "green" ? "green" : "orange"}`}>₱{b.sales.toLocaleString()}</span>
              <span className={`badge badge-${b.statusClass}`}>{b.status}</span>
            </div>
          ))}
        </div>

        <div className="panel panel-ai panel-modern panel-accent-purple">
          <h3 className="panel-title panel-title-icon">
            <Sparkles size={18} color={COLORS.purple} />
            AI Recommendations
          </h3>
          <ul className="ai-list">
            {visibleAiRecommendations.map((r, i) => (
              <li key={i} className={r.warn ? "ai-warn" : ""}>
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}