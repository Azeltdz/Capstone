// src/pages/cashier/pos/MenuStep.jsx
import { useEffect, useState } from "react";
import { getMenuCategories, getMenuItems } from "../../../api/mockCashier";

export default function MenuStep({ cart, onQtyChange, onBack }) {
  const [categories, setCategories] = useState(null);
  const [categoriesError, setCategoriesError] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  const [items, setItems] = useState(null);
  const [itemsError, setItemsError] = useState("");

  // Load categories once, default to the first one so the menu isn't empty.
  useEffect(() => {
    let cancelled = false;
    getMenuCategories()
      .then((data) => {
        if (cancelled) return;
        setCategories(data);
        if (data.length > 0) setActiveCategory(data[0].key);
      })
      .catch((err) => !cancelled && setCategoriesError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Load items whenever the active category changes.
  useEffect(() => {
    if (!activeCategory) return;
    let cancelled = false;
    setItems(null);
    getMenuItems(activeCategory)
      .then((data) => !cancelled && setItems(data))
      .catch((err) => !cancelled && setItemsError(err.message));
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  return (
    <div className="pos-main">
      <button className="back-link" onClick={onBack}>
        ← Back
      </button>
      <h2 className="step-label">Step 3 — Select menu items</h2>
      <p className="step-sub">Choose a category, then add items to the order</p>

      <div className="category-grid">
        {categoriesError && <p className="error-text">Couldn't load categories. {categoriesError}</p>}
        {!categoriesError && !categories && <p className="loading-text">Loading categories…</p>}
        {categories &&
          categories.map((cat) => (
            <button
              key={cat.key}
              className={`category-card ${activeCategory === cat.key ? "selected" : ""}`}
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
        {itemsError && <p className="error-text">Couldn't load items. {itemsError}</p>}
        {!itemsError && !items && <p className="loading-text">Loading items…</p>}
        {items &&
          items.map((item) => {
            const qty = cart[item.id]?.qty || 0;
            return (
              <div className="item-card" key={item.id}>
                <span className="item-name">{item.name}</span>
                <span className="item-price">₱{item.price.toFixed(2)}</span>
                <div className="item-stepper">
                  <button
                    className="stepper-btn"
                    disabled={qty === 0}
                    onClick={() => onQtyChange(item, qty - 1)}
                  >
                    −
                  </button>
                  <span className="stepper-qty">{qty}</span>
                  <button className="stepper-btn" onClick={() => onQtyChange(item, qty + 1)}>
                    +
                  </button>
                </div>
              </div>
            );
          })}
        {items && items.length === 0 && <p className="loading-text">No items in this category yet.</p>}
      </div>
    </div>
  );
}
