const pool = require('../config/db');

// Daily quantity sold per item, for the last N days (oldest first), 0-filled for gaps
async function getDailySalesByItem(branchId, itemId, days) {
  const { rows } = await pool.query(
    `SELECT DATE(t.transaction_at) AS sale_date, SUM(ti.quantity) AS total_qty
      FROM transactions t
      JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
      WHERE t.branch_id = $1 AND ti.item_id = $2
        AND t.transaction_at >= CURRENT_DATE - ($3 || ' days')::interval
      GROUP BY DATE(t.transaction_at)`,
    [branchId, itemId, days - 1]
  );

  const map = Object.fromEntries(rows.map((r) => [r.sale_date.toISOString().slice(0, 10), Number(r.total_qty)]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push(map[key] || 0);
  }
  return series; // oldest -> newest, length === days
}

async function getActiveMenuItemsForBranch(branchId) {
  const { rows } = await pool.query(
    `SELECT DISTINCT mi.item_id, mi.item_name
      FROM menu_items mi
      JOIN transaction_items ti ON ti.item_id = mi.item_id
      JOIN transactions t ON t.transaction_id = ti.transaction_id
      WHERE t.branch_id = $1 AND mi.is_available = true`,
    [branchId]
  );
  return rows;
}

async function getBOMForItem(itemId) {
  const { rows } = await pool.query(
    `SELECT b.ingredient_id, b.quantity_per_unit, ing.ingredient_name
      FROM bill_of_materials b
      JOIN ingredients ing ON ing.ingredient_id = b.ingredient_id
      WHERE b.item_id = $1`,
    [itemId]
  );
  return rows;
}

async function getInventoryForIngredient(branchId, ingredientId) {
  const { rows } = await pool.query(
    'SELECT quantity_on_hand FROM inventory WHERE branch_id = $1 AND ingredient_id = $2',
    [branchId, ingredientId]
  );
  return rows[0];
}

async function saveForecast({ branch_id, item_id, moving_avg_qty, trend_label, recommendation, reorder_qty }) {
  const { rows } = await pool.query(
    `INSERT INTO ai_forecasts (branch_id, item_id, computed_date, moving_avg_qty, trend_label, recommendation, reorder_qty, computed_at)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [branch_id, item_id, moving_avg_qty, trend_label, recommendation, reorder_qty]
  );
  return rows[0];
}

async function getLatestForecastsByBranch(branchId) {
  const { rows } = await pool.query(
    `SELECT f.*, mi.item_name
      FROM ai_forecasts f
      JOIN menu_items mi ON mi.item_id = f.item_id
      WHERE f.branch_id = $1 AND f.computed_date = CURRENT_DATE
      ORDER BY f.computed_at DESC`,
    [branchId]
  );
  return rows;
}

// Daily transaction count per branch, for branch anomaly detection
async function getDailyTransactionCounts(branchId, days) {
  const { rows } = await pool.query(
    `SELECT DATE(transaction_at) AS tx_date, COUNT(*) AS tx_count
      FROM transactions
      WHERE branch_id = $1 AND transaction_at >= CURRENT_DATE - ($2 || ' days')::interval
      GROUP BY DATE(transaction_at)`,
    [branchId, days - 1]
  );
  const map = Object.fromEntries(rows.map((r) => [r.tx_date.toISOString().slice(0, 10), Number(r.tx_count)]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    series.push(map[d.toISOString().slice(0, 10)] || 0);
  }
  return series;
}

// Food costing: cost per serving + margin, from BOM + current ingredient prices
async function getFoodCostingData() {
  const { rows } = await pool.query(
    `SELECT mi.item_id, mi.item_name, mi.selling_price,
            COALESCE(SUM(b.quantity_per_unit * ing.unit_cost), 0) AS cost_per_serving
      FROM menu_items mi
      LEFT JOIN bill_of_materials b ON b.item_id = mi.item_id
      LEFT JOIN ingredients ing ON ing.ingredient_id = b.ingredient_id
      WHERE mi.is_available = true
      GROUP BY mi.item_id, mi.item_name, mi.selling_price`
  );
  return rows.map((r) => {
    const cost = Number(r.cost_per_serving);
    const price = Number(r.selling_price);
    const margin = price - cost;
    return {
      item_id: r.item_id,
      item_name: r.item_name,
      selling_price: price,
      cost_per_serving: cost,
      gross_margin: margin,
      margin_percent: price > 0 ? Number(((margin / price) * 100).toFixed(2)) : 0,
    };
  });
}

// Owner dashboard KPIs
async function getDashboardKPIs() {
  const { rows: totals } = await pool.query(
    `SELECT COUNT(*) AS transaction_count, COALESCE(SUM(total_amount), 0) AS total_sales
      FROM transactions WHERE DATE(transaction_at) = CURRENT_DATE`
  );
  const { rows: byBranch } = await pool.query(
    `SELECT b.branch_id, b.branch_name, COALESCE(SUM(t.total_amount), 0) AS sales_today
      FROM branches b
      LEFT JOIN transactions t ON t.branch_id = b.branch_id AND DATE(t.transaction_at) = CURRENT_DATE
      GROUP BY b.branch_id, b.branch_name`
  );
  const { rows: topItems } = await pool.query(
    `SELECT mi.item_name, SUM(ti.quantity) AS total_sold
      FROM transaction_items ti
      JOIN menu_items mi ON mi.item_id = ti.item_id
      JOIN transactions t ON t.transaction_id = ti.transaction_id
      WHERE DATE(t.transaction_at) = CURRENT_DATE
      GROUP BY mi.item_name ORDER BY total_sold DESC LIMIT 5`
  );
  return { ...totals[0], byBranch, topItems };
}

module.exports = {
  getDailySalesByItem, getActiveMenuItemsForBranch, getBOMForItem, getInventoryForIngredient,
  saveForecast, getLatestForecastsByBranch, getDailyTransactionCounts, getFoodCostingData, getDashboardKPIs,
};