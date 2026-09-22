// src/pages/owner/MenuView.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import {
  getMenuCategories,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createMenuCategory,
} from "../../api/mockCashier";

const EMPTY_FORM = { name: "", price: "", categoryKey: "" };
const NEW_CATEGORY = "__new__"; // special <select> value for "+ New category…"
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function MenuView() {
  const [categories, setCategories] = useState(null);
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState(null); // null = closed, "new" = adding, or the item being edited
  const [deleting, setDeleting] = useState(null); // null = closed, or the item pending delete confirmation
  const [form, setForm] = useState(EMPTY_FORM);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMenuCategories()
      .then(setCategories)
      .catch((err) => setError(err.message));
  }, []);

  // Ignore responses that land after a newer request was already sent
  // (e.g. filter changed twice in quick succession).
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const myId = ++requestId.current;
    setLoading(true);
    try {
      const data = await getAllMenuItems({ page, pageSize, categoryKey: filter, search });
      if (myId !== requestId.current) return;
      setItems(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      if (data.page !== page) setPage(data.page); // clamp if filtering emptied the current page
      setError("");
    } catch (err) {
      if (myId !== requestId.current) return;
      setError(err.message);
    } finally {
      if (myId === requestId.current) setLoading(false);
    }
  }, [page, pageSize, filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function reloadAfterMutation() {
    const cats = await getMenuCategories();
    setCategories(cats);
    await load();
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM, categoryKey: filter !== "all" ? filter : categories?.[0]?.key || "" });
    setIsNewCategory(false);
    setNewCategory({ name: "", icon: "" });
    setFormError("");
    setEditing("new");
  }

  function openEdit(item) {
    setForm({ name: item.name, price: String(item.price), categoryKey: item.categoryKey });
    setIsNewCategory(false);
    setNewCategory({ name: "", icon: "" });
    setFormError("");
    setEditing(item);
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
        setForm((f) => ({ ...f, categoryKey }));
        setIsNewCategory(false);
      }

      const payload = { ...form, categoryKey };
      if (editing === "new") await createMenuItem(payload);
      else await updateMenuItem(editing.id, payload);

      setEditing(null);
      await reloadAfterMutation();
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
      await reloadAfterMutation();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error && items.length === 0 && !loading) {
    return (
      <div className="panel">
        <p className="error-text">Couldn't load menu. {error}</p>
      </div>
    );
  }

  const categoryName = Object.fromEntries((categories || []).map((c) => [c.key, c.name]));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className="panel">
      <div className="menu-toolbar">
        <h3 className="panel-title">🍜 Menu Items</h3>
        <div className="menu-toolbar-controls">
          <input
            className="menu-input"
            type="text"
            placeholder="Search item…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="menu-input"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All categories</option>
            {(categories || []).map((c) => (
              <option key={c.key} value={c.key}>
                {c.icon} {c.name} ({c.itemCount})
              </option>
            ))}
          </select>
          <button className="menu-btn menu-btn-primary" onClick={openAdd} disabled={!categories}>
            + Add Item
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="menu-table-wrap">
        <table className="menu-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th className="menu-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="loading-text">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="loading-text">
                  No menu items found.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{categoryName[item.categoryKey]}</td>
                  <td>₱{item.price.toFixed(2)}</td>
                  <td className="menu-actions-col">
                    <button className="menu-btn" onClick={() => openEdit(item)}>
                      Edit
                    </button>
                    <button
                      className="menu-btn menu-btn-danger"
                      onClick={() => {
                        setFormError("");
                        setDeleting(item);
                      }}
                    >
                      Delete
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
            <select
              className="menu-input"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
          <div className="menu-pagination-controls">
            <button className="menu-btn" disabled={page <= 1} onClick={() => setPage(1)}>
              First
            </button>
            <button className="menu-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <span className="menu-pagination-page">
              Page {page} of {totalPages}
            </span>
            <button className="menu-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
            <button className="menu-btn" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
              Last
            </button>
          </div>
        </div>
      )}

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
          <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="panel-title">Delete menu item?</h3>
            <p>
              <strong>{deleting.name}</strong> will be removed from the menu and the cashier POS. This can't be undone.
            </p>
            {formError && <p className="error-text">{formError}</p>}
            <div className="menu-modal-actions">
              <button className="menu-btn" onClick={closeDelete} disabled={saving}>
                Cancel
              </button>
              <button className="menu-btn menu-btn-danger" onClick={handleConfirmDelete} disabled={saving}>
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}