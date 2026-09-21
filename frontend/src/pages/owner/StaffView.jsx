// src/pages/owner/StaffView.jsx
import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import { getStaffData } from "../../api/mockOwner";

export default function StaffView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getStaffData()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error-text">Couldn't load staff. {error}</p>;
  if (!data) return <p className="loading-text">Loading staff…</p>;

  const { stats, rows } = data;

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">Staff Management</h2>
        <button className="btn btn-navy">+ Add Staff Account</button>
      </div>

      <div className="stat-grid stat-grid-3">
        <StatCard label="Total Staff" value={stats.total} change="Across 2 branches" changeType="muted" />
        <StatCard label="Active Accounts" value={stats.activeAccounts} change="All accounts active" changeType="up" />
        <StatCard label="Roles" value={stats.roles} valueClassName="stat-value-sm" />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Branch</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.username} className={row.isAdmin ? "row-highlight" : ""}>
                <td className="cell-strong">{row.name}</td>
                <td className="mono">{row.username}</td>
                <td>{row.branch}</td>
                <td>
                  <span className={`badge ${row.isAdmin ? "badge-admin" : "badge-cashier"}`}>{row.role}</span>
                </td>
                <td>
                  <span className="badge badge-good">{row.status}</span>
                </td>
                <td>
                  {row.isAdmin ? (
                    <span className="muted-cell">—</span>
                  ) : (
                    <>
                      <button className="action-link">Edit</button> <button className="action-link action-danger">Deactivate</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="footer-note">Showing {rows.length} of 7 staff accounts · Deactivated accounts preserve transaction history</span>
    </>
  );
}
