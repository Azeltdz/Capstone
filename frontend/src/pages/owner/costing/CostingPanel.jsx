import { useMemo, useState } from "react";
import SortHeader from "../../../components/SortHeader";
import { getCategoryMeta } from "../../../constants/categoryMeta";
import { TARGET_FOOD_COST_PCT, costTone } from "../../../constants/costing";
import { formatPeso } from "../../../utils/format";

const PAGE_SIZES = [10, 25, 50];
const COLUMNS = 7;

const SORT_VALUE = {
  price: (i) => i.selling_price,
  cost: (i) => i.cost_per_serving,
  margin: (i) => i.margin_percent,
};

function compare(a, b, key, dir) {
  const byName = a.item_name.localeCompare(b.item_name);
  if (key === "name") return dir === "asc" ? byName : -byName;
  const av = SORT_VALUE[key](a);
  const bv = SORT_VALUE[key](b);
  if (av == null && bv == null) return byName;
  if (av == null) return 1;
  if (bv == null) return -1;
  return (dir === "asc" ? av - bv : bv - av) || byName;
}

const STATUS_FILTERS = {
  all: () => true,
  missing: (i) => i.bom_count === 0,
  high: (i) => i.food_cost_percent != null && i.food_cost_percent > TARGET_FOOD_COST_PCT,
};

export default function CostingPanel({ items, onOpenRecipe }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("margin");
  const [dir, setDir] = useState("asc");
  const [pageSize, setPageSize] = useState(10);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(
        (i) =>
          (category === "all" || i.category === category) &&
          (!q || i.item_name.toLowerCase().includes(q)) &&
          STATUS_FILTERS[status](i)
      )
      .sort((a, b) => compare(a, b, sort, dir));
  }, [items, search, category, status, sort, dir]);

  const filterKey = JSON.stringify({ search, category, status, sort, dir, pageSize });
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageState.key === filterKey ? pageState.page : 1, pageCount);
  const goToPage = (p) => setPageState({ key: filterKey, page: p });

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = filtered.length ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, filtered.length);
  const hasFilters = search !== "" || category !== "all" || status !== "all";

  function handleSort(key) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("asc");
    }
  }

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setStatus("all");
  }

  return (
    <>
      <div className="table-toolbar">
        <div className="search-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text" className="search-input" placeholder="Search menu item…"
            aria-label="Search menu items" value={search} onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">✕</button>
          )}
        </div>
        <select className="select-input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select-input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All items</option>
          <option value="missing">Missing recipe</option>
          <option value="high">Above target cost</option>
        </select>
        {hasFilters && <button type="button" className="btn-text" onClick={clearFilters}>Clear filters</button>}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <SortHeader label="Menu Item" sortKey="name" activeKey={sort} dir={dir} onSort={handleSort} />
              <th>Category</th>
              <SortHeader label="Sell Price" sortKey="price" activeKey={sort} dir={dir} onSort={handleSort} />
              <SortHeader label="Cost / Serving" sortKey="cost" activeKey={sort} dir={dir} onSort={handleSort} />
              <SortHeader label="Gross Margin" sortKey="margin" activeKey={sort} dir={dir} onSort={handleSort} />
              <th>Margin Bar</th>
              <th>Recipe</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS} className="table-status">
                  {items.length === 0 ? "No menu items yet. Add them on the Menu page." : "No menu items match your filters."}
                </td>
              </tr>
            )}
            {pageRows.map((item) => {
              const costed = item.margin_percent != null;
              return (
                <tr key={item.item_id} style={{ opacity: item.is_available ? 1 : 0.6 }}>
                  <td>
                    {item.item_name}
                    {!item.is_available && <span className="badge badge-muted" style={{ marginLeft: 6 }}>Hidden</span>}
                  </td>
                  <td>
                    <span className="menu-pill" style={{ "--pill-accent": getCategoryMeta(item.category).accent }}>
                      {item.category || "—"}
                    </span>
                  </td>
                  <td>{formatPeso(item.selling_price)}</td>
                  <td>{item.cost_per_serving != null ? formatPeso(item.cost_per_serving) : "—"}</td>
                  <td className={costTone(item.food_cost_percent)}>
                    {costed
                      ? `${formatPeso(item.gross_margin)} · ${item.margin_percent.toFixed(1)}%`
                      : <span className="badge badge-warn">No recipe</span>}
                  </td>
                  <td>
                    <div className="mini-bar-track" role="img" aria-label={costed ? `Margin ${item.margin_percent}%` : "No margin"}>
                      {costed && (
                        <div
                          className={`mini-bar ${item.food_cost_percent <= TARGET_FOOD_COST_PCT ? "green" : "orange"}`}
                          style={{ width: `${Math.max(0, Math.min(100, item.margin_percent))}%` }}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <button type="button" className="action-link" onClick={() => onOpenRecipe(item)}>
                      {item.bom_count ? `${item.bom_count} ingredient${item.bom_count === 1 ? "" : "s"}` : "Add recipe"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing {rangeStart}-{rangeEnd} of {filtered.length}
            <select className="select-input select-sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Rows per page">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="pagination-controls">
            <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => goToPage(1)}>« First</button>
            <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>‹ Prev</button>
            <span className="pagination-page">Page {page} of {pageCount}</span>
            <button type="button" className="btn-outline btn-sm" disabled={page >= pageCount} onClick={() => goToPage(page + 1)}>Next ›</button>
            <button type="button" className="btn-outline btn-sm" disabled={page >= pageCount} onClick={() => goToPage(pageCount)}>Last »</button>
          </div>
        </div>
      )}
    </>
  );
}