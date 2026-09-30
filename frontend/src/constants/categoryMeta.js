// Client-side-only display metadata, since the backend only stores a
// plain category string — no icon/color per category exists server-side.
const CATEGORY_META = {
  "Starters": { icon: "🥟", accent: "#c0392b" },
  "Main Course": { icon: "🍛", accent: "#6b46a3" },
  "Main Dish": { icon: "🍛", accent: "#6b46a3" },
  "Beverages": { icon: "🥤", accent: "#a5308c" },
  "Beverage": { icon: "🥤", accent: "#a5308c" },
  "Soups": { icon: "🍲", accent: "#8a6d1f" },
  "Desserts": { icon: "🍰", accent: "#3f5f52" },
  "Noodles": { icon: "🍜", accent: "#1e6b47" },
  "Rice Meals": { icon: "🍚", accent: "#a5301f" },
  "Sides": { icon: "🥗", accent: "#5c3e99" },
};

const DEFAULT_META = { icon: "🍽️", accent: "#555" };

export function getCategoryMeta(categoryName) {
  return CATEGORY_META[categoryName] || DEFAULT_META;
}