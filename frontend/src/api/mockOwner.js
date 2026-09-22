// src/api/mockOwner.js
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
      { name: "Sisig", sold: 43, branch: "Poblacion" },
      { name: "Lechon Kawali", sold: 35, branch: "San Roque" },
      { name: "🍜 Lomi Special", sold: 42, branch: "San Roque" },
      { name: "🍖 Lechon Chami", sold: 31, branch: "San Roque" },
      { name: "🍗 Chicken Lomi", sold: 27, branch: "San Roque" },
      { name: "🍚 Tapsilog", sold: 24, branch: "Poblacion" },
      { name: "🥬 Chopsuey", sold: 19, branch: "Poblacion" },
    ],
    branchStatus: [
      { name: "Poblacion", sales: 8450, status: "OK", statusClass: "good", dotClass: "green" },
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
      { day: "Sun", poblacion: 65, sanRoque: 30 },
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
// Kept as the single source of truth for ingredient stock — the AI Analytics
// engine below reads from this same list so the two tabs can never disagree
// (e.g. Egg Noodles shows "Low" here AND is the item the AI flags for reorder).
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

// ================================================================
// AI Analytics — mock PostgreSQL-shaped data + the actual rule-based
// engine described in Chapter 3 (§3.4 "AI Forecasting Process Flow").
//
// The tables below stand in for what the real backend will query:
//
//   SELECT ti.item_id, t.branch_id, DATE(t.transaction_at) AS sale_date,
//          SUM(ti.quantity) AS qty_sold
//   FROM transactions t
//   JOIN transaction_items ti ON ti.transaction_id = t.id
//   WHERE t.transaction_at >= NOW() - INTERVAL '7 days'
//   GROUP BY ti.item_id, t.branch_id, DATE(t.transaction_at);
//
// DAILY_SALES below is exactly that query's result set, just inlined
// instead of fetched — so swapping in a real apiFetch("/api/analytics")
// later means only rewriting getAnalyticsData()'s body; every function
// in this section (movingAverage, classifyTrend, classifyDemand,
// reorderQtyFor, getBranchAnomalies) is the real logic the Node.js
// backend will run against Postgres, not a placeholder.
// ================================================================

// Sun = the most recent day ("today"); Mon = 6 days ago.
const ANALYTICS_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MENU_ITEMS = [
  { id: 1, name: "🍜 Lomi Special" },
  { id: 2, name: "🍖 Lechon Chami" },
  { id: 3, name: "🍗 Chicken Lomi" },
  { id: 4, name: "🥬 Chopsuey" },
];

// mirrors the GROUP BY result above: one row per (item, branch) with a
// quantity-sold value for each of the 7 days
const DAILY_SALES = [
  { itemId: 1, branchId: 1, qtyByDay: [14, 13, 15, 14, 17, 19, 20] }, // Lomi Special · Poblacion
  { itemId: 1, branchId: 2, qtyByDay: [12, 11, 13, 12, 15, 17, 18] }, // Lomi Special · San Roque
  { itemId: 2, branchId: 1, qtyByDay: [16, 15, 17, 16, 15, 16, 15] }, // Lechon Chami · Poblacion
  { itemId: 2, branchId: 2, qtyByDay: [14, 15, 14, 15, 14, 15, 14] }, // Lechon Chami · San Roque
  { itemId: 3, branchId: 1, qtyByDay: [10, 11, 10, 11, 13, 14, 15] }, // Chicken Lomi · Poblacion
  { itemId: 3, branchId: 2, qtyByDay: [9, 9, 10, 10, 12, 13, 14] },   // Chicken Lomi · San Roque
  { itemId: 4, branchId: 1, qtyByDay: [12, 11, 10, 9, 8, 7, 6] },     // Chopsuey · Poblacion
  { itemId: 4, branchId: 2, qtyByDay: [10, 9, 9, 8, 7, 6, 5] },       // Chopsuey · San Roque
];

// mirrors a `bill_of_materials` table: ingredient qty consumed per serving.
// Only listed for the ingredient(s) that actually drive that item's reorder math.
const BOM = {
  1: [{ ingredient: "Egg Noodles", qtyPerServing: 0.15 }, { ingredient: "Pork Shoulder", qtyPerServing: 0.10 }],
  2: [{ ingredient: "Chami Noodles", qtyPerServing: 0.15 }, { ingredient: "Pork Shoulder", qtyPerServing: 0.22 }],
  3: [{ ingredient: "Egg Noodles", qtyPerServing: 0.15 }, { ingredient: "Chicken Breast", qtyPerServing: 0.18 }],
  4: [{ ingredient: "Mixed Vegetables", qtyPerServing: 0.28 }],
};

// mirrors per-branch daily transaction COUNTS (not sales qty) for the last
// 7 days, used only for the branch-anomaly flag. `today` is the day being
// evaluated against the 7-day baseline. Keyed by branch id — a branch with
// no entry here (e.g. one just created via Branch Management, with no
// transaction history yet) is simply skipped by getBranchAnomalies().
const BRANCH_TXN_HISTORY = {
  1: { priorDays: [58, 60, 57, 61, 59, 63, 60], today: 64 },
  2: { priorDays: [39, 37, 40, 38, 36, 41, 37], today: 29 },
};

// ---------------- Settings (shared, mutable "DB row") ----------------
// This is the exact object the Settings tab reads and writes — see
// getSettingsData / updateAnalyticsSettings / updateReceiptSettings /
// updateInventoryAlertSettings near the bottom of this file. It's declared
// up here, ahead of the engine functions below, so that changing "Trend
// Threshold %" or "Branch Anomaly Flag Threshold %" on the Settings screen
// immediately changes what the AI engine classifies as Increasing /
// Decreasing / Flagged, instead of the screen just cosmetically storing
// numbers nobody reads (which is what two separate hardcoded consts here
// would silently do).
//
// Real version later: this becomes a single-row `settings` table (or a
// key/value `app_settings` table), fetched once instead of living in
// memory — same shape, so every caller below stays unchanged.
let _settingsDB = {
  analytics: { movingAvgWindow: 7, trendThreshold: 10, anomalyThreshold: 20 },
  receipt: {
    businessName: "Filipee's Bistro",
    tagline: "Sarap ng Batangas Lomi!",
    footer: "Salamat! Bumalik kayo ulit 🍜",
  },
  inventoryAlerts: { lowStockKg: "5.0 kg", lowStockPcs: "10 pcs" },
};
// Note: movingAvgWindow is stored and shown for the owner to edit, but the
// mock DAILY_SALES/BRANCH_TXN_HISTORY arrays above are fixed at 7 days of
// history, so the engine below still always averages over 7 days. Once
// DAILY_SALES is a real query, movingAvgWindow just becomes the N in that
// query's `INTERVAL 'N days'` and this stops being a mock-data limitation.

// ---------------- rule-based engine ----------------

function movingAverage(values) {
  const clean = values.filter((v) => v !== null && v !== undefined);
  if (clean.length === 0) return 0;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

// Splits the trailing 7 days into days 1-4 (earlier) and days 5-7 (recent)
// per Ch.3 §3.4 step 3, and applies the owner-configurable trend threshold.
function classifyTrend(qtyByDay) {
  const last7 = qtyByDay.slice(-7);
  const earlier4 = last7.slice(0, 4);
  const recent3 = last7.slice(4, 7);
  const earlierAvg = movingAverage(earlier4);
  const recentAvg = movingAverage(recent3);
  const thresholdPct = _settingsDB.analytics.trendThreshold;
  if (earlierAvg === 0) return { pctChange: 0, trend: "STABLE" };
  const pctChange = ((recentAvg - earlierAvg) / earlierAvg) * 100;
  if (pctChange > thresholdPct) return { pctChange, trend: "INCREASING" };
  if (pctChange < -thresholdPct) return { pctChange, trend: "DECREASING" };
  return { pctChange, trend: "STABLE" };
}

// Ch.3 (§2 "Requirement Specification" / §3.5.4) describes demand High/Medium/Low
// as the SAME recent-3-day-vs-prior-4-day comparison — just labelled differently
// from the per-item Increasing/Stable/Decreasing trend badge.
function classifyDemand(trend) {
  if (trend === "INCREASING") return "HIGH";
  if (trend === "DECREASING") return "LOW";
  return "MEDIUM";
}

// Per Ch.3 §3.4 step 4: reorder qty is only computed "for increasing demand" —
// (moving average × BOM qty per serving) − current stock on hand.
function reorderRowsFor(itemId, avg, trend, ingredientStock) {
  if (trend !== "INCREASING") return [];
  const bomRows = BOM[itemId] || [];
  return bomRows
    .map((row) => {
      const needed = avg * row.qtyPerServing;
      const onHand = ingredientStock[row.ingredient] ?? 0;
      const shortfall = needed - onHand;
      return { ingredient: row.ingredient, needed, onHand, shortfall };
    })
    .filter((r) => r.shortfall > 0);
}

function recommendationFor(trend, reorderRows) {
  if (trend === "INCREASING") {
    if (reorderRows.length === 0) return "Demand rising — stock is still sufficient";
    const top = reorderRows.reduce((max, r) => (r.shortfall > max.shortfall ? r : max));
    return `Order ${top.shortfall.toFixed(1)}kg ${top.ingredient.toLowerCase()} before the weekend`;
  }
  if (trend === "DECREASING") return "Reduce prep quantity — minimize waste";
  return "Stock sufficient — no urgent reorder";
}

function dailySalesFor(itemId, branchId) {
  const rows = DAILY_SALES.filter((r) => r.itemId === itemId && (branchId == null || r.branchId === branchId));
  return ANALYTICS_DAYS.map((_, i) => rows.reduce((sum, r) => sum + r.qtyByDay[i], 0));
}

// Reads branches from BRANCHES_DB (defined in the Branches section below —
// safe to reference here because this function only runs when called, by
// which point the whole module, including BRANCHES_DB, has finished
// initializing). Previously this read from a separate hardcoded `BRANCHES`
// array that duplicated BRANCHES_DB; keeping one branches list means a
// branch created/renamed via Branch Management is automatically correct
// here too, instead of needing to be kept in sync by hand in two places.
function getBranchAnomalies() {
  const thresholdPct = _settingsDB.analytics.anomalyThreshold;
  return BRANCHES_DB.map((b) => {
    const hist = BRANCH_TXN_HISTORY[b.id];
    if (!hist) return null; // no transaction history mocked yet for this branch
    const expected = movingAverage(hist.priorDays);
    const pctBelow = expected === 0 ? 0 : ((expected - hist.today) / expected) * 100;
    return {
      branchId: b.id,
      branch: b.name,
      expected,
      actual: hist.today,
      pctBelow,
      flagged: pctBelow > thresholdPct,
    };
  }).filter(Boolean);
}

// Populates the two filter dropdowns. A real backend would expose this as
// its own lightweight endpoint (e.g. GET /api/analytics/filters) so the
// dropdown options load once, separately from the heavier analytics call.
export async function getAnalyticsFilters() {
  await delay(80);
  return { menuItems: MENU_ITEMS, branches: BRANCHES_DB.map(({ id, name }) => ({ id, name })) };
}

// itemId: which menu item's chart/badges to show (defaults to Lomi Special)
// branchId: null = "All Branches" (sums both branches, like a GROUP BY
// with the branch_id column dropped), or a specific branch id
export async function getAnalyticsData({ itemId = 1, branchId = null } = {}) {
  // Real version later: return apiFetch(`/api/analytics?itemId=${itemId}&branchId=${branchId ?? "all"}`);
  await delay();

  const ingredientStock = Object.fromEntries(INVENTORY_ITEMS.map((i) => [i.name, i.onHand]));

  const qtyByDay = dailySalesFor(itemId, branchId);
  const avg = movingAverage(qtyByDay);
  const { pctChange, trend } = classifyTrend(qtyByDay);
  const demandClass = classifyDemand(trend);

  const trendPoints = ANALYTICS_DAYS.map((day, i) => ({
    day,
    value: qtyByDay[i],
    highVolume: qtyByDay[i] > avg * 1.1,
  }));

  // Per-item summary table — computed live for every item under the current
  // branch filter, not hardcoded.
  const summary = MENU_ITEMS.map((m) => {
    const q = dailySalesFor(m.id, branchId);
    const a = movingAverage(q);
    const { trend: t } = classifyTrend(q);
    const reorderRows = reorderRowsFor(m.id, a, t, ingredientStock);
    return {
      item: m.name,
      avg: Math.round(a * 10) / 10,
      trend: t,
      recommendation: recommendationFor(t, reorderRows),
    };
  });

  // Procurement panel — aggregate reorder shortfalls by ingredient, across
  // every item currently classified as INCREASING demand.
  const procurementMap = {};
  MENU_ITEMS.forEach((m) => {
    const q = dailySalesFor(m.id, branchId);
    const a = movingAverage(q);
    const { trend: t } = classifyTrend(q);
    reorderRowsFor(m.id, a, t, ingredientStock).forEach((r) => {
      procurementMap[r.ingredient] = (procurementMap[r.ingredient] || 0) + r.shortfall;
    });
  });
  const procurement = Object.entries(procurementMap).map(([ingredient, amount]) => ({
    item: ingredient,
    amount: `+${amount.toFixed(1)} kg`,
  }));

  const anomalies = getBranchAnomalies();
  const flagged = anomalies.find((a) => a.flagged);
  const branchFlag = flagged
    ? {
        text: `${flagged.branch}: ${flagged.pctBelow.toFixed(0)}% fewer transactions than expected.`,
        sub: `Expected ~${Math.round(flagged.expected)} txns · Only ${flagged.actual} recorded today.`,
      }
    : {
        text: "All branches within expected range.",
        sub: `No branch is more than ${_settingsDB.analytics.anomalyThreshold}% below its 7-day average today.`,
      };

  return {
    trend: trendPoints,
    movingAvg: Math.round(avg * 10) / 10,
    trendDirection: trend, // "INCREASING" | "DECREASING" | "STABLE" — component maps this to a Lucide icon
    trendNote: `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(0)}% recent vs earlier`,
    demandClass,
    demandNote:
      demandClass === "HIGH" ? "Surge expected — reorder soon" : demandClass === "LOW" ? "Trim prep to reduce waste" : "Holding steady",
    summary,
    procurement,
    branchFlag,
    branchAnomalies: anomalies,
  };
}

// ---------------- Staff ----------------
// Pulled out as its own const (rather than inlined in getStaffData) because
// the Branches section below needs to derive each branch's staffCount from
// this same list — mirrors a real `SELECT branch_id, COUNT(*) FROM staff
// GROUP BY branch_id` query joined into the branches response.
const STAFF_ROWS = [
  { name: "Filipina Sarabia", username: "filipina.owner", branch: "All Branches", role: "Admin", status: "Active", isAdmin: true },
  { name: "Maria Cruz", username: "maria.c", branch: "Poblacion", role: "Cashier", status: "Active", isAdmin: false },
  { name: "Jose Reyes", username: "jose.r", branch: "San Roque", role: "Cashier", status: "Active", isAdmin: false },
];

export async function getStaffData() {
  // Real version later: return apiFetch("/api/staff");
  await delay();
  return {
    stats: { total: STAFF_ROWS.length, activeAccounts: STAFF_ROWS.filter((s) => s.status === "Active").length, roles: "1 Admin · 6 Cashiers" },
    rows: STAFF_ROWS.map((s) => ({ ...s })),
  };
}

// ================================================================
// Branches — mock "database" + full CRUD.
//
// This section is deliberately written the way the real Postgres-backed
// version will work: a `branches` table with a stable primary key (`id`),
// queried/mutated through functions (list/create/update/deactivate/
// reactivate/delete) that every component calls by name. BranchesView.jsx
// never touches BRANCHES_DB directly, so swapping this section for real
// HTTP calls is a one-file change. It is also the ONLY branches list in
// this file — the AI Analytics section above reads from it too — so there
// is exactly one place a branch's id, name, or table count can drift.
//
// Real schema this stands in for:
//   CREATE TABLE branches (
//     id SERIAL PRIMARY KEY,
//     name TEXT NOT NULL,
//     location TEXT,
//     contact TEXT,
//     table_count INT NOT NULL DEFAULT 0,  -- POS table-selection screen
//     flagged BOOLEAN DEFAULT FALSE,       -- AI/anomaly flag (low txn volume, etc.)
//     deactivated BOOLEAN DEFAULT FALSE,   -- must be true before a row can be deleted
//     sales NUMERIC DEFAULT 0              -- derived from today's transactions in practice
//   );
// `staff_count` is NOT a column here — it's a COUNT(*) of staff accounts
// whose branch_id points at this branch (see getStaffData), so it can never
// be hand-edited from the branch form. See computeStaffCount() below.
// ================================================================

let _branchIdSeq = 3; // next id to hand out — a real DB uses SERIAL/UUID instead
let BRANCHES_DB = [
  { id: 1, name: "Poblacion", location: "Bauan, Batangas", sales: 8450, contact: "09XX-XXX-XXXX", tableCount: 8, flagged: false, deactivated: false },
  { id: 2, name: "San Roque", location: "Bauan, Batangas", sales: 4210, contact: "09XX-XXX-XXXX", tableCount: 6, flagged: true, deactivated: false },
];

// Real version later: staffCount comes back already joined from the branches
// endpoint (e.g. a `staff_count` column populated by COUNT(*)... GROUP BY
// branch_id), so this helper simply disappears once that's true.
function computeStaffCount(branchName) {
  return STAFF_ROWS.filter((s) => s.branch === branchName).length;
}

// Recomputes the display-only fields (status/tag/staffCount) so callers only
// ever set the underlying flags (`flagged`, `deactivated`) and these stay in
// sync — same as a Postgres GENERATED column or a view would do server-side.
function deriveBranchDisplayFields(branch) {
  const status = branch.deactivated ? "Deactivated" : branch.flagged ? "Flagged" : "Active";
  const tag = branch.deactivated ? "Deactivated" : branch.flagged ? "⚠ Flag" : "Main";
  return {
    ...branch,
    staffCount: computeStaffCount(branch.name),
    status,
    tag,
  };
}

export async function getBranchesData() {
  // Real version later: return apiFetch("/api/branches");
  await delay();
  // Return copies (with derived fields recomputed) so components can't
  // accidentally mutate the "DB" by editing the object they got back.
  return BRANCHES_DB.map((b) => deriveBranchDisplayFields(b));
}

export async function createBranch(data) {
  // Real version later:
  // return apiFetch("/api/branches", { method: "POST", body: JSON.stringify(data) });
  await delay();
  const name = data.name?.trim();
  if (!name) throw new Error("Branch name is required.");

  // staffCount is intentionally not accepted here — a brand-new branch has
  // no staff accounts assigned to it yet, so it's computed as 0 until staff
  // are added via Staff Management.
  const branch = {
    id: _branchIdSeq++,
    name,
    location: data.location?.trim() || "",
    contact: data.contact?.trim() || "",
    tableCount: Number(data.tableCount) || 0,
    sales: 0,
    flagged: false,
    deactivated: false,
  };
  BRANCHES_DB.push(branch);
  return deriveBranchDisplayFields(branch);
}

export async function updateBranch(id, data) {
  // Real version later:
  // return apiFetch(`/api/branches/${id}`, { method: "PUT", body: JSON.stringify(data) });
  await delay();
  const idx = BRANCHES_DB.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Branch not found.");
  const name = data.name?.trim();
  if (!name) throw new Error("Branch name is required.");

  // staffCount is deliberately never taken from `data` — it's derived from
  // the Staff Management table, not editable on the branch form.
  BRANCHES_DB[idx] = {
    ...BRANCHES_DB[idx],
    name,
    location: data.location?.trim() || "",
    contact: data.contact?.trim() || "",
    tableCount: data.tableCount !== undefined ? Number(data.tableCount) || 0 : BRANCHES_DB[idx].tableCount,
  };
  return deriveBranchDisplayFields(BRANCHES_DB[idx]);
}

// Lighter-weight than updateBranch(): the Settings screen only ever needs to
// change table counts (it doesn't show location/contact fields), so it gets
// its own small setter instead of having to assemble a full branch payload
// just to patch one number.
export async function updateBranchTableCount(id, tableCount) {
  // Real version later:
  // return apiFetch(`/api/branches/${id}/table-count`, { method: "PATCH", body: JSON.stringify({ tableCount }) });
  await delay();
  const idx = BRANCHES_DB.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Branch not found.");
  const n = Number(tableCount);
  if (!Number.isInteger(n) || n < 0) throw new Error("Table count must be a whole non-negative number.");
  BRANCHES_DB[idx] = { ...BRANCHES_DB[idx], tableCount: n };
  return deriveBranchDisplayFields(BRANCHES_DB[idx]);
}

// Step 1 of removing a branch: mark it deactivated. A deactivated branch
// stops appearing as a normal operating branch (cashiers can't log sales to
// it, etc. — enforced backend-side later) but its row/history is kept.
export async function deactivateBranch(id) {
  // Real version later:
  // return apiFetch(`/api/branches/${id}/deactivate`, { method: "POST" });
  await delay();
  const idx = BRANCHES_DB.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Branch not found.");
  BRANCHES_DB[idx] = { ...BRANCHES_DB[idx], deactivated: true };
  return deriveBranchDisplayFields(BRANCHES_DB[idx]);
}

// Undo for the above — lets a branch be brought back without having to
// re-create it.
export async function reactivateBranch(id) {
  // Real version later:
  // return apiFetch(`/api/branches/${id}/reactivate`, { method: "POST" });
  await delay();
  const idx = BRANCHES_DB.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Branch not found.");
  BRANCHES_DB[idx] = { ...BRANCHES_DB[idx], deactivated: false };
  return deriveBranchDisplayFields(BRANCHES_DB[idx]);
}

// Step 2: permanently delete. Only allowed once a branch has already been
// deactivated — this check is re-enforced here (not just in the UI) exactly
// like a real backend would guard it with a CHECK/trigger or a service-layer
// rule, so a stray direct call can't skip the deactivate step.
export async function deleteBranch(id) {
  // Real version later:
  // return apiFetch(`/api/branches/${id}`, { method: "DELETE" });
  await delay();
  const idx = BRANCHES_DB.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Branch not found.");
  if (!BRANCHES_DB[idx].deactivated) {
    throw new Error("Deactivate this branch before deleting it.");
  }
  BRANCHES_DB.splice(idx, 1);
  return { id };
}

// ---------------- Settings ----------------
// Reads/writes the _settingsDB object declared up in the AI Analytics
// section (so the engine sees live threshold values the moment the owner
// saves them). Table counts are NOT part of _settingsDB — they live on
// BRANCHES_DB itself, same as location/contact — but are still surfaced
// through getSettingsData() so the Settings screen can load everything it
// needs (per Ch.3 Fig. 23: analytics thresholds, receipt text, and "number
// of tables per branch used by the POS table selection screen") in one call.
export async function getSettingsData() {
  // Real version later: return apiFetch("/api/settings");
  await delay();
  return {
    ..._settingsDB,
    branchTables: BRANCHES_DB.map(({ id, name, tableCount }) => ({ id, name, tableCount })),
  };
}

export async function updateAnalyticsSettings(data) {
  // Real version later:
  // return apiFetch("/api/settings/analytics", { method: "PUT", body: JSON.stringify(data) });
  await delay();
  _settingsDB = { ..._settingsDB, analytics: { ..._settingsDB.analytics, ...data } };
  return _settingsDB.analytics;
}

export async function updateReceiptSettings(data) {
  // Real version later:
  // return apiFetch("/api/settings/receipt", { method: "PUT", body: JSON.stringify(data) });
  await delay();
  _settingsDB = { ..._settingsDB, receipt: { ..._settingsDB.receipt, ...data } };
  return _settingsDB.receipt;
}

export async function updateInventoryAlertSettings(data) {
  // Real version later:
  // return apiFetch("/api/settings/inventory-alerts", { method: "PUT", body: JSON.stringify(data) });
  await delay();
  _settingsDB = { ..._settingsDB, inventoryAlerts: { ..._settingsDB.inventoryAlerts, ...data } };
  return _settingsDB.inventoryAlerts;
}