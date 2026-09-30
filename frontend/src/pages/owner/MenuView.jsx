// src/pages/owner/MenuView.jsx
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useMenuItems, useUpdateMenuItem } from "../../hooks/useMenuItems";
import { useFoodCosting } from "../../hooks/useFoodCosting";
import { getCategoryMeta } from "../../constants/categoryMeta";
import { formatPeso } from "../../utils/format";
import { imageSrc } from "../../utils/image";
import Pagination from "../../components/Pagination";
import ItemFormModal from "./menu/ItemFormModal";
import DeleteItemModal from "./menu/DeleteItemModal";
import RecipeModal from "./costing/RecipeModal";

const COLUMNS = 5;

function Thumb({ url }) {
  const src = imageSrc(url);
  return src ? (
    <img src={src} alt="" width={40} height={40} loading="lazy"
          style={{ objectFit: "cover", borderRadius: 6, background: "#f3f4f6", flexShrink: 0 }} />
  ) : (
    <span aria-hidden="true" style={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 6, background: "#f3f4f6", flexShrink: 0 }}>🍽️</span>
  );
}

export default function MenuView() {
  const { data: items = [], isLoading, error, refetch } = useMenuItems();
  const costing = useFoodCosting();
  const toggle = useUpdateMenuItem();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [pageSize, setPageSize] = useState(10);

  const [formItem, setFormItem] = useState(undefined); // undefined = closed, null = new, object = editing
  const [deleting, setDeleting] = useState(null);
  const [recipeItem, setRecipeItem] = useState(null);

  const recipeCount = useMemo(
    () => new Map((costing.data?.items ?? []).map((i) => [i.item_id, i.bom_count])),
    [costing.data]
  );
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
          (availability === "all" || (availability === "on") === i.is_available) &&
          (!q || i.item_name.toLowerCase().includes(q))
      )
      .sort(
        (a, b) =>
          (a.category || "").localeCompare(b.category || "") || a.item_name.localeCompare(b.item_name)
      );
  }, [items, search, category, availability]);

  const filterKey = JSON.stringify({ search, category, availability, pageSize });
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageState.key === filterKey ? pageState.page : 1, pageCount);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = search !== "" || category !== "all" || availability !== "all";

  function toggleAvailability(item) {
    toggle.mutate(
      { id: item.item_id, body: JSON.stringify({ is_available: !item.is_available }) },
      {
        onSuccess: () =>
          toast.success(`${item.item_name} ${item.is_available ? "hidden from" : "added to"} the menu`),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="panel">
      <div className="menu-toolbar">
        <h3 className="panel-title">🍜 Menu Items</h3>
        <div className="menu-toolbar-controls">
          <input className="menu-input" type="text" placeholder="Search item…" aria-label="Search menu items"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="menu-input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="menu-input" value={availability} onChange={(e) => setAvailability(e.target.value)} aria-label="Filter by availability">
            <option value="all">All items</option>
            <option value="on">On the menu</option>
            <option value="hidden">Hidden</option>
          </select>
          {hasFilters && (
            <button type="button" className="btn-text"
                    onClick={() => { setSearch(""); setCategory("all"); setAvailability("all"); }}>
              Clear filters
            </button>
          )}
          <button className="menu-btn menu-btn-primary" onClick={() => setFormItem(null)}>+ Add Item</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>On menu</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={COLUMNS} className="table-status">Loading menu…</td></tr>}

            {error && !items.length && (
              <tr>
                <td colSpan={COLUMNS} className="table-status table-status-error">
                  Couldn't load the menu. {error.message}{" "}
                  <button type="button" className="btn-text" onClick={() => refetch()}>Try again</button>
                </td>
              </tr>
            )}

            {!isLoading && !error && pageRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS} className="table-status">
                  {items.length === 0 ? "No menu items yet. Add your first one." : "No menu items match your filters."}
                </td>
              </tr>
            )}

            {pageRows.map((item) => {
              const pending = toggle.isPending && toggle.variables?.id === item.item_id;
              const noRecipe = costing.data && recipeCount.get(item.item_id) === 0;
              return (
                <tr key={item.item_id} style={{ opacity: item.is_available ? 1 : 0.6 }}>
                  <td>
                    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Thumb url={item.image_url} />
                      <span>
                        {item.item_name}
                        {noRecipe && (
                          <span className="badge badge-warn" style={{ marginLeft: 6 }} title="Stock isn't deducted when this sells">
                            No recipe
                          </span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className="menu-pill" style={{ "--pill-accent": getCategoryMeta(item.category).accent }}>
                      {item.category || "—"}
                    </span>
                  </td>
                  <td>{formatPeso(item.selling_price)}</td>
                  <td>
                    <input type="checkbox" role="switch" checked={item.is_available} disabled={pending}
                            aria-label={`${item.item_name} is on the menu`} onChange={() => toggleAvailability(item)} />
                  </td>
                  <td>
                    <button type="button" className="action-link" onClick={() => setRecipeItem(item)}>Recipe</button>{" "}
                    <button type="button" className="action-link" onClick={() => setFormItem(item)}>Edit</button>{" "}
                    <button type="button" className="action-link action-danger" onClick={() => setDeleting(item)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page} pageCount={pageCount} total={filtered.length} pageSize={pageSize}
        onPage={(p) => setPageState({ key: filterKey, page: p })} onPageSize={setPageSize}
      />

      {formItem !== undefined && (
        <ItemFormModal item={formItem} categories={categories} onClose={() => setFormItem(undefined)} />
      )}
      {deleting && <DeleteItemModal item={deleting} onClose={() => setDeleting(null)} />}
      {recipeItem && <RecipeModal item={recipeItem} onClose={() => setRecipeItem(null)} />}
    </div>
  );
}