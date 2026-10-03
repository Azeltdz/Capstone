import { useState } from "react";
import toast from "react-hot-toast";
import ModalShell from "../../../components/ModalShell";
import { useRecordMovement } from "../../../hooks/useInventory";
import { compatibleUnits, convert } from "../../../constants/units";

const MODES = {
  restock: { label: "Delivery received", hint: "Adds to the current stock.", qty: "Quantity received", reason: "Supplier or invoice (optional)", required: false },
  adjustment: { label: "Stock count", hint: "Sets the stock to what you counted.", qty: "Counted total", reason: "Reason (required)", required: true },
  spoilage: { label: "Spoilage or waste", hint: "Removes from the current stock.", qty: "Quantity removed", reason: "What happened (required)", required: true },
};
const round3 = (n) => Math.round(n * 1000) / 1000;

export default function StockModal({ items, item, initialType = "restock", onClose }) {
  const record = useRecordMovement();
  const [inventoryId, setInventoryId] = useState(item ? String(item.inventory_id) : "");
  const [type, setType] = useState(initialType);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const selected = items.find((i) => String(i.inventory_id) === inventoryId) ?? null;
  const mode = MODES[type];
  const onHand = selected ? Number(selected.quantity_on_hand) : 0;

  const qty = Number(quantity);
  const converted = selected && quantity !== "" && Number.isFinite(qty) ? convert(qty, unit || selected.unit, selected.unit) : null;
  const after =
    converted === null ? null : round3(type === "restock" ? onHand + converted : type === "spoilage" ? onHand - converted : converted);

  const qtyOk = converted !== null && (type === "adjustment" ? converted >= 0 : converted > 0);
  const reasonOk = !mode.required || reason.trim().length >= 3;
  const canSave = !!selected && qtyOk && reasonOk && after >= 0 && !record.isPending;

  function pickItem(value) {
    setInventoryId(value);
    setUnit(items.find((i) => String(i.inventory_id) === value)?.unit ?? "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await record.mutateAsync({ inventoryId: selected.inventory_id, type, quantity: qty, unit, reason: reason.trim() });
      toast.success(`${selected.ingredient_name} updated`);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ModalShell title="Update stock" subtitle={selected ? `${selected.ingredient_name}${selected.branch_name ? ` · ${selected.branch_name}` : ""}` : undefined} width={480} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {!item && (
          <label className="menu-field">
            Ingredient
            <select className="menu-input" value={inventoryId} onChange={(e) => pickItem(e.target.value)} autoFocus>
              <option value="">Choose an ingredient…</option>
              {items.map((i) => (
                <option key={i.inventory_id} value={i.inventory_id}>
                  {i.ingredient_name}{i.branch_name ? ` (${i.branch_name})` : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="menu-field">
          What happened
          <select className="menu-input" value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(MODES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
          <span className="menu-subtle">{mode.hint}</span>
        </label>

        {selected && (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <label className="menu-field" style={{ flex: 1 }}>
                {mode.qty}
                <input className="menu-input" type="number" min="0" step="any" value={quantity}
                        onChange={(e) => setQuantity(e.target.value)} autoFocus={!!item} />
              </label>
              <label className="menu-field" style={{ width: 110 }}>
                Unit
                <select className="menu-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {compatibleUnits(selected.unit).map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
            </div>

            <p className="menu-subtle" role="status">
              On hand: {onHand} {selected.unit}
              {after !== null && <> → <strong>{after} {selected.unit}</strong></>}
              {after !== null && after < 0 && <span className="error-text"> (not enough stock)</span>}
              {converted !== null && unit !== selected.unit && <> · {quantity} {unit} = {converted} {selected.unit}</>}
            </p>

            <label className="menu-field">
              {mode.reason}
              <input className="menu-input" type="text" maxLength={200} value={reason}
                      onChange={(e) => setReason(e.target.value)} />
            </label>
          </>
        )}

        {error && <p className="error-text" role="alert">{error}</p>}

        <div className="menu-modal-actions">
          <button type="button" className="menu-btn" onClick={onClose} disabled={record.isPending}>Cancel</button>
          <button type="submit" className="menu-btn menu-btn-primary" disabled={!canSave}>
            {record.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}