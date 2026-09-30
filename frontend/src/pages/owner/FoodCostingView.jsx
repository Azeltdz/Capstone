// src/pages/owner/FoodCostingView.jsx
import { useState } from "react";
import StatCard from "../../components/StatCard";
import { useFoodCosting } from "../../hooks/useFoodcosting";
import { TARGET_FOOD_COST_PCT } from "../../constants/costing";
import CostingPanel from "./costing/CostingPanel";
import RecipeModal from "./costing/RecipeModal";
import IngredientPrices from "./costing/IngredientPrices";

const TABS = [
  { id: "menu", label: "Menu Costing" },
  { id: "ingredients", label: "Ingredient Prices" },
];

export default function FoodCostingView() {
  const { data, isLoading, error, refetch } = useFoodCosting();
  const [tab, setTab] = useState("menu");
  const [recipeItem, setRecipeItem] = useState(null);

  if (isLoading) {
    return (
      <>
        <div className="view-header"><h2 className="view-title">Food Costing</h2></div>
        <div className="stat-grid stat-grid-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-stat-card" />)}
        </div>
        <p className="loading-text">Loading food costing…</p>
      </>
    );
  }

  if (error && !data) {
    return (
      <div>
        <p className="error-text">Couldn't load food costing. {error.message}</p>
        <button className="btn btn-navy" onClick={() => refetch()}>Try again</button>
      </div>
    );
  }

  const { items, stats } = data;
  const avg = stats.avg_food_cost_percent;
  const missing = stats.missing_recipe_count;

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">Food Costing</h2>
      </div>

      <div className="stat-grid stat-grid-4">
        <StatCard
          label="Avg Food Cost %"
          value={avg != null ? `${avg}%` : "—"}
          change={`Target: under ${TARGET_FOOD_COST_PCT}%`}
          changeType={avg != null && avg <= TARGET_FOOD_COST_PCT ? "up" : "warn"}
        />
        <StatCard
          label="Highest Margin"
          value={stats.highest_margin?.item_name ?? "—"}
          change={stats.highest_margin ? `${stats.highest_margin.margin_percent}% margin` : "No costed items yet"}
          changeType={stats.highest_margin ? "up" : "muted"}
          valueClassName="stat-value-sm"
        />
        <StatCard
          label="Lowest Margin"
          value={stats.lowest_margin?.item_name ?? "—"}
          change={stats.lowest_margin ? `${stats.lowest_margin.margin_percent}% margin · pricing priority` : "No costed items yet"}
          changeType={stats.lowest_margin ? "warn" : "muted"}
          valueClassName="stat-value-sm"
        />
        <StatCard
          label="Missing Recipes"
          value={missing}
          change={missing > 0 ? "⚠ Stock isn't deducted when these sell" : "Every item has a recipe"}
          changeType={missing > 0 ? "warn" : "up"}
        />
      </div>

      {error && <p className="error-text" role="alert">Couldn't refresh. Showing the last loaded data.</p>}

      <div role="tablist" style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {TABS.map((t) => (
          <button
            key={t.id} type="button" role="tab" aria-selected={tab === t.id}
            className={`menu-btn ${tab === t.id ? "menu-btn-primary" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "menu" ? <CostingPanel items={items} onOpenRecipe={setRecipeItem} /> : <IngredientPrices />}

      <span className="menu-subtle">
        Cost per serving = Σ (recipe quantity × current ingredient price). Summary numbers count only items
        currently on the menu. Names, categories, and photos are managed on the Menu page.
      </span>

      {recipeItem && <RecipeModal item={recipeItem} onClose={() => setRecipeItem(null)} />}
    </>
  );
}