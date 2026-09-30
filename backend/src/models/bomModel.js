const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const pool = require('../config/db');

async function getBOMByItem(itemId) {
  const { rows } = await pool.query(
    `SELECT b.*, i.ingredient_name, i.unit AS ingredient_unit, i.unit_cost
      FROM bill_of_materials b
      JOIN ingredients i ON i.ingredient_id = b.ingredient_id
      WHERE b.item_id = $1`,
    [itemId]
  );
  return rows;
}

async function getBOMEntryById(id) {
  const { rows } = await pool.query('SELECT * FROM bill_of_materials WHERE bom_id = $1', [id]);
  return rows[0];
}

async function findBOMEntry(itemId, ingredientId) {
  const { rows } = await pool.query(
    'SELECT * FROM bill_of_materials WHERE item_id = $1 AND ingredient_id = $2',
    [itemId, ingredientId]
  );
  return rows[0];
}

async function addBOMEntry({ item_id, ingredient_id, quantity_per_unit, unit, notes }) {
  const { rows } = await pool.query(
    `INSERT INTO bill_of_materials (item_id, ingredient_id, quantity_per_unit, unit, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [item_id, ingredient_id, quantity_per_unit, unit, notes]
  );
  return rows[0];
}

async function updateBOMEntry(id, { quantity_per_unit, unit, notes }) {
  const { rows } = await pool.query(
    `UPDATE bill_of_materials
      SET quantity_per_unit = COALESCE($1, quantity_per_unit),
          unit = COALESCE($2, unit),
          notes = COALESCE($3, notes)
     WHERE bom_id = $4 RETURNING *`,
    [quantity_per_unit, unit, notes, id]
  );
  return rows[0];
}

async function deleteBOMEntry(id) {
  const { rows } = await pool.query('DELETE FROM bill_of_materials WHERE bom_id = $1 RETURNING *', [id]);
  return rows[0];
}

async function replaceRecipe(itemId, lines, sellingPrice) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: found } = await client.query(
      'SELECT item_id FROM menu_items WHERE item_id = $1 FOR UPDATE', [itemId]
    );
    if (!found.length) throw httpError(404, 'Menu item not found');

    const ids = lines.map((l) => l.ingredient_id);
    const units = new Map();
    if (ids.length) {
      const { rows } = await client.query(
        'SELECT ingredient_id, unit FROM ingredients WHERE ingredient_id = ANY($1::int[])', [ids]
      );
      if (rows.length !== ids.length) throw httpError(400, 'One or more ingredients no longer exist.');
      rows.forEach((r) => units.set(r.ingredient_id, r.unit));
    }

    await client.query('DELETE FROM bill_of_materials WHERE item_id = $1', [itemId]);
    for (const l of lines) {
      await client.query(
        `INSERT INTO bill_of_materials (item_id, ingredient_id, quantity_per_unit, unit)
          VALUES ($1, $2, $3, $4)`,
        [itemId, l.ingredient_id, l.quantity_per_unit, units.get(l.ingredient_id)]
      );
    }

    if (sellingPrice !== undefined) {
      await client.query('UPDATE menu_items SET selling_price = $1 WHERE item_id = $2', [sellingPrice, itemId]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getBOMByItem, getBOMEntryById, findBOMEntry, addBOMEntry, updateBOMEntry, deleteBOMEntry, replaceRecipe };