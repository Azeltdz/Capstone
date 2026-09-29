const {
  getDailyItemSales, getFirstSaleDays, getActiveItems, getBomRows, getStockRows, upsertForecast,
} = require('../models/analyticsModel');
const { getAllBranches } = require('../models/branchModel');
const { getAllSystemSettings } = require('../models/settingsModel');
const { DEFAULT_SETTINGS } = require('../constants/settingsDefaults');
const { classifyTrend, trendMessage, computeBranchProcurement } = require('../utils/forecastEngine');

const TZ = 'Asia/Manila';

const manilaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });

function shiftDate(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateRange(start, end) {
  const out = [];
  for (let d = start; d <= end; d = shiftDate(d, 1)) out.push(d);
  return out;
}

async function getActiveSettings() {
  const rows = await getAllSystemSettings();
  const stored = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  const s = { ...DEFAULT_SETTINGS, ...stored };
  return {
    windowDays: Number(s.moving_average_window),
    trendThreshold: Number(s.trend_threshold),
    anomalyThreshold: Number(s.anomaly_threshold),
    leadTimeDays: Number(s.lead_time_days),
    safetyStockDays: Number(s.safety_stock_days),
  };
}

async function loadDemand(windowDays) {
  const [sales, firstDays, items, branches] = await Promise.all([
    getDailyItemSales(windowDays), getFirstSaleDays(), getActiveItems(), getAllBranches(),
  ]);
  return { sales, firstDays, items, branches: branches.filter((b) => b.is_active), today: manilaToday() };
}

// branchId = one branch, or null for all active branches combined.
function buildScopeTrends({ demand, branchId, windowDays, trendThreshold }) {
  const { sales, firstDays, items, branches, today } = demand;
  const ids = branchId ? [branchId] : branches.map((b) => b.branch_id);
  const idSet = new Set(ids);

  // Complete days only, and never earlier than the scope's first sale.
  const first = ids.map((id) => firstDays.get(id)).filter(Boolean).sort()[0];
  const windowStart = shiftDate(today, -windowDays);
  const start = first && first > windowStart ? first : windowStart;
  const days = first ? dateRange(start, shiftDate(today, -1)) : [];

  const byItem = new Map();
  for (const row of sales) {
    if (!idSet.has(row.branch_id)) continue;
    const perDay = byItem.get(row.item_id) ?? new Map();
    perDay.set(row.sale_date, (perDay.get(row.sale_date) ?? 0) + row.qty);
    byItem.set(row.item_id, perDay);
  }

  const rows = [];
  for (const item of items) {
    const perDay = byItem.get(item.item_id);
    if (!perDay) continue; // no sales in the window
    const series = days.map((date) => ({ date, quantity: perDay.get(date) ?? 0 }));
    const stats = classifyTrend(series.map((s) => s.quantity), trendThreshold);
    rows.push({
      item_id: item.item_id, item_name: item.item_name, category: item.category,
      series, ...stats, recommendation: trendMessage(stats),
    });
  }
  rows.sort((a, b) => b.moving_average - a.moving_average);
  rows.forEach((r, i) => { r.rank = i + 1; });

  return { days, items: rows };
}

async function getTrends(branchId) {
  const settings = await getActiveSettings();
  const demand = await loadDemand(settings.windowDays);
  const { days, items } = buildScopeTrends({ demand, branchId, ...settings });
  return {
    scope: {
      branch_id: branchId ?? null,
      window_days: settings.windowDays,
      trend_threshold: settings.trendThreshold,
      days_of_data: days.length,
      period_start: days[0] ?? null,
      period_end: days[days.length - 1] ?? null,
    },
    items,
  };
}

function procurementForBranch({ branch, demand, bomRows, stockRows, settings }) {
  const { items } = buildScopeTrends({ demand, branchId: branch.branch_id, ...settings });
  const itemAverages = new Map(items.map((i) => [i.item_id, i.moving_average]));
  const stockByIngredient = new Map(
    stockRows.filter((r) => r.branch_id === branch.branch_id).map((r) => [r.ingredient_id, r])
  );
  const rows = computeBranchProcurement({
    itemAverages, bomRows, stockByIngredient,
    leadTimeDays: settings.leadTimeDays, safetyStockDays: settings.safetyStockDays,
  });
  return { items, rows };
}

async function getProcurement(branchId) {
  const settings = await getActiveSettings();
  const demand = await loadDemand(settings.windowDays);
  const [bomRows, stockRows] = await Promise.all([getBomRows(), getStockRows(branchId)]);
  const nameById = new Map(demand.items.map((i) => [i.item_id, i.item_name]));

  const list = [];
  for (const branch of demand.branches.filter((b) => !branchId || b.branch_id === branchId)) {
    const { rows } = procurementForBranch({ branch, demand, bomRows, stockRows, settings });
    for (const r of rows) {
      list.push({
        branch_id: branch.branch_id, branch_name: branch.branch_name,
        ingredient_id: r.ingredient_id, ingredient_name: r.ingredient_name, unit: r.unit,
        on_hand: r.on_hand, daily_demand: r.daily_demand, reorder_qty: r.reorder_qty,
        days_of_cover: r.days_of_cover, urgent: r.urgent,
        used_by: r.contributors.slice(0, 3).map((c) => nameById.get(c.item_id)).filter(Boolean),
      });
    }
  }
  list.sort(
    (a, b) => Number(b.urgent) - Number(a.urgent) || (a.days_of_cover ?? Infinity) - (b.days_of_cover ?? Infinity)
  );

  return {
    lead_time_days: settings.leadTimeDays,
    safety_stock_days: settings.safetyStockDays,
    horizon_days: settings.leadTimeDays + settings.safetyStockDays,
    items: list,
  };
}

// Saves today's snapshot for every active branch. Safe to call repeatedly.
async function refreshForecasts() {
  const settings = await getActiveSettings();
  const demand = await loadDemand(settings.windowDays);
  const [bomRows, stockRows] = await Promise.all([getBomRows(), getStockRows(null)]);
  let saved = 0;

  for (const branch of demand.branches) {
    const { items, rows } = procurementForBranch({ branch, demand, bomRows, stockRows, settings });

    const reorderByItem = new Map();
    for (const r of rows) {
      const top = r.contributors[0];
      const current = reorderByItem.get(top.item_id);
      if (!current || r.reorder_qty > current.reorder_qty) reorderByItem.set(top.item_id, r);
    }

    for (const item of items) {
      if (item.trend === 'insufficient_data') continue;
      const reorder = reorderByItem.get(item.item_id);
      const recommendation = reorder
        ? `Reorder about ${reorder.reorder_qty} ${reorder.unit} of ${reorder.ingredient_name} to cover the next ${reorder.horizon_days} days. ${item.item_name}: ${item.recommendation}`
        : `${item.item_name}: ${item.recommendation}`;

      await upsertForecast({
        branch_id: branch.branch_id,
        item_id: item.item_id,
        forecast_date: demand.today,
        moving_avg_qty: item.moving_average,
        trend_label: item.trend,
        recommendation,
        reorder_qty: reorder?.reorder_qty ?? 0,
      });
      saved++;
    }
  }
  return { saved, forecast_date: demand.today };
}

module.exports = { getActiveSettings, getTrends, getProcurement, refreshForecasts };