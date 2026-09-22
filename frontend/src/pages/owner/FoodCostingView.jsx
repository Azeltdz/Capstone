// src/pages/owner/FoodCostingView.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import StatCard from "../../components/StatCard";
import { getFoodCostingData } from "../../api/mockOwner";
import {
  getMenuCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createMenuCategory,
} from "../../api/mockCashier";

const EMPTY_FORM = { name: "", price: "", categoryKey: "" };
const NEW_CATEGORY = "__new__";
const PAGE_SIZE_OPTIONS = [5, 10];
const PILL_COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#4b5563"];

function pillColor(categoryKey) {
  if (!categoryKey) return PILL_COLORS[PILL_COLORS.length - 1];
  let hash = 0;
  for (let i = 0; i < categoryKey.length; i++) hash = (hash * 31 + categoryKey.charCodeAt(i)) >>> 0;
  return PILL_COLORS[hash % PILL_COLORS.length];
}

function marginClass(margin) {
  if (margin == null) return "";
  if (margin >= 60) return "green-text";
  if (margin >= 58) return "orange-text";
  return "red-text";
}

function costClass(row) {
  if (row.cost == null || !row.sellPrice) return "";
  return row.cost / row.sellPrice > 0.4 ? "red-text" : "orange-text";
}

function SearchIcon() {
  return (
    <svg className="menu-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg className="menu-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  );
}

export default function FoodCostingView() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState(null); // null | "new" | row being edited
  const [deleting, setDeleting] = useState(null); // null | row pending delete
  const [form, setForm] = useState(EMPTY_FORM);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [costing, cats] = await Promise.all([getFoodCostingData(), getMenuCategories()]);
      setData(costing);
      setCategories(cats);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setForm({ ...EMPTY_FORM, categoryKey: filter !== "all" ? filter : categories?.[0]?.key || "" });
    setIsNewCategory(false);
    setNewCategory({ name: "", icon: "" });
    setFormError("");
    setEditing("new");
  }

  function openEdit(row) {
    setForm({ name: row.name, price: String(row.sellPrice), categoryKey: row.categoryKey });
    setIsNewCategory(false);
    setNewCategory({ name: "", icon: "" });
    setFormError("");
    setEditing(row);
  }

  function closeEditor() {
    if (!saving) setEditing(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      let categoryKey = form.categoryKey;

      if (isNewCategory) {
        const cat = await createMenuCategory(newCategory);
        categoryKey = cat.key;
        setIsNewCategory(false);
      }

      const payload = { ...form, categoryKey };
      if (editing === "new") await createMenuItem(payload);
      else await updateMenuItem(editing.id, payload);

      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function closeDelete() {
    if (!saving) setDeleting(null);
  }

  async function handleConfirmDelete() {
    setSaving(true);
    setFormError("");
    try {
      await deleteMenuItem(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const categoryName = useMemo(
    () => Object.fromEntries((categories || []).map((c) => [c.key, c.name])),
    [categories]
  );

  const filteredRows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.rows.filter((row) => {
      const matchesFilter = filter === "all" || row.categoryKey === filter;
      const matchesSearch = !q || row.name.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [data, search, filter]);

  const totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);

  // Reset to page 1 whenever the filtered set or page size changes underneath us.
  useEffect(() => {
    setPage(1);
  }, [search, filter, pageSize]);

  if (error && !data) return <p className="error-text">Couldn't load food costing. {error}</p>;
  if (!data) return <p className="loading-text">Loading food costing…</p>;

  const { stats } = data;

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">Food Costing — Menu Items</h2>
        <button className="btn btn-navy" onClick={openAdd} disabled={!categories}>
          + Add Menu Item
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="stat-grid stat-grid-3">
        <StatCard label="Avg Food Cost %" value={stats.avgFoodCostPct} change="Target: <40%" changeType="warn" />
        <StatCard label="Highest Margin" value={stats.highestMarginItem} change={`${stats.highestMarginPct} margin`} changeType="up" valueClassName="stat-value-sm" />
        <StatCard label="Lowest Margin" value={stats.lowestMarginItem} change={`${stats.lowestMarginPct} margin`} changeType="warn" valueClassName="stat-value-sm" />
      </div>

      <div className="menu-toolbar" style={{ justifyContent: "flex-end" }}>
        <div className="menu-toolbar-controls">
          <div className="menu-search">
            <SearchIcon />
            <input
              className="menu-input menu-search-input"
              type="text"
              placeholder="Search item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="menu-input" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All categories</option>
            {(categories || []).map((c) => (
              <option key={c.key} value={c.key}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Menu Item</th>
              <th>Category</th>
              <th>Sell Price</th>
              <th>Cost/Serving</th>
              <th>Gross Margin</th>
              <th>Margin Bar</th>
              <th>BOM</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8}>
                  <div className="menu-empty">
                    <SpinIcon />
                    <span>Loading…</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && pageRows.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="menu-empty">
                    <span>No menu items found.</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              pageRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>
                    <span className="menu-pill" style={{ "--pill-accent": pillColor(row.categoryKey) }}>
                      {categoryName[row.categoryKey] || "—"}
                    </span>
                  </td>
                  <td>₱{row.sellPrice.toFixed(2)}</td>
                  <td className={costClass(row)}>{row.cost != null ? `₱${row.cost.toFixed(2)}` : "—"}</td>
                  <td className={marginClass(row.margin)}>{row.margin != null ? `${row.margin.toFixed(1)}%` : "No BOM"}</td>
                  <td>
                    <div className="mini-bar-track">
                      <div
                        className={`mini-bar ${row.margin != null && row.margin >= 58 ? "green" : "orange"}`}
                        style={{ width: `${row.margin || 0}%` }}
                      />
                    </div>
                  </td>
                  <td>
                    <span className="pill-count">{row.bomCount}</span>
                  </td>
                  <td>
                    <button className="menu-icon-btn" title="Edit" onClick={() => openEdit(row)}>
                      <EditIcon />
                    </button>
                    <button
                      className="menu-icon-btn menu-icon-btn-danger"
                      title="Delete"
                      onClick={() => {
                        setFormError("");
                        setDeleting(row);
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && (
        <div className="menu-pagination">
          <div className="menu-pagination-info">
            <span>
              Showing {rangeStart}–{rangeEnd} of {totalCount}
            </span>
            <select className="menu-input" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
          <div className="menu-pagination-controls">
            <button className="menu-btn" disabled={currentPage <= 1} onClick={() => setPage(1)}>
              First
            </button>
            <button className="menu-btn" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <span className="menu-pagination-page">
              Page {currentPage} of {totalPages}
            </span>
            <button className="menu-btn" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
            <button className="menu-btn" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>
              Last
            </button>
          </div>
        </div>
      )}

      <span className="menu-subtle">Gross margin auto-calculated from BOM ingredient costs.</span>

      {/* Add / Edit modal */}
      {editing && (
        <div className="menu-backdrop" onClick={closeEditor}>
          <form className="menu-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3 className="panel-title">{editing === "new" ? "Add Menu Item" : "Edit Menu Item"}</h3>

            <label className="menu-field">
              Name
              <input
                className="menu-input"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </label>

            <label className="menu-field">
              Category
              <select
                className="menu-input"
                value={isNewCategory ? NEW_CATEGORY : form.categoryKey}
                onChange={(e) => {
                  if (e.target.value === NEW_CATEGORY) setIsNewCategory(true);
                  else {
                    setIsNewCategory(false);
                    setForm({ ...form, categoryKey: e.target.value });
                  }
                }}
              >
                {(categories || []).map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
                <option value={NEW_CATEGORY}>+ New category…</option>
              </select>
            </label>

            {isNewCategory && (
              <div className="menu-newcat">
                <label className="menu-field menu-newcat-icon">
                  Icon
                  <input
                    className="menu-input"
                    type="text"
                    maxLength={2}
                    placeholder="🍽️"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  />
                </label>
                <label className="menu-field menu-newcat-name">
                  New category name
                  <input
                    className="menu-input"
                    type="text"
                    placeholder="e.g. Specials"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </label>
              </div>
            )}

            <label className="menu-field">
              Price (₱)
              <input
                className="menu-input"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>

            {editing !== "new" && (
              <p className="menu-subtle">
                Cost/serving and margin are computed from this item's Bill of Materials — assign or update
                ingredients on the Inventory tab.
              </p>
            )}

            {formError && <p className="error-text">{formError}</p>}

            <div className="menu-modal-actions">
              <button type="button" className="menu-btn" onClick={closeEditor} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="menu-btn menu-btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleting && (
        <div className="menu-backdrop" onClick={closeDelete}>
          <div className="menu-modal menu-modal-sm modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="menu-modal-icon menu-modal-icon-danger">
              <TrashIcon />
            </div>
            <h3 className="panel-title menu-modal-center-title">Delete menu item?</h3>
            <p className="menu-modal-center-text">
              <strong>{deleting.name}</strong> will be removed from the menu and the cashier POS. This can't be
              undone.
            </p>
            {formError && <p className="error-text">{formError}</p>}
            <div className="confirm-actions menu-modal-actions-center">
              <button className="menu-btn" onClick={closeDelete} disabled={saving}>
                Cancel
              </button>
              <button className="btn-solid" onClick={handleConfirmDelete} disabled={saving}>
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}