export default function StatCard({ label, value, change, changeType, valueClassName }) {
  const tooltip = typeof value === "string" || typeof value === "number" ? String(value) : undefined;

  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${valueClassName || ""}`} title={tooltip}>{value}</span>
      {change && <span className={`stat-change ${changeType || ""}`}>{change}</span>}
    </div>
  );
}