// src/pages/owner/FoodCostingView.jsx
import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import { getFoodCostingData } from "../../api/mockOwner";

function marginClass(margin) {
  if (margin >= 60) return "green-text";
  if (margin >= 58) return "orange-text";
  return "red-text";
}

function costClass(item) {
  if (item.cost / item.sellPrice > 0.4) return "red-text";
  return "orange-text";
}

export default function FoodCostingView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getFoodCostingData()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error-text">Couldn't load food costing. {error}</p>;
  if (!data) return <p className="loading-text">Loading food costing…</p>;

  const { stats, rows } = data;

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">Food Costing — Menu Items</h2>
        <button className="btn btn-navy">+ Add Menu Item</button>
      </div>

      <div className="stat-grid stat-grid-3">
        <StatCard label="Avg Food Cost %" value={stats.avgFoodCostPct} change="Target: <40%" changeType="warn" />
        <StatCard label="Highest Margin" value={stats.highestMarginItem} change={`${stats.highestMarginPct} margin`} changeType="up" valueClassName="stat-value-sm" />
        <StatCard label="Lowest Margin" value={stats.lowestMarginItem} change={`${stats.lowestMarginPct} margin`} changeType="warn" valueClassName="stat-value-sm" />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Menu Item</th>
              <th>Sell Price</th>
              <th>Cost/Serving</th>
              <th>Gross Margin</th>
              <th>Margin Bar</th>
              <th>BOM</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>₱{row.sellPrice.toFixed(2)}</td>
                <td className={costClass(row)}>₱{row.cost.toFixed(2)}</td>
                <td className={marginClass(row.margin)}>{row.margin.toFixed(1)}%</td>
                <td>
                  <div className="mini-bar-track">
                    <div className={`mini-bar ${row.margin >= 58 ? "green" : "orange"}`} style={{ width: `${row.margin}%` }} />
                  </div>
                </td>
                <td>
                  <span className="pill-count">{row.bomCount}</span>
                </td>
                <td>
                  <button className="btn btn-orange btn-sm">Edit</button> <button className="btn btn-red btn-sm">Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="footer-note">7 menu items · Gross margin auto-calculated from BOM ingredient costs</span>
    </>
  );
}
