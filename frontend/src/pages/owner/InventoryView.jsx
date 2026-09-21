// src/pages/owner/InventoryView.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import {
  BRANCHES,
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../../api/mockInventory";

const EMPTY_FORM = { branchId: "", name: "", unit: "", onHand: "", reorder: "" };
const UNIT_SUGGESTIONS = ["kg", "g", "L", "ml", "pcs", "pack", "bottle", "can", "sack"];

export default function InventoryView() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  // Popups: "editing" is null (closed), "new" (adding), or the item being edited.
  // "deleting" is null or the item waiting for delete confirmation.
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const debounceTimer = useRef(null);
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  // Ignore responses that arrive after a newer request was already sent.
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const myId = ++requestId.current;
    setLoadState("loading");
    try {
      const data = await getInventory({ branch, status, search });
      if (myId !== requestId.current) return;
      setItems(data.items);
      setLowStock(data.lowStock);
      setLoadState("ready");
    } catch (err) {
      if (myId !== requestId.current) return;
      setErrorMsg(err.message);
      setLoadState("error");
    }
  }, [branch, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  function stockPercent(item) {
    if (item.reorder <= 0) return 100;
    const pct = (item.onHand / (item.reorder * 2)) * 100;
    return Math.max(6, Math.min(100, pct));
  }

  // ---------- Add / Edit popup ----------
  function openAdd() {
    setForm({ ...EMPTY_FORM, branchId: branch !== "all" ? branch : BRANCHES[0].id });
    setFormError("");
    setEditing("new");
  }

  function openEdit(item) {
    setForm({
      branchId: item.branchId,
      name: item.name,
      unit: item.unit,
      onHand: String(item.onHand),
      reorder: String(item.reorder),
    });
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
      if (editing === "new") await createInventoryItem(form);
      else await updateInventoryItem(editing.id, form);
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------- Delete popup ----------
  function closeDelete() {
    if (!saving) setDeleting(null);
  }

  async function handleConfirmDelete() {
    setSaving(true);
    setFormError("");
    try {
      await deleteInventoryItem(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const branchLabel = branch === "all" ? "All Branches" : BRANCHES.find((b) => b.id === branch)?.name;
  const showBranchCol = branch === "all";
  const colCount = showBranchCol ? 9 : 8;

  return (
    <>
      {lowStock.length > 0 && (
        <div className="alert-banner">
          ⚠ Low Stock Alert:{" "}
          {lowStock.map((i) => (showBranchCol ? `${i.name} (${i.branchName})` : i.name)).join(", ")}{" "}
          {lowStock.length === 1 ? "is" : "are"} at or below reorder level
        </div>
      )}

      <div className="view-header">
        <h2 className="view-title">Inventory — {branchLabel}</h2>
        <div className="view-filters">
          <select className="select-input" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="all">All Branches</option>
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search ingredient..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select className="select-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Good">Good</option>
            <option value="Low">Low</option>
          </select>
          <button className="btn btn-navy" onClick={openAdd}>
            + Add Item
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              {showBranchCol && <th>Branch</th>}
              <th>Unit</th>
              <th>On Hand</th>
              <th>Reorder Lvl</th>
              <th>Stock Bar</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadState === "loading" && (
              <tr>
                <td colSpan={colCount} className="table-status">Loading inventory…</td>
              </tr>
            )}
            {loadState === "error" && (
              <tr>
                <td colSpan={colCount} className="table-status table-status-error">Couldn't load inventory. {errorMsg}</td>
              </tr>
            )}
            {loadState === "ready" && items.length === 0 && (
              <tr>
                <td colSpan={colCount} className="table-status">No ingredients match your filters.</td>
              </tr>
            )}
            {loadState === "ready" &&
              items.map((item) => (
                <tr key={item.id}>
                  <td className={item.status === "Low" ? "orange-text" : ""}>{item.name}</td>
                  {showBranchCol && <td>{item.branchName}</td>}
                  <td>{item.unit}</td>
                  <td className={item.status === "Low" ? "orange-text" : "cell-strong"}>{item.onHand}</td>
                  <td>{item.reorder}</td>
                  <td>
                    <div className="mini-bar-track">
                      <div className={`mini-bar ${item.status === "Low" ? "orange" : "green"}`} style={{ width: `${stockPercent(item)}%` }} />
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${item.status === "Low" ? "badge-warn" : "badge-good"}`}>
                      {item.status === "Low" ? "⚠ Low" : "Good"}
                    </span>
                  </td>
                  <td>{item.updated}</td>
                  <td>
                    <button className="btn btn-orange btn-sm" onClick={() => openEdit(item)}>Edit</button>{" "}
                    <button
                      className="btn btn-red btn-sm"
                      onClick={() => {
                        setFormError("");
                        setDeleting(item);
                      }}
                    >
                      Del
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span className="footer-note">
          {loadState === "ready" ? items.length : "…"} ingredients shown · Auto-deducted via BOM on each transaction
        </span>
        <button className="btn btn-green">🚚 Log Delivery / Restock</button>
      </div>

      {/* Add / Edit popup (centered) */}
      {editing && (
        <div className="menu-backdrop" onClick={closeEditor}>
          <form className="menu-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3 className="panel-title">{editing === "new" ? "Add Inventory Item" : "Edit Inventory Item"}</h3>

            <label className="menu-field">
              Branch
              <select
                className="menu-input"
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="menu-field">
              Ingredient name
              <input
                className="menu-input"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </label>

            <label className="menu-field">
              Unit
              <input
                className="menu-input"
                type="text"
                list="inventory-units"
                placeholder="kg, L, pcs…"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
              <datalist id="inventory-units">
                {UNIT_SUGGESTIONS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </label>

            <div className="menu-newcat">
              <label className="menu-field menu-newcat-name">
                On hand
                <input
                  className="menu-input"
                  type="number"
                  min="0"
                  step="any"
                  value={form.onHand}
                  onChange={(e) => setForm({ ...form, onHand: e.target.value })}
                />
              </label>
              <label className="menu-field menu-newcat-name">
                Reorder level
                <input
                  className="menu-input"
                  type="number"
                  min="0"
                  step="any"
                  value={form.reorder}
                  onChange={(e) => setForm({ ...form, reorder: e.target.value })}
                />
              </label>
            </div>

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

      {/* Delete confirmation popup (centered) */}
      {deleting && (
        <div className="menu-backdrop" onClick={closeDelete}>
          <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="panel-title">Delete inventory item?</h3>
            <p>
              <strong>{deleting.name}</strong> ({deleting.branchName}) will be removed from inventory. This can't be undone.
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
    </>
  );
}