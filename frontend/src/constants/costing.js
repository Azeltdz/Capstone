export const TARGET_FOOD_COST_PCT = 40;
const WATCH_BAND = 5;

export function costTone(foodCostPct) {
  if (foodCostPct == null) return "";
  if (foodCostPct <= TARGET_FOOD_COST_PCT) return "green-text";
  if (foodCostPct <= TARGET_FOOD_COST_PCT + WATCH_BAND) return "orange-text";
  return "red-text";
}