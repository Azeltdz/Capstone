const pool = require('../config/db');

async function getAllMenuItems() {
  const { rows } = await pool.query('SELECT * FROM menu_items ORDER BY category, item_name ASC');
  return rows;
}

async function getMenuItemById(id) {
  const { rows } = await pool.query('SELECT * FROM menu_items WHERE item_id = $1', [id]);
  return rows[0];
}

async function createMenuItem({ item_name, category, selling_price, image_url, is_available = true }) {
  const { rows } = await pool.query(
    `INSERT INTO menu_items (item_name, category, selling_price, image_url, is_available)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [item_name, category, selling_price, image_url, is_available]
  );
  return rows[0];
}

async function findDuplicate(name, category, excludeId = null) {
  const { rows } = await pool.query(
    `SELECT item_id FROM menu_items
      WHERE LOWER(item_name) = LOWER($1) AND COALESCE(LOWER(category), '') = COALESCE(LOWER($2), '')
        AND ($3::int IS NULL OR item_id <> $3)
      LIMIT 1`,
    [name, category, excludeId]
  );
  return rows[0];
}

async function deleteMenuItemCascade(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM bill_of_materials WHERE item_id = $1', [id]);
    await client.query('DELETE FROM ai_forecasts WHERE item_id = $1', [id]);
    const { rows } = await client.query('DELETE FROM menu_items WHERE item_id = $1 RETURNING *', [id]);
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23503') {
      throw Object.assign(new Error('This item has sales history and cannot be deleted.'), { statusCode: 409 });
    }
    throw err;
  } finally {
    client.release();
  }
}

async function updateMenuItem(id, { item_name, category, selling_price, image_url, is_available }) {
  const { rows } = await pool.query(
    `UPDATE menu_items
      SET item_name = COALESCE($1, item_name),
          category = COALESCE($2, category),
          selling_price = COALESCE($3, selling_price),
          image_url = COALESCE($4, image_url),
          is_available = COALESCE($5, is_available)
     WHERE item_id = $6 RETURNING *`,
    [item_name, category, selling_price, image_url, is_available, id]
  );
  return rows[0];
}

async function isMenuItemInUse(id) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS count FROM transaction_items WHERE item_id = $1', [id]
  );
  return Number(rows[0].count) > 0;
}

async function deleteMenuItem(id) {
  const { rows } = await pool.query('DELETE FROM menu_items WHERE item_id = $1 RETURNING *', [id]);
  return rows[0];
}

module.exports = {
  getAllMenuItems, getMenuItemById, createMenuItem, updateMenuItem, 
  isMenuItemInUse, deleteMenuItem, findDuplicate, deleteMenuItemCascade
};