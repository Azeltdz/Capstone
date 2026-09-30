import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRecipe, useSaveRecipe } from "../../../hooks/useFoodcosting";
import { useIngredients } from "../../../hooks/useIngredients";
import { formatPeso } from "../../../utils/format";
import { TARGET_FOOD_COST_PCT, costTone } from "../../../constants/costing";
import ModalShell from "../../../components/ModalShell";

const MIN_QTY = 0.001;
const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000; // the column stores 3 decimals
const signature = (price, rows) =>
  JSON.stringify([Number(price), rows.map((r) => [r.ingredient_id, round3(Number(r.quantity))])]);

function RecipeEditor({ item, recipe, ingredients, onClose }) {
  const save = useSaveRecipe();
  const byId = useMemo(() => new Map(ingredients.map((i) => [i.ingredient_id, i])), [ingredients]);

  const [initial] = useState(() => {
    const rows = recipe.map((l) => ({ ingredient_id: l.ingredient_id, quantity: String(l.quantity) }));
    return { rows, sig: signature(item.selling_price, rows) };
  });
  const [price, setPrice] = useState(String(item.selling_price));
  const [rows, setRows] = useState(initial.rows);
  const [addId, setAddId] = useState("");
  const [addQty, setAddQty] = useState("");
  const [error, setError] = useState("");

  const lines = rows.map((r) => {
    const ing = byId.get(r.ingredient_id);
    const qty = round3(Number(r.quantity));
    const valid = r.quantity !== "" && qty >= MIN_QTY;
    return { ...r, ing, qty, valid, cost: valid ? qty * (ing?.unit_cost ?? 0) : 0 };
  });

  const cost = round2(lines.reduce((s, l) => s + l.cost, 0));
  const priceNum = Number(price);
  const priceValid = price !== "" && priceNum > 0;
  const hasLines = lines.length > 0;
  const margin = priceValid && hasLines ? round2(priceNum - cost) : null;
  const marginPct = margin === null ? null : (margin / priceNum) * 100;
  const foodPct = margin === null ? null : (cost / priceNum) * 100;

  const dirty = signature(price, rows) !== initial.sig;
  const canSave = dirty && priceValid && lines.every((l) => l.valid) && !save.isPending;

  const usedIds = new Set(rows.map((r) => r.ingredient_id));
  const addable = useMemo(
    () =>
      ingredients
        .filter((i) => !usedIds.has(i.ingredient_id))
        .sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name)),
    [ingredients, rows]
  );

  function requestClose() {
    if (dirty && !save.isPending && !window.confirm("Discard your unsaved changes?")) return;
    onClose();
  }

  function setQuantity(id, value) {
    setRows((r) => r.map((x) => (x.ingredient_id === id ? { ...x, quantity: value } : x)));
  }

  function addLine() {
    if (!addId) return setError("Choose an ingredient to add.");
    if (!(round3(Number(addQty)) >= MIN_QTY)) return setError(`Quantity must be at least ${MIN_QTY}.`);
    setRows((r) => [...r, { ingredient_id: Number(addId), quantity: String(addQty) }]);
    setAddId("");
    setAddQty("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await save.mutateAsync({
        itemId: item.item_id,
        lines: lines.map((l) => ({ ingredient_id: l.ingredient_id, quantity_per_unit: l.qty })),
        ...(priceNum !== Number(item.selling_price) ? { selling_price: priceNum } : {}),
      });
      toast.success("Recipe saved");
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ModalShell title={`Recipe: ${item.item_name}`} subtitle={item.category || "Uncategorized"} onClose={requestClose}>
      <form onSubmit={handleSubmit}>
        <label className="menu-field">
          Selling price (₱)
          <input
            className="menu-input" type="number" min="0.01" step="0.01"
            value={price} onChange={(e) => setPrice(e.target.value)} aria-invalid={!priceValid}
          />
        </label>

        <div className="mini-stat-row">
          <div className="mini-stat">
            <span className="mini-stat-label">Cost / serving</span>
            <span className="mini-stat-value">{hasLines ? formatPeso(cost) : "—"}</span>
            <span className="mini-stat-sub">{lines.length} ingredient{lines.length === 1 ? "" : "s"}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Gross margin</span>
            <span className={`mini-stat-value ${costTone(foodPct)}`}>{margin === null ? "—" : formatPeso(margin)}</span>
            <span className="mini-stat-sub">{marginPct === null ? "Needs a recipe" : `${marginPct.toFixed(1)}% of price`}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Food cost</span>
            <span className={`mini-stat-value ${costTone(foodPct)}`}>{foodPct === null ? "—" : `${foodPct.toFixed(1)}%`}</span>
            <span className="mini-stat-sub">Target: under {TARGET_FOOD_COST_PCT}%</span>
          </div>
        </div>

        <h4 className="panel-title panel-title-spaced">Ingredients per serving</h4>

        {hasLines ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Ingredient</th><th>Quantity</th><th>Unit cost</th><th>Cost</th><th><span className="sr-only">Remove</span></th></tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.ingredient_id}>
                    <td>{l.ing?.ingredient_name ?? "Unknown ingredient"}</td>
                    <td>
                      <input
                        className="menu-input" type="number" min={MIN_QTY} step="0.001" style={{ width: 96 }}
                        aria-label={`Quantity of ${l.ing?.ingredient_name}`} aria-invalid={!l.valid}
                        value={l.quantity} onChange={(e) => setQuantity(l.ingredient_id, e.target.value)}
                      />{" "}
                      {l.ing?.unit}
                    </td>
                    <td>{formatPeso(l.ing?.unit_cost ?? 0)}/{l.ing?.unit}</td>
                    <td>{l.valid ? formatPeso(l.cost) : "—"}</td>
                    <td>
                      <button
                        type="button" className="menu-icon-btn menu-icon-btn-danger"
                        aria-label={`Remove ${l.ing?.ingredient_name}`}
                        onClick={() => setRows((r) => r.filter((x) => x.ingredient_id !== l.ingredient_id))}
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="menu-subtle" role="status">
            ⚠ With no ingredients, selling this item deducts no stock and its margin can't be calculated.
          </p>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0", flexWrap: "wrap" }}>
          <select
            className="menu-input" style={{ flex: "1 1 180px" }} value={addId}
            onChange={(e) => setAddId(e.target.value)} aria-label="Ingredient to add"
          >
            <option value="">{addable.length ? "Add an ingredient…" : "No more ingredients to add"}</option>
            {addable.map((i) => (
              <option key={i.ingredient_id} value={i.ingredient_id}>{i.ingredient_name} ({i.unit})</option>
            ))}
          </select>
          <input
            className="menu-input" type="number" min={MIN_QTY} step="0.001" placeholder="Qty"
            style={{ width: 96 }} value={addQty} aria-label="Quantity to add"
            onChange={(e) => setAddQty(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLine(); } }}
          />
          <span>{byId.get(Number(addId))?.unit}</span>
          <button type="button" className="menu-btn" onClick={addLine}>Add</button>
        </div>
        <p className="menu-subtle">
          Quantities use each ingredient's own unit. New ingredients are created from Inventory → Add Item.
        </p>

        {error && <p className="error-text" role="alert">{error}</p>}

        <div className="menu-modal-actions">
          <button type="button" className="menu-btn" onClick={requestClose} disabled={save.isPending}>Cancel</button>
          <button type="submit" className="menu-btn menu-btn-primary" disabled={!canSave}>
            {save.isPending ? "Saving…" : "Save recipe"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default function RecipeModal({ item, onClose }) {
  const recipe = useRecipe(item.item_id);
  const ingredients = useIngredients();

  if (recipe.data && ingredients.data) {
    return <RecipeEditor item={item} recipe={recipe.data} ingredients={ingredients.data} onClose={onClose} />;
  }

  const error = recipe.error || ingredients.error;
  return (
    <ModalShell title={`Recipe: ${item.item_name}`} onClose={onClose}>
      {error ? (
        <>
          <p className="error-text">Couldn't load the recipe. {error.message}</p>
          <button type="button" className="menu-btn" onClick={() => { recipe.refetch(); ingredients.refetch(); }}>
            Try again
          </button>
        </>
      ) : (
        <p className="loading-text">Loading recipe…</p>
      )}
    </ModalShell>
  );
}