const MIN_BASELINE = 3;

function evaluatePace({ today_count, baseline_avg }, thresholdPercent) {
  const today = Number(today_count);
  const baseline = Number(baseline_avg);

  if (baseline < MIN_BASELINE) {
    return { flagged: false, percentBelow: 0, baseline: Number(baseline.toFixed(1)) };
  }

  const percentBelow = ((baseline - today) / baseline) * 100;
  return {
    flagged: percentBelow >= thresholdPercent,
    percentBelow: Math.max(0, Math.round(percentBelow * 10) / 10),
    baseline: Number(baseline.toFixed(1)),
  };
}

module.exports = { evaluatePace, MIN_BASELINE };