// src/pages/owner/InventoryView.jsx
import { useState, useMemo } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useBranches } from "../../hooks/useBranches";
import {
  useInventoryList,
  useLowStock,
  useAddInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
} from "../../hooks/useInventory";
import { useSettings } from "../../hooks/useSettings";
import StockModal from "./inventory/StockModal";
import MovementsModal from "./inventory/MovementsModal";
import { UNIT_OPTIONS } from "../../constants/units";

const EMPTY_FORM = { branchId: "", name: "", unit: "", unitCost: "", onHand: "", reorder: "" };

export default function InventoryView() {
  const [searchInput, setSearchInput] = useState("");
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("all");
  const [stockTarget, setStockTarget] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);

  const { data: branches = [] } = useBranches();
  const { data: items = [], isLoading, error } = useInventoryList(branch);
  const { data: lowStock = [] } = useLowStock(branch);

  const addItem = useAddInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();

  const [editing, setEditing] = useState(null); // null | "new" | item object
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  
  const { data: settings } = useSettings();


  const filteredItems = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    return items.filter(
      (i) =>
        (status === "all" || i.status === status) &&
        (term === "" || i.ingredient_name.toLowerCase().includes(term))
    );
  }, [items, status, searchInput]);

  function stockPercent(item) {
    const onHand = Number(item.quantity_on_hand);
    const reorder = Number(item.reorder_threshold);
    if (reorder <= 0) return 100;
    const pct = (onHand / (reorder * 2)) * 100;
    return Math.max(6, Math.min(100, pct));
  }

  function defaultReorderFor(unit) {
    const u = unit.trim().toLowerCase();
    if (u === "kg") return settings?.low_stock_default_kg ?? "";
    if (u === "pcs" || u === "pc") return settings?.low_stock_default_pcs ?? "";
    return "";
  }

  // ---------- Add / Edit popup ----------
  function openAdd() {
    setForm({
      ...EMPTY_FORM,
      branchId: branch !== "all" ? branch : String(branches[0]?.branch_id ?? ""),
    });
    setFormError("");
    setEditing("new");
  }

  function openEdit(item) {
    setForm({
      branchId: String(item.branch_id),
      name: item.ingredient_name,
      unit: item.unit,
      unitCost: String(item.unit_cost ?? ""),
      onHand: String(item.quantity_on_hand),
      reorder: String(item.reorder_threshold),
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
      if (editing === "new") {
        if (!form.branchId) throw new Error("Please choose a branch.");
        if (!form.name.trim()) throw new Error("Ingredient name is required.");
        if (!form.unit.trim()) throw new Error("Unit is required (e.g. kg, L, pcs).");
        if (form.unitCost === "" || Number(form.unitCost) < 0) throw new Error("Cost per unit must be 0 or more.");
        if (form.onHand === "" || Number(form.onHand) < 0) throw new Error("On hand must be 0 or more.");
        if (form.reorder === "" || Number(form.reorder) < 0) throw new Error("Reorder level must be 0 or more.");

        await addItem.mutateAsync({
          branchId: Number(form.branchId),
          name: form.name.trim(),
          unit: form.unit.trim(),
          unitCost: Number(form.unitCost),
          onHand: Number(form.onHand),
          reorder: Number(form.reorder),
        });
      } else {
        if (form.reorder === "" || Number(form.reorder) < 0) throw new Error("Reorder level must be 0 or more.");
        await updateItem.mutateAsync({ id: editing.inventory_id, reorder_threshold: Number(form.reorder) });
      }
      setEditing(null);
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
      await deleteItem.mutateAsync(deleting.inventory_id);
      setDeleting(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const branchLabel =
    branch === "all" ? "All Branches" : branches.find((b) => String(b.branch_id) === branch)?.branch_name || "…";
  const showBranchCol = branch === "all";
  const colCount = showBranchCol ? 9 : 8;

  return (
    <>
      {lowStock.length > 0 && (
        <div className="alert-banner">
          ⚠ Low Stock Alert:{" "}
          {lowStock
            .map((i) => (showBranchCol ? `${i.ingredient_name} (${i.branch_name})` : i.ingredient_name))
            .join(", ")}{" "}
          {lowStock.length === 1 ? "is" : "are"} at or below reorder level
        </div>
      )}

      <div className="view-header">
        <h2 className="view-title">Inventory — {branchLabel}</h2>
        <div className="view-filters">
          <select className="select-input" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.branch_id} value={String(b.branch_id)}>
                {b.branch_name}
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
            {isLoading && (
              <tr>
                <td colSpan={colCount} className="table-status">Loading inventory…</td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={colCount} className="table-status table-status-error">Couldn't load inventory. {error.message}</td>
              </tr>
            )}
            {!isLoading && !error && filteredItems.length === 0 && (
              <tr>
                <td colSpan={colCount} className="table-status">No ingredients match your filters.</td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              filteredItems.map((item) => (
                <tr key={item.inventory_id}>
                  <td className={item.status === "Low" ? "orange-text" : ""}>{item.ingredient_name}</td>
                  {showBranchCol && <td>{item.branch_name}</td>}
                  <td>{item.unit}</td>
                  <td className={item.status === "Low" ? "orange-text" : "cell-strong"}>{item.quantity_on_hand}</td>
                  <td>{item.reorder_threshold}</td>
                  <td>
                    <div className="mini-bar-track">
                      <div
                        className={`mini-bar ${item.status === "Low" ? "orange" : "green"}`}
                        style={{ width: `${stockPercent(item)}%` }}
                      />
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${item.status === "Low" ? "badge-warn" : "badge-good"}`}>
                      {item.status === "Low" ? "⚠ Low" : "Good"}
                    </span>
                  </td>
                  <td>{format(new Date(item.last_updated), "MMM d, h:mm a")}</td>
                  <td>
                    <button className="btn btn-green btn-sm" onClick={() => setStockTarget({ item, type: "restock" })}>Stock</button>{" "}
                    <button className="btn btn-sm" onClick={() => setHistoryItem(item)}>History</button>{" "}
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
          {!isLoading ? filteredItems.length : "…"} ingredients shown · Auto-deducted via BOM on each transaction
        </span>
        <button
          className="btn btn-green"
          onClick={() => setStockTarget({ item: null, type: "restock" })}
        >
          🚚 Log Delivery / Restock
        </button>
      </div>

      {stockTarget && (
        <StockModal 
          items={items} 
          item={stockTarget.item} 
          initialType={stockTarget.type} 
          onClose={() => setStockTarget(null)} 
        />
      )}
      {historyItem &&  (
        <MovementsModal 
          item={historyItem} 
          onClose={() => setHistoryItem(null)} 
        />
      )}

      {/* Add / Edit popup */}
      {editing && (
        <div className="menu-backdrop" onClick={closeEditor}>
          <form className="menu-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3 className="panel-title">{editing === "new" ? "Add Inventory Item" : "Edit Inventory Item"}</h3>

            <label className="menu-field">
              Branch
              {editing === "new" ? (
                <select
                  className="menu-input"
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                >
                  {branches.map((b) => (
                    <option key={b.branch_id} value={String(b.branch_id)}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="menu-input" type="text" value={editing.branch_name} disabled />
              )}
            </label>

            <label className="menu-field">
              Ingredient name
              {editing === "new" ? (
                <input
                  className="menu-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              ) : (
                <input className="menu-input" type="text" value={form.name} disabled />
              )}
            </label>

            <label className="menu-field">
              Unit
              {editing === "new" ? (
                <>
                  <select
                    className="menu-input"
                    value={form.unit}
                    onChange={(e) => {
                      const unit = e.target.value;
                      setForm((f) => ({
                        ...f,
                        unit,
                        reorder:
                          f.reorder === "" || f.reorder === defaultReorderFor(f.unit)
                            ? defaultReorderFor(unit)
                            : f.reorder,
                      }));
                    }}
                  >
                    <option value="">Choose a unit…</option>
                    {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </>
              ) : (
                <input className="menu-input" type="text" value={form.unit} disabled />
              )}
            </label>

            {editing === "new" && (
              <label className="menu-field">
                Cost per unit (₱)
                <input
                  className="menu-input"
                  type="number"
                  min="0"
                  step="any"
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                />
              </label>
            )}

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
                  disabled={editing !== "new"}
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

            {editing !== "new" && (
              <p className="modal-muted" style={{ fontSize: "0.85em" }}>
                Ingredient, unit, branch and stock can't be changed here. 
                Use Stock on the row to record deliveries, counts or spoilage.
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

      {/* Delete confirmation popup */}
      {deleting && (
        <div className="menu-backdrop" onClick={closeDelete}>
          <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="panel-title">Delete inventory item?</h3>
            <p>
              <strong>{deleting.ingredient_name}</strong> ({deleting.branch_name}) will be removed from inventory.
              This can't be undone.
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