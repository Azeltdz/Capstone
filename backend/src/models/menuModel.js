const pool = require('../config/db');

async function getAllMenuItems() {
  const { rows } = await pool.query('SELECT * FROM menu_items ORDER BY category, item_name ASC');
  return rows;
}

async function getMenuItemById(id) {
  const { rows } = await pool.query('SELECT * FROM menu_items WHERE item_id = $1', [id]);
  return rows[0];
}

async function createMenuItem({ item_name, category, selling_price, image_url }) {
  const { rows } = await pool.query(
    `INSERT INTO menu_items (item_name, category, selling_price, image_url, is_available)
     VALUES ($1, $2, $3, $4, true) RETURNING *`,
    [item_name, category, selling_price, image_url]
  );
  return rows[0];
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
  getAllMenuItems, getMenuItemById, createMenuItem,
  updateMenuItem, isMenuItemInUse, deleteMenuItem,
};