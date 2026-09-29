const MIN_DAYS_FOR_TREND = 4;
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

// quantities: one number per completed day, oldest -> newest.
function classifyTrend(quantities, thresholdPercent) {
  const n = quantities.length;
  const movingAverage = n ? quantities.reduce((a, b) => a + b, 0) / n : 0;

  if (n < MIN_DAYS_FOR_TREND) {
    return {
      moving_average: round2(movingAverage),
      recent_average: null, earlier_average: null, percent_change: null,
      trend: 'insufficient_data',
    };
  }

  // Latest ~3/7 of the window vs. the rest (7 days -> last 3 vs. previous 4)
  const recentDays = Math.max(1, Math.round((n * 3) / 7));
  const earlier = quantities.slice(0, n - recentDays);
  const recent = quantities.slice(n - recentDays);
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

  let change;
  if (earlierAvg === 0) change = recentAvg > 0 ? 100 : 0;
  else change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

  let trend = 'stable';
  if (change > thresholdPercent) trend = 'increasing';
  else if (change < -thresholdPercent) trend = 'decreasing';

  return {
    moving_average: round2(movingAverage),
    recent_average: round2(recentAvg),
    earlier_average: round2(earlierAvg),
    percent_change: round1(change),
    trend,
  };
}

function trendMessage({ trend, percent_change }) {
  switch (trend) {
    case 'increasing':
      return `Demand is up ${Math.abs(percent_change)}% compared with earlier in the period. Check ingredient stock.`;
    case 'decreasing':
      return `Demand is down ${Math.abs(percent_change)}% compared with earlier in the period. Consider smaller ingredient orders.`;
    case 'stable':
      return 'Demand is steady. Keep current stock levels.';
    default:
      return `Not enough sales history yet. A trend needs at least ${MIN_DAYS_FOR_TREND} days.`;
  }
}

// One branch. itemAverages: Map(item_id -> avg servings/day)
// bomRows: [{ item_id, ingredient_id, quantity_per_unit }]
// stockByIngredient: Map(ingredient_id -> { ingredient_name, unit, quantity_on_hand })
//
//   daily demand   = sum over every dish using the ingredient of (avg servings/day x qty per serving)
//   reorder qty    = daily demand x (lead time + safety stock days) - stock on hand
function computeBranchProcurement({ itemAverages, bomRows, stockByIngredient, leadTimeDays, safetyStockDays }) {
  const horizon = leadTimeDays + safetyStockDays;
  const demand = new Map();

  for (const bom of bomRows) {
    const avg = itemAverages.get(bom.item_id);
    if (!avg) continue;
    const perDay = avg * Number(bom.quantity_per_unit);
    const entry = demand.get(bom.ingredient_id) ?? { daily: 0, contributors: [] };
    entry.daily += perDay;
    entry.contributors.push({ item_id: bom.item_id, per_day: perDay });
    demand.set(bom.ingredient_id, entry);
  }

  const results = [];
  for (const [ingredient_id, entry] of demand) {
    const stock = stockByIngredient.get(ingredient_id);
    if (!stock) continue; // not tracked at this branch

    const onHand = Number(stock.quantity_on_hand);
    const reorder = round2(entry.daily * horizon - onHand);
    if (reorder <= 0) continue;

    const daysOfCover = entry.daily > 0 ? onHand / entry.daily : null;
    entry.contributors.sort((a, b) => b.per_day - a.per_day);

    results.push({
      ingredient_id,
      ingredient_name: stock.ingredient_name,
      unit: stock.unit,
      on_hand: onHand,
      daily_demand: round2(entry.daily),
      horizon_days: horizon,
      reorder_qty: reorder,
      days_of_cover: daysOfCover == null ? null : round1(daysOfCover),
      urgent: daysOfCover != null && daysOfCover < leadTimeDays,
      contributors: entry.contributors,
    });
  }

  results.sort(
    (a, b) => Number(b.urgent) - Number(a.urgent) || (a.days_of_cover ?? Infinity) - (b.days_of_cover ?? Infinity)
  );
  return results;
}

module.exports = { classifyTrend, trendMessage, computeBranchProcurement, MIN_DAYS_FOR_TREND };