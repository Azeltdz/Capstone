import { useMemo, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useIngredients, useUpdateIngredient } from "../../../hooks/useIngredients";
import { formatPeso } from "../../../utils/format";
import ModalShell from "./ModalShell";

function PriceEditor({ ingredient, onClose }) {
  const update = useUpdateIngredient();
  const [cost, setCost] = useState(String(ingredient.unit_cost));
  const [supplier, setSupplier] = useState(ingredient.supplier_name ?? "");
  const [error, setError] = useState("");

  const costNum = Number(cost);
  const valid = cost !== "" && Number.isFinite(costNum) && costNum >= 0;
  const changed = costNum !== ingredient.unit_cost || supplier.trim() !== (ingredient.supplier_name ?? "");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await update.mutateAsync({ id: ingredient.ingredient_id, unit_cost: costNum, supplier_name: supplier.trim() });
      toast.success(`${ingredient.ingredient_name} updated`);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ModalShell title={ingredient.ingredient_name} subtitle={`Priced per ${ingredient.unit}`} width={440} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="menu-field">
          Cost per {ingredient.unit} (₱)
          <input
            className="menu-input" type="number" min="0" step="0.01" autoFocus
            value={cost} onChange={(e) => setCost(e.target.value)} aria-invalid={!valid}
          />
        </label>
        <label className="menu-field">
          Supplier
          <input className="menu-input" type="text" maxLength={100} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </label>
        <p className="menu-subtle">Every recipe that uses this ingredient recalculates as soon as you save.</p>

        {error && <p className="error-text" role="alert">{error}</p>}

        <div className="menu-modal-actions">
          <button type="button" className="menu-btn" onClick={onClose} disabled={update.isPending}>Cancel</button>
          <button type="submit" className="menu-btn menu-btn-primary" disabled={!valid || !changed || update.isPending}>
            {update.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default function IngredientPrices() {
  const { data: ingredients = [], isLoading, error, refetch } = useIngredients();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ingredients
      .filter((i) => !q || i.ingredient_name.toLowerCase().includes(q))
      .sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name));
  }, [ingredients, search]);

  return (
    <>
      <div className="table-toolbar">
        <div className="search-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text" className="search-input" placeholder="Search ingredient…"
            aria-label="Search ingredients" value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Ingredient</th><th>Unit</th><th>Cost per unit</th><th>Supplier</th><th>Last updated</th><th>Action</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="table-status">Loading ingredients…</td></tr>}
            {error && (
              <tr>
                <td colSpan={6} className="table-status table-status-error">
                  Couldn't load ingredients. {error.message}{" "}
                  <button type="button" className="btn-text" onClick={() => refetch()}>Try again</button>
                </td>
              </tr>
            )}
            {!isLoading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="table-status">
                  {ingredients.length ? "No ingredients match your search." : "No ingredients yet. Create them from Inventory → Add Item."}
                </td>
              </tr>
            )}
            {rows.map((i) => (
              <tr key={i.ingredient_id}>
                <td className="cell-strong">{i.ingredient_name}</td>
                <td>{i.unit}</td>
                <td>{formatPeso(i.unit_cost)}</td>
                <td>{i.supplier_name || "—"}</td>
                <td>{i.updated_at ? format(new Date(i.updated_at), "MMM d, yyyy") : "—"}</td>
                <td>
                  <button type="button" className="action-link" onClick={() => setEditing(i)}>Edit price</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <PriceEditor ingredient={editing} onClose={() => setEditing(null)} />}
    </>
  );
}