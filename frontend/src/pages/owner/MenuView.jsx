// src/pages/owner/MenuView.jsx
import { useEffect, useState } from "react";
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

export default function MenuView() {
  const [categories, setCategories] = useState(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState(null); // null = closed, "new" = adding, or the item being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [cats, all] = await Promise.all([getMenuCategories(), getAllMenuItems()]);
      setCategories(cats);
      setItems(all);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm({ ...EMPTY_FORM, categoryKey: filter !== "all" ? filter : categories[0]?.key || "" });
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

  function closeModal() {
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
        // Point the form at the new category right away. If saving the item
        // fails below (e.g. empty name), the user can fix it and retry
        // without hitting "category already exists".
        setForm((f) => ({ ...f, categoryKey }));
        setIsNewCategory(false);
        await load();
      }

      const payload = { ...form, categoryKey };
      if (editing === "new") await createMenuItem(payload);
      else await updateMenuItem(editing.id, payload);

      await load();
      setEditing(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}" from the menu?`)) return;
    try {
      await deleteMenuItem(item.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !items) return <p className="error-text">Couldn't load menu. {error}</p>;
  if (!items || !categories) return <p className="loading-text">Loading menu…</p>;

  const categoryName = Object.fromEntries(categories.map((c) => [c.key, c.name]));
  const term = search.trim().toLowerCase();
  const visible = items.filter(
    (i) => (filter === "all" || i.categoryKey === filter) && (term === "" || i.name.toLowerCase().includes(term))
  );

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
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="menu-input" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.icon} {c.name} ({c.itemCount})
              </option>
            ))}
          </select>
          <button className="menu-btn menu-btn-primary" onClick={openAdd}>
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
            {visible.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{categoryName[item.categoryKey]}</td>
                <td>₱{item.price.toFixed(2)}</td>
                <td className="menu-actions-col">
                  <button className="menu-btn" onClick={() => openEdit(item)}>
                    Edit
                  </button>
                  <button className="menu-btn menu-btn-danger" onClick={() => handleDelete(item)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="loading-text">
                  No menu items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="menu-backdrop" onClick={closeModal}>
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
                {categories.map((c) => (
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
              <button type="button" className="menu-btn" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="menu-btn menu-btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}