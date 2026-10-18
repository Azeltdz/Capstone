export default function TableLegend() {
  return (
    <ul className="tt-legend" aria-label="Table colours">
      <li><span className="tt-swatch tt-swatch--free" /> Available</li>
      <li><span className="tt-swatch tt-swatch--unpaid" /> Seated, unpaid</li>
      <li><span className="tt-swatch tt-swatch--paid" /> Seated, paid</li>
    </ul>
  );
}