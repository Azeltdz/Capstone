// src/pages/owner/DashboardView.jsx
import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import { getDashboardData } from "../../api/mockOwner";

export default function DashboardView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getDashboardData()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error-text">Couldn't load dashboard. {error}</p>;
  if (!data) return <p className="loading-text">Loading dashboard…</p>;

  const { stats, salesByBranch, topItems, branchStatus, aiRecommendations } = data;

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Today's Sales" value={`₱${stats.todaySales.toLocaleString()}`} change={`↑ ${stats.todaySalesChange}`} changeType="up" />
        <StatCard label="Transactions" value={stats.transactions} change={`↑ ${stats.transactionsChange}`} changeType="up" />
        <StatCard label="Low Stock Alerts" value={stats.lowStockAlerts} change={`⚠ ${stats.lowStockNote}`} changeType="warn" />
        <StatCard label="AI Flags" value={stats.aiFlags} change={`⚠ ${stats.aiFlagNote}`} changeType="warn" valueClassName="accent-purple" />
      </div>

      <div className="dash-grid">
        <div className="panel">
          <h3 className="panel-title">📊 Sales by Branch — Today (Bar Chart)</h3>
          <div className="bar-chart">
            {salesByBranch.map((b, i) => (
              <div className="bar-col" key={b.branch}>
                <span className="bar-value">₱{b.sales.toLocaleString()}</span>
                <div className={`bar ${i === 0 ? "navy" : "blue"}`} style={{ height: `${b.pct}%` }} />
                <span className="bar-label">{b.branch}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">🏆 Top Menu Items Today</h3>
          <ul className="ranked-list">
            {topItems.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <strong className="green">{item.sold} sold</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h3 className="panel-title">Branch Status</h3>
          {branchStatus.map((b) => (
            <div className="branch-status-row" key={b.name}>
              <span className={`status-dot-lg ${b.dotClass}`} />
              <span className="branch-name">{b.name}</span>
              <span className={`branch-sales ${b.dotClass === "green" ? "green" : "orange"}`}>₱{b.sales.toLocaleString()}</span>
              <span className={`badge badge-${b.statusClass}`}>{b.status}</span>
            </div>
          ))}
        </div>

        <div className="panel panel-ai">
          <h3 className="panel-title">✍️ AI Recommendations</h3>
          <ul className="ai-list">
            {aiRecommendations.map((r, i) => (
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
