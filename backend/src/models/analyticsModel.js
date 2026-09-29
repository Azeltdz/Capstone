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

const TZ = "Asia/Manila";
// Today vs. the same time yesterday, per active branch.
async function getBranchDashboardStats() {
  const { rows } = await pool.query(`
    SELECT b.branch_id, b.branch_name,
      COALESCE(SUM(t.total_amount) FILTER (WHERE t.local_ts >= n.today_start), 0) AS sales_today,
      COUNT(t.transaction_id) FILTER (WHERE t.local_ts >= n.today_start) AS tx_today,
      COALESCE(SUM(t.total_amount) FILTER (
        WHERE t.local_ts >= n.today_start - INTERVAL '1 day'
          AND t.local_ts <= n.now_ts - INTERVAL '1 day'
      ), 0) AS sales_yesterday,
      COUNT(t.transaction_id) FILTER (
        WHERE t.local_ts >= n.today_start - INTERVAL '1 day'
          AND t.local_ts <= n.now_ts - INTERVAL '1 day'
      ) AS tx_yesterday
    FROM branches b
    CROSS JOIN (
      SELECT date_trunc('day', NOW() AT TIME ZONE '${TZ}') AS today_start,
              NOW() AT TIME ZONE '${TZ}' AS now_ts
    ) n
    LEFT JOIN (
      SELECT branch_id, transaction_id, total_amount, transaction_at AT TIME ZONE '${TZ}' AS local_ts
      FROM transactions
      WHERE status = 'paid' AND transaction_at >= NOW() - INTERVAL '3 days'
    ) t ON t.branch_id = b.branch_id
    WHERE b.is_active = true
    GROUP BY b.branch_id, b.branch_name
    ORDER BY b.branch_name ASC
  `);

  // pg returns NUMERIC and COUNT as strings, so convert here once.
  return rows.map((r) => ({
    branch_id: r.branch_id,
    branch_name: r.branch_name,
    sales_today: Number(r.sales_today),
    transactions_today: Number(r.tx_today),
    sales_yesterday: Number(r.sales_yesterday),
    transactions_yesterday: Number(r.tx_yesterday),
  }));
}

// Orders so far today vs. the average count by this same time of day over the previous N days.
async function getBranchPaceStats(windowDays) {
  const { rows } = await pool.query(
    `
    SELECT b.branch_id,
      COUNT(t.transaction_id) FILTER (WHERE t.local_ts::date = n.now_ts::date) AS today_count,
      (COUNT(t.transaction_id) FILTER (WHERE t.local_ts::date < n.now_ts::date))::numeric / $1::int AS baseline_avg
    FROM branches b
    CROSS JOIN (SELECT NOW() AT TIME ZONE '${TZ}' AS now_ts) n
    LEFT JOIN (
      SELECT branch_id, transaction_id, transaction_at AT TIME ZONE '${TZ}' AS local_ts
      FROM transactions
      WHERE status = 'paid' AND transaction_at >= NOW() - (($1::int + 2) * INTERVAL '1 day')
    ) t ON t.branch_id = b.branch_id
        AND t.local_ts::date >= n.now_ts::date - $1::int
        AND t.local_ts::time <= n.now_ts::time
    WHERE b.is_active = true
    GROUP BY b.branch_id
    `,
    [windowDays]
  );
  return rows.map((r) => ({
    branch_id: r.branch_id,
    today_count: Number(r.today_count),
    baseline_avg: Number(r.baseline_avg),
  }));
}

// Per branch, so the page can aggregate or filter without another request.
async function getTopItemsToday() {
  const { rows } = await pool.query(`
    SELECT t.branch_id, ti.item_id, mi.item_name, SUM(ti.quantity) AS total_sold
    FROM transaction_items ti
    JOIN transactions t ON t.transaction_id = ti.transaction_id
    JOIN menu_items mi ON mi.item_id = ti.item_id
    WHERE t.status = 'paid'
      AND (t.transaction_at AT TIME ZONE '${TZ}')::date = (NOW() AT TIME ZONE '${TZ}')::date
    GROUP BY t.branch_id, ti.item_id, mi.item_name
  `);
  return rows.map((r) => ({ ...r, total_sold: Number(r.total_sold) }));
}

async function getLowStockActiveBranches() {
  const { rows } = await pool.query(`
    SELECT inv.branch_id, b.branch_name, ing.ingredient_name, ing.unit, inv.quantity_on_hand, inv.reorder_threshold
    FROM inventory inv
    JOIN ingredients ing ON ing.ingredient_id = inv.ingredient_id
    JOIN branches b ON b.branch_id = inv.branch_id
    WHERE b.is_active = true AND inv.quantity_on_hand <= inv.reorder_threshold
    ORDER BY (inv.quantity_on_hand - inv.reorder_threshold) ASC
  `);
  return rows.map((r) => ({
    ...r,
    quantity_on_hand: Number(r.quantity_on_hand),
    reorder_threshold: Number(r.reorder_threshold),
  }));
}

async function getLatestForecasts() {
  const { rows } = await pool.query(`
    SELECT DISTINCT ON (f.branch_id, f.item_id)
      f.branch_id, b.branch_name, f.item_id, mi.item_name,
      f.trend_label, f.recommendation, f.reorder_qty, f.computed_at
    FROM ai_forecasts f
    JOIN menu_items mi ON mi.item_id = f.item_id
    JOIN branches b ON b.branch_id = f.branch_id
    WHERE b.is_active = true
      AND f.computed_date >= (NOW() AT TIME ZONE '${TZ}')::date - 2
    ORDER BY f.branch_id, f.item_id, f.computed_date DESC, f.computed_at DESC
  `);
  return rows.map((r) => ({ ...r, reorder_qty: Number(r.reorder_qty) || 0 }));
}
async function getDashboardData(windowDays) {
  const [branches, pace, topItems, lowStock, forecasts] = await Promise.all([
    getBranchDashboardStats(),
    getBranchPaceStats(windowDays),
    getTopItemsToday(),
    getLowStockActiveBranches(),
    getLatestForecasts(),
  ]);
  return { branches, pace, topItems, lowStock, forecasts };
}

module.exports = {
  getDailySalesByItem, getActiveMenuItemsForBranch, getBOMForItem, getInventoryForIngredient, saveForecast, 
  getLatestForecastsByBranch, getDailyTransactionCounts, getFoodCostingData, getDashboardData, getBranchPaceStats,
};