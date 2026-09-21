// src/pages/owner/AIAnalyticsView.jsx
import { useEffect, useState } from "react";
import { getAnalyticsData } from "../../api/mockOwner";

function trendBadgeClass(trend) {
  if (trend === "INCREASING") return "badge-good";
  if (trend === "DECREASING") return "badge-flag";
  return "badge-card";
}

function trendArrow(trend) {
  if (trend === "INCREASING") return "↑ INCREASING";
  if (trend === "DECREASING") return "↓ DECREASING";
  return "→ STABLE";
}

export default function AIAnalyticsView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAnalyticsData()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error-text">Couldn't load analytics. {error}</p>;
  if (!data) return <p className="loading-text">Loading analytics…</p>;

  const { trend, movingAvg, trendDirection, trendNote, demandClass, demandNote, summary, procurement, branchFlag } = data;
  const maxVal = Math.max(...trend.map((d) => d.value));

  return (
    <>
      <h2 className="view-title">Analytics &amp; Procurement Recommendations</h2>

      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-header-row">
            <h3 className="panel-title">7-Day Sales Trend</h3>
            <div className="view-filters">
              <select className="select-input select-sm" defaultValue="Lomi Special">
                <option>Lomi Special</option>
                <option>Lechon Chami</option>
                <option>Chicken Lomi</option>
                <option>Chopsuey</option>
              </select>
              <select className="select-input select-sm" defaultValue="All Branches">
                <option>All Branches</option>
                <option>Poblacion</option>
                <option>San Roque</option>
              </select>
            </div>
          </div>

          <div className="trend-chart trend-chart-single">
            {trend.map((d) => (
              <div className="trend-col" key={d.day}>
                <div className="trend-bars">
                  <div
                    className={`bar ${d.projected ? "faded" : d.highVolume ? "blue" : "navy"}`}
                    style={{ height: `${(d.value / maxVal) * 100}%` }}
                  />
                </div>
                <span className="trend-value">{d.projected ? `~${d.value}` : d.value}</span>
                <span className="trend-day">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="legend">
            <span className="legend-item">
              <i className="legend-swatch navy" /> Actual
            </span>
            <span className="legend-item">
              <i className="legend-swatch blue" /> High Volume
            </span>
            <span className="legend-item">
              <i className="legend-swatch faded" /> Projected
            </span>
          </div>

          <div className="mini-stat-row">
            <div className="mini-stat">
              <span className="mini-stat-label">7-Day Moving Avg</span>
              <span className="mini-stat-value">{movingAvg}</span>
              <span className="mini-stat-sub">servings/day</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-label">Trend Direction</span>
              <span className="mini-stat-value green">{trendDirection}</span>
              <span className="mini-stat-sub">{trendNote}</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-label">Demand Class</span>
              <span className="mini-stat-value orange">{demandClass}</span>
              <span className="mini-stat-sub">{demandNote}</span>
            </div>
          </div>

          <h3 className="panel-title panel-title-spaced">All Menu Items — Trend Summary</h3>
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
                  <tr key={row.item}>
                    <td>{row.item}</td>
                    <td>{row.avg}</td>
                    <td>
                      <span className={`badge ${trendBadgeClass(row.trend)}`}>{trendArrow(row.trend)}</span>
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
            <h3 className="panel-title">📦 Procurement Recommendations</h3>
            <ul className="procurement-list">
              {procurement.map((p) => (
                <li key={p.item}>
                  <span>{p.item}</span>
                  <strong>{p.amount}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel panel-danger">
            <h3 className="panel-title">⚠ Branch Flag</h3>
            <p className="danger-text">{branchFlag.text}</p>
            <p className="danger-sub">{branchFlag.sub}</p>
            <button className="btn btn-red btn-block">Investigate →</button>
          </div>
        </div>
      </div>
    </>
  );
}
