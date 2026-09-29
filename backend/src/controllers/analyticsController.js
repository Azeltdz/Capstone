const {
  getDailySalesByItem, getActiveMenuItemsForBranch, getBOMForItem, getInventoryForIngredient,
  saveForecast, getLatestForecastsByBranch, getDailyTransactionCounts, getFoodCostingData, getDashboardData,
} = require('../models/analyticsModel');
const { classifyTrend, buildRecommendation } = require('../utils/forecastEngine');
const { evaluatePace } = require('../utils/anomaly');
const { getAllSystemSettings } = require('../models/settingsModel');
const { DEFAULT_SETTINGS } = require('../constants/settingsDefaults');
const { getBranchById } = require('../models/branchModel');

async function getActiveSettings() {
  const rows = await getAllSystemSettings();
  const stored = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  const merged = { ...DEFAULT_SETTINGS, ...stored };
  return {
    windowDays: Number(merged.moving_average_window),
    trendThreshold: Number(merged.trend_threshold),
    anomalyThreshold: Number(merged.anomaly_threshold),
  };
}

// GET /api/analytics/forecast/:branchId  (computes fresh AND saves to ai_forecasts)
async function computeForecast(req, res, next) {
  try {
    const { branchId } = req.params;
    const branch = await getBranchById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const { windowDays, trendThreshold } = await getActiveSettings();
    const items = await getActiveMenuItemsForBranch(branchId);

    const results = [];
    for (const item of items) {
      const series = await getDailySalesByItem(branchId, item.item_id, windowDays);
      const { movingAvg, trend_label } = classifyTrend(series, trendThreshold);

      const bomRows = await getBOMForItem(item.item_id);
      const inventoryLookup = {};
      for (const bom of bomRows) {
        inventoryLookup[bom.ingredient_id] = await getInventoryForIngredient(branchId, bom.ingredient_id);
      }

      const { recommendation, reorder_qty } = buildRecommendation({
        item_name: item.item_name, trend_label, movingAvg, bomRows, inventoryLookup,
      });

      const saved = await saveForecast({
        branch_id: branchId,
        item_id: item.item_id,
        moving_avg_qty: Number(movingAvg.toFixed(2)),
        trend_label,
        recommendation,
        reorder_qty,
      });

      results.push({ ...saved, item_name: item.item_name, daily_series: series });
    }

    res.json({ window_days: windowDays, trend_threshold: trendThreshold, forecasts: results });
  } catch (err) { next(err); }
}

// GET /api/analytics/forecast/:branchId/latest  (read today's already-saved forecasts, no recompute)
async function getLatestForecast(req, res, next) {
  try {
    res.json(await getLatestForecastsByBranch(req.params.branchId));
  } catch (err) { next(err); }
}

// GET /api/analytics/branch-anomalies
async function getBranchAnomalies(req, res, next) {
  try {
    const { anomalyThreshold, windowDays } = await getActiveSettings();
    const { getAllBranches } = require('../models/branchModel');
    const branches = await getAllBranches();

    const anomalies = [];
    for (const branch of branches) {
      const series = await getDailyTransactionCounts(branch.branch_id, windowDays);
      const movingAvg = series.reduce((a, b) => a + b, 0) / windowDays;
      const today = series[series.length - 1];

      if (movingAvg > 0) {
        const percentBelow = ((movingAvg - today) / movingAvg) * 100;
        if (percentBelow >= anomalyThreshold) {
          anomalies.push({
            branch_id: branch.branch_id,
            branch_name: branch.branch_name,
            today_transactions: today,
            moving_avg_transactions: Number(movingAvg.toFixed(2)),
            percent_below_average: Number(percentBelow.toFixed(1)),
          });
        }
      }
    }

    res.json({ anomaly_threshold: anomalyThreshold, anomalies });
  } catch (err) { next(err); }
}

// GET /api/analytics/food-costing
async function getFoodCosting(req, res, next) {
  try {
    const data = await getFoodCostingData();
    const lowestMargin = data.reduce((min, item) =>
      !min || item.margin_percent < min.margin_percent ? item : min, null);
    res.json({ items: data, lowest_margin_item: lowestMargin });
  } catch (err) { next(err); }
}

// GET /api/analytics/dashboard
async function getDashboard(req, res, next) {
  try {
    const { windowDays, anomalyThreshold } = await getActiveSettings();
    const raw = await getDashboardData(windowDays);
    const paceById = Object.fromEntries(raw.pace.map((p) => [p.branch_id, p]));

    const branches = raw.branches.map((b) => {
      const p = paceById[b.branch_id] ?? { today_count: 0, baseline_avg: 0 };
      const result = evaluatePace(p, anomalyThreshold);
      return {
        ...b,
        flagged: result.flagged,
        percent_below: result.percentBelow,
        baseline_avg: result.baseline,
        today_count: p.today_count,
      };
    });

    const recommendationsAsOf = raw.forecasts.reduce(
      (latest, f) => (!latest || f.computed_at > latest ? f.computed_at : latest),
      null
    );
    const recommendations = raw.forecasts
      .filter((f) => f.reorder_qty > 0 || f.trend_label === "decreasing")
      .sort((a, b) => b.reorder_qty - a.reorder_qty);

    res.json({
      generated_at: new Date().toISOString(),
      branches,
      top_items: raw.topItems,
      low_stock: raw.lowStock,
      recommendations,
      recommendations_as_of: recommendationsAsOf,
    });
  } catch (err) { next(err); }
}

module.exports = {
  computeForecast, getLatestForecast, getBranchAnomalies, getFoodCosting, getDashboard,
};