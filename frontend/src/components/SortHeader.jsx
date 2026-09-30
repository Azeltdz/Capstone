export default function SortHeader({ label, sortKey, activeKey, dir, onSort, className }) {
  const active = activeKey === sortKey;
  return (
    <th className={className} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`sort-btn ${active ? "sort-active" : ""}`} onClick={() => onSort(sortKey)}>
        {label}
        <span className="sort-arrow">{active ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}