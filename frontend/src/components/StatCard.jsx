// src/components/StatCard.jsx
export default function StatCard({ label, value, change, changeType, valueClassName }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${valueClassName || ""}`}>{value}</span>
      {change && <span className={`stat-change ${changeType || ""}`}>{change}</span>}
    </div>
  );
}
