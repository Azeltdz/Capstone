const pool = require('../config/db');
const TZ = "Asia/Manila";

// Completed days only (yesterday back N days), Manila time, all active branches.
async function getDailyItemSales(windowDays) {
  const { rows } = await pool.query(
    `SELECT t.branch_id, ti.item_id,
            to_char((t.transaction_at AT TIME ZONE '${TZ}')::date, 'YYYY-MM-DD') AS sale_date,
            SUM(ti.quantity) AS qty
      FROM transactions t
      JOIN transaction_items ti ON ti.transaction_id = t.transaction_id
      JOIN branches b ON b.branch_id = t.branch_id AND b.is_active = true
      WHERE t.status = 'paid'
        AND (t.transaction_at AT TIME ZONE '${TZ}')::date >= (NOW() AT TIME ZONE '${TZ}')::date - $1::int
        AND (t.transaction_at AT TIME ZONE '${TZ}')::date <  (NOW() AT TIME ZONE '${TZ}')::date
      GROUP BY 1, 2, 3`,
    [windowDays]
  );
  return rows.map((r) => ({ ...r, qty: Number(r.qty) }));
}

// Earliest day each branch recorded a sale (used for the "fewer than N days" rule).
async function getFirstSaleDays() {
  const { rows } = await pool.query(
    `SELECT branch_id,
            to_char(MIN((transaction_at AT TIME ZONE '${TZ}')::date), 'YYYY-MM-DD') AS first_day
      FROM transactions WHERE status = 'paid' GROUP BY branch_id`
  );
  return new Map(rows.map((r) => [r.branch_id, r.first_day]));
}

async function getActiveItems() {
  const { rows } = await pool.query(
    'SELECT item_id, item_name, category FROM menu_items WHERE is_available = true'
  );
  return rows;
}

async function getBomRows() {
  const { rows } = await pool.query(
    'SELECT item_id, ingredient_id, quantity_per_unit FROM bill_of_materials'
  );
  return rows;
}

async function getStockRows(branchId) {
  const { rows } = await pool.query(
    `SELECT inv.branch_id, inv.ingredient_id, ing.ingredient_name, ing.unit, inv.quantity_on_hand
      FROM inventory inv
      JOIN ingredients ing ON ing.ingredient_id = inv.ingredient_id
      JOIN branches b ON b.branch_id = inv.branch_id AND b.is_active = true
      WHERE ($1::int IS NULL OR inv.branch_id = $1)`,
    [branchId]
  );
  return rows;
}

// One row per branch/item/day: repeat visits update it instead of adding more.
async function upsertForecast({ branch_id, item_id, forecast_date, moving_avg_qty, trend_label, recommendation, reorder_qty }) {
  await pool.query(
    `INSERT INTO ai_forecasts
        (branch_id, item_id, computed_date, moving_avg_qty, trend_label, recommendation, reorder_qty, computed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (branch_id, item_id, computed_date)
      DO UPDATE SET moving_avg_qty = EXCLUDED.moving_avg_qty, trend_label = EXCLUDED.trend_label,
                    recommendation = EXCLUDED.recommendation, reorder_qty = EXCLUDED.reorder_qty,
                    computed_at = NOW()`,
    [branch_id, item_id, forecast_date, moving_avg_qty, trend_label, recommendation, reorder_qty]
  );
}

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
  getDailyItemSales, getFirstSaleDays, getActiveItems, getBomRows, getStockRows, upsertForecast,
  getBranchDashboardStats, getBranchPaceStats, getTopItemsToday, getLowStockActiveBranches,
  getLatestForecasts, getDashboardData,
  getFoodCostingData,
};