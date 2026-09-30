const { getDashboardData, getBranchPaceStats, getFoodCostingData } = require('../models/analyticsModel');
const { getAllBranches, getBranchById } = require('../models/branchModel');
const { evaluatePace, MIN_BASELINE } = require('../utils/anomaly');
const analytics = require('../services/analyticsService');

// Reads ?branchId= (missing or "all" = every active branch). Sends the error response itself.
async function resolveBranchScope(req, res) {
  const raw = req.query.branchId;
  if (raw === undefined || raw === '' || raw === 'all') return { branchId: null };
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: 'branchId must be a positive whole number' });
    return null;
  }
  if (!(await getBranchById(id))) {
    res.status(404).json({ message: 'Branch not found' });
    return null;
  }
  return { branchId: id };
}

async function getTrends(req, res, next) {
  try {
    const scope = await resolveBranchScope(req, res);
    if (!scope) return;
    res.json(await analytics.getTrends(scope.branchId));
  } catch (err) { next(err); }
}

async function getProcurement(req, res, next) {
  try {
    const scope = await resolveBranchScope(req, res);
    if (!scope) return;
    res.json(await analytics.getProcurement(scope.branchId));
  } catch (err) { next(err); }
}

async function refreshForecasts(req, res, next) {
  try {
    res.json(await analytics.refreshForecasts());
  } catch (err) { next(err); }
}

async function getBranchAnomalies(req, res, next) {
  try {
    const { windowDays, anomalyThreshold } = await analytics.getActiveSettings();
    const [pace, branches] = await Promise.all([getBranchPaceStats(windowDays), getAllBranches()]);
    const nameById = new Map(branches.map((b) => [b.branch_id, b.branch_name]));

    const rows = pace
      .map((p) => {
        const r = evaluatePace(p, anomalyThreshold);
        return {
          branch_id: p.branch_id,
          branch_name: nameById.get(p.branch_id),
          expected: r.baseline,
          actual: p.today_count,
          percent_below: r.percentBelow,
          flagged: r.flagged,
          enough_history: p.baseline_avg >= MIN_BASELINE,
        };
      })
      .sort((a, b) => Number(b.flagged) - Number(a.flagged) || b.percent_below - a.percent_below);

    res.json({ anomaly_threshold: anomalyThreshold, window_days: windowDays, branches: rows });
  } catch (err) { next(err); }
}

async function getFoodCosting(req, res, next) {
  try {
    const items = await getFoodCostingData();

    const live = items.filter((i) => i.is_available);
    const costed = live.filter((i) => i.margin_percent !== null);
    const byMargin = [...costed].sort((a, b) => b.margin_percent - a.margin_percent);
    const brief = (i) => (i ? { item_id: i.item_id, item_name: i.item_name, margin_percent: i.margin_percent } : null);
    const mean = costed.length ? costed.reduce((s, i) => s + i.food_cost_percent, 0) / costed.length : null;

    res.json({
      items,
      stats: {
        total_items: live.length,
        costed_items: costed.length,
        missing_recipe_count: live.filter((i) => i.bom_count === 0).length,
        avg_food_cost_percent: mean === null ? null : Math.round(mean * 10) / 10,
        highest_margin: brief(byMargin[0]),
        lowest_margin: brief(byMargin[byMargin.length - 1]),
      },
    });
  } catch (err) { next(err); }
}

async function getDashboard(req, res, next) {
  try {
    const { windowDays, anomalyThreshold } = await analytics.getActiveSettings();
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
      (latest, f) => (!latest || f.computed_at > latest ? f.computed_at : latest), null
    );
    const recommendations = raw.forecasts
      .filter((f) => f.reorder_qty > 0 || f.trend_label === 'decreasing')
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
  getTrends, getProcurement, refreshForecasts, getBranchAnomalies, getFoodCosting, getDashboard,
};