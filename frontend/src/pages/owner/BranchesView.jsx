// src/pages/owner/BranchesView.jsx
import { useEffect, useState } from "react";
import { getBranchesData } from "../../api/mockOwner";

export default function BranchesView() {
  const [branches, setBranches] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getBranchesData()
      .then((d) => !cancelled && setBranches(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error-text">Couldn't load branches. {error}</p>;
  if (!branches) return <p className="loading-text">Loading branches…</p>;

  return (
    <>
      <h2 className="view-title">Branch Management — {branches.length} Active Branches</h2>

      <div className="branch-grid">
        {branches.map((b) => (
          <div className={`branch-card ${b.flagged ? "branch-card-flag" : "branch-card-main"}`} key={b.name}>
            <div className="branch-card-header">
              <h3>{b.name}</h3>
              <span className={`badge ${b.flagged ? "badge-flag" : "badge-good"}`}>{b.tag}</span>
            </div>
            <p className="branch-location">{b.location}</p>
            <div className="branch-row">
              <span>Staff count</span>
              <strong>{b.staffCount}</strong>
            </div>
            <div className="branch-row">
              <span>Status</span>
              <span className={`badge ${b.flagged ? "badge-warn" : "badge-good"}`}>{b.status}</span>
            </div>
            <div className="branch-row">
              <span>Today's sales</span>
              <strong className={b.flagged ? "orange-text" : "green-text"}>₱{b.sales.toLocaleString()}</strong>
            </div>
            <div className="branch-row">
              <span>Contact</span>
              <strong>{b.contact}</strong>
            </div>
            <button className="btn btn-outline btn-block">Edit Branch</button>
          </div>
        ))}
      </div>
    </>
  );
}
