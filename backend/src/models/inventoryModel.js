const pool = require('../config/db');

async function getInventoryByBranch(branchId) {
  const { rows } = await pool.query(
    `SELECT inv.*, ing.ingredient_name, ing.unit, ing.unit_cost
      FROM inventory inv
      JOIN ingredients ing ON ing.ingredient_id = inv.ingredient_id
      WHERE inv.branch_id = $1
      ORDER BY ing.ingredient_name ASC`,
    [branchId]
  );
  return rows;
}

async function getInventoryById(id) {
  const { rows } = await pool.query(
    `SELECT inv.*, ing.ingredient_name, ing.unit, ing.unit_cost
      FROM inventory inv
      JOIN ingredients ing ON ing.ingredient_id = inv.ingredient_id
      WHERE inv.inventory_id = $1`,
    [id]
  );
  return rows[0];
}

async function findInventoryEntry(branchId, ingredientId) {
  const { rows } = await pool.query(
    'SELECT * FROM inventory WHERE branch_id = $1 AND ingredient_id = $2',
    [branchId, ingredientId]
  );
  return rows[0];
}

async function createInventoryEntry({ branch_id, ingredient_id, quantity_on_hand, reorder_threshold }) {
  const { rows } = await pool.query(
    `INSERT INTO inventory (branch_id, ingredient_id, quantity_on_hand, reorder_threshold)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [branch_id, ingredient_id, quantity_on_hand ?? 0, reorder_threshold]
  );
  return rows[0];
}

async function updateInventoryEntry(id, { quantity_on_hand, reorder_threshold }) {
  const { rows } = await pool.query(
    `UPDATE inventory
      SET quantity_on_hand = COALESCE($1, quantity_on_hand),
          reorder_threshold = COALESCE($2, reorder_threshold),
          last_updated = NOW()
     WHERE inventory_id = $3 RETURNING *`,
    [quantity_on_hand, reorder_threshold, id]
  );
  return rows[0];
}

async function adjustInventoryQuantity(id, delta) {
  const { rows } = await pool.query(
    `UPDATE inventory
      SET quantity_on_hand = quantity_on_hand + $1,
          last_updated = NOW()
     WHERE inventory_id = $2 RETURNING *`,
    [delta, id]
  );
  return rows[0];
}

async function getLowStockByBranch(branchId) {
  const { rows } = await pool.query(
    `SELECT inv.*, ing.ingredient_name, ing.unit
      FROM inventory inv
      JOIN ingredients ing ON ing.ingredient_id = inv.ingredient_id
      WHERE inv.branch_id = $1 AND inv.quantity_on_hand <= inv.reorder_threshold
      ORDER BY (inv.quantity_on_hand - inv.reorder_threshold) ASC`,
    [branchId]
  );
  return rows;
}

async function getLowStockAll() {
  const { rows } = await pool.query(
    `SELECT inv.*, ing.ingredient_name, ing.unit, b.branch_name
      FROM inventory inv
      JOIN ingredients ing ON ing.ingredient_id = inv.ingredient_id
      JOIN branches b ON b.branch_id = inv.branch_id
      WHERE inv.quantity_on_hand <= inv.reorder_threshold
      ORDER BY b.branch_name, (inv.quantity_on_hand - inv.reorder_threshold) ASC`
  );
  return rows;
}

async function deleteInventoryEntry(id) {
  const { rows } = await pool.query('DELETE FROM inventory WHERE inventory_id = $1 RETURNING *', [id]);
  return rows[0];
}

module.exports = {
  getInventoryByBranch, getInventoryById, findInventoryEntry, createInventoryEntry,
  updateInventoryEntry, adjustInventoryQuantity, getLowStockByBranch, getLowStockAll,
  deleteInventoryEntry,
};