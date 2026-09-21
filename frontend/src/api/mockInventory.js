// src/api/mockInventory.js
//
// TEMPORARY mock functions for the Owner > Inventory page. Same idea as
// mockCashier.js: swapping to PostgreSQL later means changing the BODY of
// each function only. InventoryView.jsx stays the same.
//
// Real versions later:
//   getInventory          -> GET    /api/inventory?branch=&status=&search=
//   createInventoryItem   -> POST   /api/inventory
//   updateInventoryItem   -> PUT    /api/inventory/:id
//   deleteInventoryItem   -> DELETE /api/inventory/:id
//   BRANCHES              -> GET    /api/branches
//
// Changes live in memory only, so they reset when the page is refreshed.

export const BRANCHES = [
  { id: "poblacion", name: "Poblacion" },
  { id: "san-roque", name: "San Roque" },
];

// Sample data. Replace with your own existing inventory items if you like
// (keep the same fields).
let INVENTORY = [
  { id: "inv-1", branchId: "poblacion", name: "Egg Noodles", unit: "kg", onHand: 4, reorder: 10, updated: "Mar 6, 8:00 AM" },
  { id: "inv-2", branchId: "poblacion", name: "Pork Belly", unit: "kg", onHand: 18, reorder: 8, updated: "Mar 6, 8:00 AM" },
  { id: "inv-3", branchId: "poblacion", name: "Rice", unit: "kg", onHand: 45, reorder: 20, updated: "Mar 5, 4:30 PM" },
  { id: "inv-4", branchId: "poblacion", name: "Cooking Oil", unit: "L", onHand: 12, reorder: 6, updated: "Mar 5, 4:30 PM" },
  { id: "inv-5", branchId: "poblacion", name: "Eggs", unit: "pcs", onHand: 90, reorder: 60, updated: "Mar 6, 8:00 AM" },
  { id: "inv-6", branchId: "poblacion", name: "Cabbage", unit: "kg", onHand: 9, reorder: 5, updated: "Mar 6, 8:00 AM" },
  { id: "inv-7", branchId: "san-roque", name: "Egg Noodles", unit: "kg", onHand: 15, reorder: 10, updated: "Mar 5, 5:10 PM" },
  { id: "inv-8", branchId: "san-roque", name: "Pork Belly", unit: "kg", onHand: 5, reorder: 8, updated: "Mar 6, 7:45 AM" },
  { id: "inv-9", branchId: "san-roque", name: "Rice", unit: "kg", onHand: 30, reorder: 20, updated: "Mar 5, 5:10 PM" },
  { id: "inv-10", branchId: "san-roque", name: "Garlic", unit: "kg", onHand: 6, reorder: 3, updated: "Mar 6, 7:45 AM" },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function nowLabel() {
  return new Date().toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// Status is always derived from stock, never stored.
// (In Postgres: compute it in the query, e.g. CASE WHEN on_hand <= reorder_level.)
function withDerived(item) {
  const branch = BRANCHES.find((b) => b.id === item.branchId);
  return {
    ...item,
    branchName: branch ? branch.name : item.branchId,
    status: item.onHand <= item.reorder ? "Low" : "Good",
  };
}

function validate({ branchId, name, unit, onHand, reorder }, ignoreId = null) {
  const cleanName = String(name || "").trim();
  const cleanUnit = String(unit || "").trim();
  const stock = Number(onHand);
  const level = Number(reorder);

  if (!BRANCHES.some((b) => b.id === branchId)) throw new Error("Please choose a branch.");
  if (!cleanName) throw new Error("Ingredient name is required.");
  if (!cleanUnit) throw new Error("Unit is required (e.g. kg, L, pcs).");
  if (onHand === "" || !Number.isFinite(stock) || stock < 0) throw new Error("On hand must be 0 or more.");
  if (reorder === "" || !Number.isFinite(level) || level < 0) throw new Error("Reorder level must be 0 or more.");

  const duplicate = INVENTORY.some(
    (i) => i.id !== ignoreId && i.branchId === branchId && i.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (duplicate) throw new Error(`"${cleanName}" already exists in this branch.`);

  return { branchId, name: cleanName, unit: cleanUnit, onHand: stock, reorder: level };
}

// branch: "all" | branch id.  status: "all" | "Good" | "Low".  search: ingredient name.
// Also returns lowStock (for the alert banner) that only depends on the branch,
// so the banner doesn't disappear when the table is filtered.
export async function getInventory({ branch = "all", status = "all", search = "" } = {}) {
  await delay(200);
  const term = search.trim().toLowerCase();

  const inBranch = INVENTORY.filter((i) => branch === "all" || i.branchId === branch).map(withDerived);
  const items = inBranch.filter(
    (i) => (status === "all" || i.status === status) && (term === "" || i.name.toLowerCase().includes(term))
  );
  const lowStock = inBranch.filter((i) => i.status === "Low");
  return { items, lowStock };
}

export async function createInventoryItem(input) {
  await delay(150);
  const data = validate(input);
  const item = { id: `inv-${Date.now()}`, ...data, updated: nowLabel() };
  INVENTORY = [...INVENTORY, item];
  return withDerived(item);
}

export async function updateInventoryItem(id, input) {
  await delay(150);
  if (!INVENTORY.some((i) => i.id === id)) throw new Error("Item not found.");
  const data = validate(input, id);
  const updated = { id, ...data, updated: nowLabel() };
  INVENTORY = INVENTORY.map((i) => (i.id === id ? updated : i));
  return withDerived(updated);
}

export async function deleteInventoryItem(id) {
  await delay(150);
  if (!INVENTORY.some((i) => i.id === id)) throw new Error("Item not found.");
  INVENTORY = INVENTORY.filter((i) => i.id !== id);
  return { id };
}