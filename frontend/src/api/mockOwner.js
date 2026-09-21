// src/api/mockOwner.js
//
// TEMPORARY mock functions for every Owner view, shaped exactly like
// the real backend responses will be. Each view calls its own
// get*() function inside a useEffect on mount — swap the function
// body for a real apiFetch(...) call later and nothing in the
// components needs to change.

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// ---------------- Dashboard ----------------
export async function getDashboardData() {
  // Real version later: return apiFetch("/api/dashboard");
  await delay();
  return {
    stats: {
      todaySales: 12660,
      todaySalesChange: "+12% vs yesterday",
      transactions: 98,
      transactionsChange: "+6 vs yesterday",
      lowStockAlerts: 2,
      lowStockNote: "1 branch",
      aiFlags: 1,
      aiFlagNote: "San Roque",
    },
    salesByBranch: [
      { branch: "Poblacion", sales: 8450, pct: 85 },
      { branch: "San Roque", sales: 4210, pct: 42 },
    ],
    topItems: [
      { name: "🍜 Lomi Special", sold: 42 },
      { name: "🍖 Lechon Chami", sold: 31 },
      { name: "🍗 Chicken Lomi", sold: 27 },
      { name: "🍚 Tapsilog", sold: 24 },
      { name: "🥬 Chopsuey", sold: 19 },
    ],
    branchStatus: [
      { name: "Poblacion (Main)", sales: 8450, status: "OK", statusClass: "good", dotClass: "green" },
      { name: "San Roque", sales: 4210, status: "⚠ Flag", statusClass: "flag", dotClass: "orange" },
    ],
    aiRecommendations: [
      { text: "▶ Order 15kg pork shoulder — weekend surge forecast", warn: false },
      { text: "▶ Lomi Special demand HIGH this weekend (+28% avg)", warn: false },
      { text: "⚠ San Roque: 22% fewer transactions — investigate", warn: true },
    ],
  };
}

// ---------------- Transactions ----------------
export async function getTransactionsData() {
  // Real version later: return apiFetch(`/api/transactions?${params}`);
  await delay();
  return {
    stats: { totalToday: 12660, count: 98, avgOrder: 129.18, paymentSplit: "55% / 37% / 8%" },
    branchStats: {
      Poblacion: { totalToday: 8450, count: 64, avgOrder: 132.03, paymentSplit: "57% / 35% / 8%" },
      "San Roque": { totalToday: 4210, count: 34, avgOrder: 123.82, paymentSplit: "51% / 41% / 8%" },
    },
    weeklyTrend: [
      { day: "Mon", poblacion: 70, sanRoque: 35 },
      { day: "Tue", poblacion: 68, sanRoque: 32 },
      { day: "Wed", poblacion: 80, sanRoque: 36 },
      { day: "Thu", poblacion: 78, sanRoque: 38 },
      { day: "Fri", poblacion: 85, sanRoque: 40 },
      { day: "Sat", poblacion: 88, sanRoque: 42 },
      { day: "Sun(est)", poblacion: 65, sanRoque: 30, projected: true },
    ],
    rows: [
      {
        id: "#TXN-0247", branch: "Poblacion", cashier: "Maria C.", time: "11:42 AM",
        type: "Dine-in T3", typeKey: "Dine-in", total: 270.0, payment: "GCash",
        items: [
          { name: "Lomi Special", qty: 2, price: 95.0 },
          { name: "Chami Plain", qty: 1, price: 70.0 },
          { name: "Iced Tea", qty: 1, price: 10.0 },
        ],
      },
      {
        id: "#TXN-0246", branch: "Poblacion", cashier: "Maria C.", time: "11:35 AM",
        type: "Delivery", typeKey: "Delivery", total: 320.0, payment: "Cash",
        items: [
          { name: "Lechon Chami", qty: 2, price: 110.0 },
          { name: "Chicken Lomi", qty: 1, price: 85.0 },
          { name: "Delivery Fee", qty: 1, price: 15.0 },
        ],
      },
      {
        id: "#TXN-0238", branch: "San Roque", cashier: "Jose R.", time: "11:18 AM",
        type: "Take-out", typeKey: "Take-out", total: 185.0, payment: "Card",
        items: [
          { name: "Lomi Special", qty: 1, price: 95.0 },
          { name: "Bangsilog", qty: 1, price: 90.0 },
        ],
      },
      {
        id: "#TXN-0229", branch: "San Roque", cashier: "Jose R.", time: "10:55 AM",
        type: "Dine-in T5", typeKey: "Dine-in", total: 190.0, payment: "GCash",
        items: [
          { name: "Tapsilog", qty: 1, price: 100.0 },
          { name: "Bangsilog", qty: 1, price: 90.0 },
        ],
      },
    ],
  };
}

// ---------------- Inventory ----------------
const INVENTORY_ITEMS = [
  { name: "Pork Shoulder", unit: "kg", onHand: 12.5, reorder: 8.0, status: "Good", updated: "2 min ago" },
  { name: "Egg Noodles", unit: "kg", onHand: 3.2, reorder: 5.0, status: "Low", updated: "2 min ago" },
  { name: "Chami Noodles", unit: "kg", onHand: 8.0, reorder: 4.0, status: "Good", updated: "2 min ago" },
  { name: "Chicken Breast", unit: "kg", onHand: 6.5, reorder: 3.0, status: "Good", updated: "5 min ago" },
  { name: "Lechon Kawali", unit: "pcs", onHand: 18, reorder: 10, status: "Good", updated: "2 min ago" },
  { name: "Mixed Vegetables", unit: "kg", onHand: 5.0, reorder: 2.0, status: "Good", updated: "8 min ago" },
];

export async function getInventory({ search = "", status = "all" } = {}) {
  // Real version later: return apiFetch(`/api/inventory?${params}`);
  await delay();
  return INVENTORY_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || item.status === status;
    return matchesSearch && matchesStatus;
  });
}

// ---------------- Food Costing ----------------
export async function getFoodCostingData() {
  // Real version later: return apiFetch("/api/food-costing");
  await delay();
  return {
    stats: { avgFoodCostPct: "37.2%", highestMarginItem: "Chami Plain", highestMarginPct: "68.5%", lowestMarginItem: "Lechon Chami", lowestMarginPct: "57.3%" },
    rows: [
      { name: "🍜 Lomi Special", sellPrice: 95.0, cost: 35.85, margin: 62.3, bomCount: 7 },
      { name: "🍲 Chami Plain", sellPrice: 70.0, cost: 22.05, margin: 68.5, bomCount: 5 },
      { name: "🍖 Lechon Chami", sellPrice: 110.0, cost: 46.97, margin: 57.3, bomCount: 8 },
      { name: "🍗 Chicken Lomi", sellPrice: 85.0, cost: 30.6, margin: 64.0, bomCount: 6 },
      { name: "🍚 Tapsilog", sellPrice: 100.0, cost: 36.0, margin: 64.0, bomCount: 5 },
      { name: "🍳 Bangsilog", sellPrice: 95.0, cost: 33.25, margin: 65.0, bomCount: 5 },
      { name: "🥬 Chopsuey", sellPrice: 80.0, cost: 26.4, margin: 67.0, bomCount: 6 },
    ],
  };
}

// ---------------- AI Analytics ----------------
export async function getAnalyticsData() {
  // Real version later: return apiFetch("/api/analytics");
  await delay();
  return {
    trend: [
      { day: "Mon", value: 40 },
      { day: "Tue", value: 38 },
      { day: "Wed", value: 45 },
      { day: "Thu", value: 44 },
      { day: "Fri", value: 47, highVolume: true },
      { day: "Sat", value: 50, highVolume: true },
      { day: "Sun", value: 54, projected: true },
    ],
    movingAvg: 43.7,
    trendDirection: "↑ INCREASING",
    trendNote: "+24% recent vs earlier",
    demandClass: "HIGH",
    demandNote: "Weekend surge expected",
    summary: [
      { item: "🍜 Lomi Special", avg: 43.7, trend: "INCREASING", recommendation: "Order 12kg pork shoulder before Saturday" },
      { item: "🍖 Lechon Chami", avg: 31.2, trend: "STABLE", recommendation: "Stock sufficient — no urgent reorder" },
      { item: "🍗 Chicken Lomi", avg: 27.4, trend: "INCREASING", recommendation: "Restock chicken breast — prepare +8kg" },
      { item: "🥬 Chopsuey", avg: 19.1, trend: "DECREASING", recommendation: "Reduce prep quantity — minimize waste" },
    ],
    procurement: [
      { item: "Pork Shoulder", amount: "+12 kg" },
      { item: "Egg Noodles", amount: "+8 kg" },
      { item: "Chami Noodles", amount: "+5 kg" },
      { item: "Chicken Breast", amount: "+8 kg" },
    ],
    branchFlag: {
      text: "San Roque: 22% fewer transactions than expected.",
      sub: "Expected ~38 txns · Only 29 recorded (Tue).",
    },
  };
}

// ---------------- Staff ----------------
export async function getStaffData() {
  // Real version later: return apiFetch("/api/staff");
  await delay();
  return {
    stats: { total: 7, activeAccounts: 7, roles: "1 Admin · 6 Cashiers" },
    rows: [
      { name: "Filipina Sarabia", username: "filipina.owner", branch: "All Branches", role: "Admin", status: "Active", isAdmin: true },
      { name: "Maria Cruz", username: "maria.c", branch: "Poblacion", role: "Cashier", status: "Active", isAdmin: false },
      { name: "Jose Reyes", username: "jose.r", branch: "San Roque", role: "Cashier", status: "Active", isAdmin: false },
    ],
  };
}

// ---------------- Branches ----------------
export async function getBranchesData() {
  // Real version later: return apiFetch("/api/branches");
  await delay();
  return [
    { name: "Poblacion", location: "Bauan, Batangas", staffCount: 5, status: "Active", sales: 8450, contact: "09XX-XXX-XXXX", tag: "Main", flagged: false },
    { name: "San Roque", location: "Bauan, Batangas", staffCount: 2, status: "Flagged", sales: 4210, contact: "09XX-XXX-XXXX", tag: "⚠ Flag", flagged: true },
  ];
}

// ---------------- Settings ----------------
export async function getSettingsData() {
  // Real version later: return apiFetch("/api/settings");
  await delay();
  return {
    analytics: { movingAvgWindow: 7, trendThreshold: 10, anomalyThreshold: 20 },
    receipt: { businessName: "Filipee's Bistro", tagline: "Sarap ng Batangas Lomi!", footer: "Salamat! Bumalik kayo ulit 🍜" },
    inventoryAlerts: { lowStockKg: "5.0 kg", lowStockPcs: "10 pcs" },
  };
}
