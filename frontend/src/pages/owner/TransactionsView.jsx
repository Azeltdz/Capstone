// src/pages/owner/TransactionsView.jsx
import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import { getTransactionsData } from "../../api/mockOwner";

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

export default function TransactionsView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

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

  const { stats, weeklyTrend, rows } = data;
  const maxVal = Math.max(...weeklyTrend.flatMap((d) => [d.poblacion, d.sanRoque]));

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">All Transactions</h2>
        <div className="view-filters">
          <select className="select-input" defaultValue="All Branches">
            <option>All Branches</option>
            <option>Poblacion</option>
            <option>San Roque</option>
          </select>
          <input type="text" className="search-input date-input" defaultValue="06/03/2026" readOnly />
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
                <div className={`bar navy ${d.projected ? "faded" : ""}`} style={{ height: `${(d.poblacion / maxVal) * 100}%` }} />
                <div className={`bar blue ${d.projected ? "faded" : ""}`} style={{ height: `${(d.sanRoque / maxVal) * 100}%` }} />
              </div>
              <span className="trend-day">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="legend">
          <span className="legend-item">
            <i className="legend-swatch navy" /> Poblacion
          </span>
          <span className="legend-item">
            <i className="legend-swatch blue" /> San Roque
          </span>
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
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
