// src/api/mockCashier.js
//
// TEMPORARY mock functions, shaped exactly like the real backend
// endpoints will respond. Swapping these for real calls later means
// changing the BODY of each function only — every page that calls
// them (POSView.jsx, OrdersView.jsx) stays exactly the same, because
// they only care about the shape of what's returned, not where it
// came from.

let orderTypesCache = null;

export async function getOrderTypes() {
  if (orderTypesCache) return orderTypesCache;
  // Real version later:
  //   orderTypesCache = await apiFetch("/api/order-types");
  await new Promise((r) => setTimeout(r, 150));
  orderTypesCache = [
    { type: "Dine-in", icon: "🍽️", desc: "Customer eats here" },
    { type: "Take-out", icon: "🥡", desc: "Customer takes away" },
    { type: "Delivery", icon: "🛵", desc: "Deliver to address" },
  ];
  return orderTypesCache;
}

// Status values match the filter tabs on the Orders screen: "In Progress",
// "Ready", "Completed". "Card" was removed as a mock payment value since
// the app now only offers Cash / GCash (see CartPanel.jsx).
const MOCK_ORDERS = [
  { id: "#TXN-0247", time: "11:42 AM", type: "Dine-in", orderLabel: "#247 / Dine-in", items: "Lomi Special ×2, Chopsuey ×1", itemCount: 3, total: 270.0, payment: "GCash", customer: "Juan Dela Cruz", status: "Ready" },
  { id: "#TXN-0246", time: "11:35 AM", type: "Delivery", orderLabel: "#246 / Delivery", items: "Lechon Chami ×2, Tapsilog ×1", itemCount: 3, total: 320.0, payment: "Cash", customer: "Maria Santos", status: "In Progress" },
  { id: "#TXN-0245", time: "11:20 AM", type: "Dine-in", orderLabel: "#245 / Dine-in", items: "Chami Plain ×2, Bangsilog ×1", itemCount: 3, total: 235.0, payment: "GCash", customer: "Pedro Reyes", status: "Completed" },
  { id: "#TXN-0244", time: "11:08 AM", type: "Take-out", orderLabel: "#244 / Take-out", items: "Chicken Lomi ×1, Tapsilog ×1", itemCount: 2, total: 185.0, payment: "Cash", customer: "Ana Garcia", status: "Ready" },
  { id: "#TXN-0243", time: "10:55 AM", type: "Delivery", orderLabel: "#243 / Delivery", items: "Bangsilog ×2, Chopsuey ×2", itemCount: 4, total: 350.0, payment: "GCash", customer: "Jose Mercado", status: "In Progress" },
];

const STATUS_META = {
  Ready: { subtext: "Ready to serve", dotClass: "dot-green" },
  "In Progress": { subtext: "Preparing order", dotClass: "dot-orange" },
  Completed: { subtext: "Order completed", dotClass: "dot-blue" },
};

function initialsFor(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function fetchOrders({ status = "all" } = {}) {
  // Real version later:
  //   const params = new URLSearchParams({ branch: user.branchId, status });
  //   return apiFetch(`/api/transactions?${params}`);
  await new Promise((r) => setTimeout(r, 200));
  const filtered = status === "all" ? MOCK_ORDERS : MOCK_ORDERS.filter((o) => o.status === status);
  const withDisplayFields = filtered.map((o) => ({
    ...o,
    initials: initialsFor(o.customer),
    subtext: STATUS_META[o.status].subtext,
    dotClass: STATUS_META[o.status].dotClass,
    date: "January 18, 2025 " + o.time,
  }));
  return { orders: withDisplayFields, totalCount: MOCK_ORDERS.length };
}

// ---------------- Tables (Dine-in only) ----------------
// "occupied" tables here match the T1/T3/T5 tables already referenced
// in MOCK_ORDERS above, so the two mock datasets stay consistent.
let tablesCache = null;

export async function getTables() {
  // Real version later: return apiFetch("/api/tables?branch=poblacion");
  if (tablesCache) return tablesCache;
  await new Promise((r) => setTimeout(r, 150));
  tablesCache = Array.from({ length: 9 }, (_, i) => {
    const number = i + 1;
    return {
      number,
      seats: Math.random() < 0.5 ? 2 : 4, // randomized once, then cached
      status: [1, 3, 5].includes(number) ? "occupied" : "available",
    };
  });
  return tablesCache;
}

// ---------------- Menu categories + items ----------------
let categoriesCache = null;

export async function getMenuCategories() {
  // Real version later: return apiFetch("/api/menu-categories");
  if (categoriesCache) return categoriesCache;
  await new Promise((r) => setTimeout(r, 150));
  categoriesCache = [
    { key: "starters", name: "Starters", icon: "🥟", accent: "#c0392b" },
    { key: "main-course", name: "Main Course", icon: "🍛", accent: "#6b46a3" },
    { key: "beverages", name: "Beverages", icon: "🥤", accent: "#a5308c" },
    { key: "soups", name: "Soups", icon: "🍲", accent: "#8a6d1f" },
    { key: "desserts", name: "Desserts", icon: "🍰", accent: "#3f5f52" },
    { key: "noodles", name: "Noodles", icon: "🍜", accent: "#1e6b47" },
    { key: "rice-meals", name: "Rice Meals", icon: "🍚", accent: "#a5301f" },
    { key: "sides", name: "Sides", icon: "🥗", accent: "#5c3e99" },
  ];
  return categoriesCache.map((c) => ({ ...c, itemCount: MENU_ITEMS[c.key]?.length || 0 }));
}

const MENU_ITEMS = {
  starters: [
    { id: "st-1", name: "Lumpiang Shanghai", price: 90 },
    { id: "st-2", name: "Calamares", price: 130 },
    { id: "st-3", name: "Chicharon Bulaklak", price: 150 },
  ],
  "main-course": [
    { id: "mc-1", name: "Lechon Kawali", price: 180 },
    { id: "mc-2", name: "Beef Caldereta", price: 210 },
    { id: "mc-3", name: "Chicken Adobo", price: 150 },
  ],
  beverages: [
    { id: "bv-1", name: "Iced Tea", price: 45 },
    { id: "bv-2", name: "Buko Juice", price: 55 },
    { id: "bv-3", name: "Softdrinks", price: 40 },
  ],
  soups: [
    { id: "sp-1", name: "Sinigang na Baboy", price: 170 },
    { id: "sp-2", name: "Bulalo", price: 220 },
  ],
  desserts: [
    { id: "ds-1", name: "Halo-Halo", price: 100 },
    { id: "ds-2", name: "Leche Flan", price: 70 },
    { id: "ds-3", name: "Turon", price: 40 },
    { id: "ds-4", name: "Buko Pandan", price: 60 },
  ],
  noodles: [
    { id: "nd-1", name: "Lomi Special", price: 95 },
    { id: "nd-2", name: "Chami Plain", price: 70 },
    { id: "nd-3", name: "Chicken Lomi", price: 85 },
  ],
  "rice-meals": [
    { id: "rm-1", name: "Tapsilog", price: 100 },
    { id: "rm-2", name: "Bangsilog", price: 95 },
  ],
  sides: [
    { id: "sd-1", name: "Chopsuey", price: 80 },
    { id: "sd-2", name: "Garlic Rice", price: 35 },
  ],
};

export async function getMenuItems(categoryKey) {
  // Real version later: return apiFetch(`/api/menu-items?category=${categoryKey}`);
  await new Promise((r) => setTimeout(r, 150));
  return MENU_ITEMS[categoryKey] || [];
}