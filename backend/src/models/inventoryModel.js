const pool = require('../config/db');
const { convert } = require('../constants/units');
const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const round3 = (n) => Math.round(n * 1000) / 1000;

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

async function getAllInventory() {
  const { rows } = await pool.query(
    `SELECT inv.*, ing.ingredient_name, ing.unit, ing.unit_cost, b.branch_name
      FROM inventory inv
      JOIN ingredients ing ON ing.ingredient_id = inv.ingredient_id
      JOIN branches b ON b.branch_id = inv.branch_id
      ORDER BY b.branch_name, ing.ingredient_name ASC`
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

async function createInventoryEntry({ branch_id, ingredient_id, quantity_on_hand, reorder_threshold, performed_by }) {
  return pool.withTransaction(async (client) => {
    const { rows: [entry] } = await client.query(
      `INSERT INTO inventory (branch_id, ingredient_id, quantity_on_hand, reorder_threshold)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [branch_id, ingredient_id, quantity_on_hand ?? 0, reorder_threshold]
    );
    await client.query(
      `INSERT INTO inventory_movements (inventory_id, movement_type, quantity_delta, quantity_after, reason, performed_by)
        VALUES ($1, 'opening', $2, $2, 'Stock record created', $3)`,
      [entry.inventory_id, entry.quantity_on_hand, performed_by]
    );
    return entry;
  });
}

async function updateInventoryEntry(id, { reorder_threshold }) {
  const { rows } = await pool.query(
    `UPDATE inventory SET reorder_threshold = $1, last_updated = NOW() WHERE inventory_id = $2 RETURNING *`,
    [reorder_threshold, id]
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
      WHERE inv.quantity_on_hand <= inv.reorder_threshold AND b.is_active = true
      ORDER BY b.branch_name, (inv.quantity_on_hand - inv.reorder_threshold) ASC`
  );
  return rows;
}

async function recordMovement({ inventory_id, type, quantity, unit, reason, performed_by }) {
  return pool.withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT inv.inventory_id, inv.quantity_on_hand, ing.ingredient_name, ing.unit
        FROM inventory inv JOIN ingredients ing ON ing.ingredient_id = inv.ingredient_id
        WHERE inv.inventory_id = $1 FOR UPDATE OF inv`,
      [inventory_id]
    );
    if (!rows.length) throw httpError(404, 'Inventory record not found');
    const row = rows[0];
    const onHand = Number(row.quantity_on_hand);

    const qty = convert(quantity, unit || row.unit, row.unit); // throws 400 for incompatible units
    if (type !== 'adjustment' && qty <= 0) throw httpError(400, 'Quantity must be greater than zero.');

    const after = round3(type === 'restock' ? onHand + qty : type === 'spoilage' ? onHand - qty : qty);
    if (after < 0) throw httpError(400, `Only ${onHand} ${row.unit} on hand, so ${qty} ${row.unit} can't be removed.`);

    await client.query('UPDATE inventory SET quantity_on_hand = $2, last_updated = NOW() WHERE inventory_id = $1', [
      inventory_id, after,
    ]);
    const { rows: [movement] } = await client.query(
      `INSERT INTO inventory_movements
          (inventory_id, movement_type, quantity_delta, quantity_after, reason, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [inventory_id, type, round3(after - onHand), after, reason || null, performed_by]
    );
    return { movement, ingredient_name: row.ingredient_name, unit: row.unit, quantity_on_hand: after };
  });
}


async function listMovements(inventory_id, limit, offset) {
  const { rows } = await pool.query(
    `SELECT m.movement_id, m.movement_type, m.quantity_delta, m.quantity_after, m.reason,
            m.reference_type, m.reference_id, m.created_at, u.full_name AS performed_by_name,
            COUNT(*) OVER() AS total
      FROM inventory_movements m LEFT JOIN users u ON u.user_id = m.performed_by
      WHERE m.inventory_id = $1
      ORDER BY m.created_at DESC, m.movement_id DESC
      LIMIT $2 OFFSET $3`,
    [inventory_id, limit, offset]
  );
  return {
    total: rows[0] ? Number(rows[0].total) : 0,
    rows: rows.map(({ total, ...r }) => ({
      ...r, quantity_delta: Number(r.quantity_delta), quantity_after: Number(r.quantity_after),
    })),
  };
}

async function deleteInventoryEntry(id) {
  return pool.withTransaction(async (client) => {
    const { rows: used } = await client.query(
      `SELECT 1 FROM inventory_movements WHERE inventory_id = $1 AND movement_type <> 'opening' LIMIT 1`, [id]
    );
    if (used.length) {
      throw httpError(409, "This stock record has history (sales or stock changes), so it can't be deleted. Set the count to 0 instead.");
    }
    await client.query('DELETE FROM inventory_movements WHERE inventory_id = $1', [id]);
    const { rows } = await client.query('DELETE FROM inventory WHERE inventory_id = $1 RETURNING *', [id]);
    return rows[0];
  });
}

module.exports = {
  getInventoryByBranch, getAllInventory, getInventoryById, findInventoryEntry, createInventoryEntry,
  updateInventoryEntry, getLowStockByBranch, getLowStockAll, recordMovement, listMovements, deleteInventoryEntry
};