// series: array of daily quantities, oldest -> newest, length === windowDays
function classifyTrend(series, thresholdPercent) {
  const windowDays = series.length;
  const recentDays = Math.max(1, Math.round(windowDays * (3 / 7)));
  const earlierDays = windowDays - recentDays;

  const earlier = series.slice(0, earlierDays);
  const recent = series.slice(earlierDays);

  const movingAvg = series.reduce((a, b) => a + b, 0) / windowDays;
  const earlierAvg = earlier.length ? earlier.reduce((a, b) => a + b, 0) / earlier.length : 0;
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

  let percentChange;
  if (earlierAvg === 0) {
    percentChange = recentAvg > 0 ? 100 : 0;
  } else {
    percentChange = ((recentAvg - earlierAvg) / earlierAvg) * 100;
  }

  let trend_label = 'stable';
  if (percentChange > thresholdPercent) trend_label = 'increasing';
  else if (percentChange < -thresholdPercent) trend_label = 'decreasing';

  return { movingAvg, recentAvg, earlierAvg, percentChange, trend_label };
}

// Given trend + BOM + current stock, produce the most urgent reorder recommendation
function buildRecommendation({ item_name, trend_label, movingAvg, bomRows, inventoryLookup }) {
  if (trend_label !== 'increasing') {
    const msg = trend_label === 'decreasing'
      ? `Demand for ${item_name} is decreasing. Consider reducing the next ingredient order.`
      : `Demand for ${item_name} is stable. Maintain current stock levels.`;
    return { recommendation: msg, reorder_qty: 0 };
  }

  let worst = null;
  for (const bom of bomRows) {
    const inv = inventoryLookup[bom.ingredient_id];
    const stockOnHand = inv ? Number(inv.quantity_on_hand) : 0;
    const requiredQty = movingAvg * Number(bom.quantity_per_unit);
    const shortfall = requiredQty - stockOnHand;

    if (!worst || shortfall > worst.shortfall) {
      worst = { ingredient_name: bom.ingredient_name, shortfall, requiredQty, stockOnHand };
    }
  }

  if (!worst || worst.shortfall <= 0) {
    return {
      recommendation: `Demand for ${item_name} is increasing, but current stock covers projected usage. No reorder needed yet.`,
      reorder_qty: 0,
    };
  }

  return {
    recommendation: `Demand for ${item_name} is increasing. Reorder approximately ${worst.shortfall.toFixed(2)} of ${worst.ingredient_name} to cover projected demand.`,
    reorder_qty: Number(worst.shortfall.toFixed(2)),
  };
}

module.exports = { classifyTrend, buildRecommendation };