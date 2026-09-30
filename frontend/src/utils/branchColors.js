const PALETTE = ["#1e3a5f", "#4a90d9", "#7c5cbf", "#b3600a", "#1e7a3e", "#a5308c"];

export function buildBranchColors(branches = []) {
  const sorted = [...branches].sort((a, b) => a.branch_id - b.branch_id);
  return new Map(sorted.map((b, i) => [b.branch_id, PALETTE[i % PALETTE.length]]));
}