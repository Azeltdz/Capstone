// src/pages/cashier/pos/MenuStep.jsx
import { useState } from "react";
import { useMenuCategories, useMenuItemsByCategory } from "../../../hooks/useMenuItems";
import MenuImage from "../../../components/MenuImage";

export default function MenuStep({ stepNumber, cart, onQtyChange, onBack }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useMenuCategories();
  const effectiveCategory = activeCategory ?? categories[0]?.key ?? null;
  const { items, isLoading: itemsLoading, error: itemsError } = useMenuItemsByCategory(effectiveCategory);

  return (
    <div className="pos-main">
      <button className="back-link" onClick={onBack}>
        ← Back
      </button>
      <h2 className="step-label">Step {stepNumber} — Select menu items</h2>
      <p className="step-sub">Choose a category, then add items to the order</p>

      <div className="category-grid">
        {categoriesError && <p className="error-text">Couldn't load categories. {categoriesError.message}</p>}
        {categoriesLoading && <p className="loading-text">Loading categories…</p>}
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={`category-card ${effectiveCategory === cat.key ? "selected" : ""}`}
            style={{ "--category-accent": cat.accent }}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span className="category-icon">{cat.icon}</span>
            <span className="category-name">{cat.name}</span>
            <span className="category-count">{cat.itemCount} Items</span>
          </button>
        ))}
      </div>

      <div className="item-grid">
        {itemsError && <p className="error-text">Couldn't load items. {itemsError.message}</p>}
        {itemsLoading && <p className="loading-text">Loading items…</p>}
        {!itemsLoading &&
          items.map((item) => {
            const qty = cart[item.item_id]?.qty || 0;
            return (
              <article
                className={`item-card ${qty > 0 ? "is-selected" : ""}`}
                key={item.item_id}
              >
                <div className="item-media">
                  <MenuImage url={item.image_url} category={item.category} />
                  {qty > 0 && (
                    <span className="item-badge" aria-label={`${qty} in order`}>
                      {qty}
                    </span>
                  )}
                </div>

                <div className="item-body">
                  <h3 className="item-name">{item.item_name}</h3>
                  <span className="item-price">
                    ₱{Number(item.selling_price).toFixed(2)}
                  </span>
                </div>

                {qty === 0 ? (
                  <button
                    className="add-btn"
                    onClick={() => onQtyChange(item, 1)}
                    aria-label={`Add ${item.item_name}`}
                  >
                    + Add
                  </button>
                ) : (
                  <div className="item-stepper">
                    <button
                      className="stepper-btn"
                      onClick={() => onQtyChange(item, qty - 1)}
                      aria-label={`Remove one ${item.item_name}`}
                    >
                      -
                    </button>
                    <span className="stepper-qty">{qty}</span>
                    <button
                      className="stepper-btn stepper-btn--plus"
                      onClick={() => onQtyChange(item, qty + 1)}
                      aria-label={`Add one ${item.item_name}`}
                    >
                      +
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        {!itemsLoading && items.length === 0 && <p className="loading-text">No items in this category yet.</p>}
      </div>
    </div>
  );
}