export const UNITS = {
  g: { type: "weight", factor: 1 }, kg: { type: "weight", factor: 1000 },
  mL: { type: "volume", factor: 1 }, L: { type: "volume", factor: 1000 },
  pcs: { type: "count", factor: 1 }, dozen: { type: "count", factor: 12 },
  pack: { type: "other" }, bottle: { type: "other" }, can: { type: "other" }, sack: { type: "other" },
};
export const UNIT_OPTIONS = Object.keys(UNITS);

export function compatibleUnits(unit) {
  const u = UNITS[unit];
  if (!u || u.type === "other") return [unit];
  return UNIT_OPTIONS.filter((k) => UNITS[k].type === u.type);
}

// null when the two units can't be converted
export function convert(qty, from, to) {
  if (from === to) return qty;
  const a = UNITS[from];
  const b = UNITS[to];
  if (!a || !b || a.type === "other" || a.type !== b.type) return null;
  return Math.round(((qty * a.factor) / b.factor) * 1000) / 1000;
}