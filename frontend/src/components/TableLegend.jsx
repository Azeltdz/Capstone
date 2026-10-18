export default function TableLegend() {
  return (
    <ul className="table-legend" aria-label="Table colour legend">
      <li><span className="legend-swatch" aria-hidden="true" /> Available</li>
      <li><span className="legend-swatch legend-swatch--unpaid" aria-hidden="true" /> Occupied · Unpaid</li>
      <li><span className="legend-swatch legend-swatch--paid" aria-hidden="true" /> Occupied · Paid</li>
    </ul>
  );
}