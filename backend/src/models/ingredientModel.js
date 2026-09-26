const pool = require('../config/db');

async function getAllIngredients() {
  const { rows } = await pool.query('SELECT * FROM ingredients ORDER BY ingredient_name ASC');
  return rows;
}

async function getIngredientById(id) {
  const { rows } = await pool.query('SELECT * FROM ingredients WHERE ingredient_id = $1', [id]);
  return rows[0];
}

async function createIngredient({ ingredient_name, unit, unit_cost, supplier_name }) {
  const { rows } = await pool.query(
    `INSERT INTO ingredients (ingredient_name, unit, unit_cost, supplier_name)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [ingredient_name, unit, unit_cost, supplier_name]
  );
  return rows[0];
}

async function updateIngredient(id, { ingredient_name, unit, unit_cost, supplier_name }) {
  const { rows } = await pool.query(
    `UPDATE ingredients
      SET ingredient_name = COALESCE($1, ingredient_name),
          unit = COALESCE($2, unit),
          unit_cost = COALESCE($3, unit_cost),
          supplier_name = COALESCE($4, supplier_name),
          updated_at = NOW()
     WHERE ingredient_id = $5 RETURNING *`,
    [ingredient_name, unit, unit_cost, supplier_name, id]
  );
  return rows[0];
}

async function isIngredientInUse(id) {
  const { rows } = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM bill_of_materials WHERE ingredient_id = $1) AS bom_count,
        (SELECT COUNT(*) FROM inventory WHERE ingredient_id = $1) AS inventory_count`,
    [id]
  );
  return Number(rows[0].bom_count) > 0 || Number(rows[0].inventory_count) > 0;
}

async function deleteIngredient(id) {
  const { rows } = await pool.query('DELETE FROM ingredients WHERE ingredient_id = $1 RETURNING *', [id]);
  return rows[0];
}

module.exports = {
  getAllIngredients, getIngredientById, createIngredient,
  updateIngredient, isIngredientInUse, deleteIngredient,
};