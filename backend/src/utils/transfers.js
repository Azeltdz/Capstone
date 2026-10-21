const round2 = (n) => Math.round(n * 100) / 100;
const floor2 = (n) => Math.floor(n * 100 + 1e-9) / 100;

function computeAllocation({ branches, branchItemAverages, bomRows, stockRows, horizonDays }) {
  const nameById = new Map(branches.map((b) => [b.branch_id, b.branch_name]));

  const dailyUse = new Map();
  for (const b of branches) {
    const averages = branchItemAverages.get(b.branch_id) ?? new Map();
    for (const row of bomRows) {
      const avg = averages.get(row.item_id);
      if (!avg) continue;
      const key = `${b.branch_id}:${row.ingredient_id}`;
      dailyUse.set(key, (dailyUse.get(key) ?? 0) + avg * Number(row.quantity_per_unit));
    }
  }

  const usage = [];
  const byIngredient = new Map();
  for (const s of stockRows) {
    if (!nameById.has(s.branch_id)) continue;
    const onHand = Number(s.quantity_on_hand);
    const daily = dailyUse.get(`${s.branch_id}:${s.ingredient_id}`) ?? 0;
    const need = daily * horizonDays;
    const cover = daily > 0 ? onHand / daily : null;

    let status = 'ok';
    if (daily === 0) status = onHand > 0 ? 'idle' : 'ok';
    else if (onHand < need) status = 'low';
    else if (onHand > need * 2) status = 'surplus';

    const row = {
      branch_id: s.branch_id, branch_name: nameById.get(s.branch_id),
      ingredient_id: s.ingredient_id, ingredient_name: s.ingredient_name, unit: s.unit,
      on_hand: round2(onHand), daily_usage: round2(daily),
      days_of_cover: cover === null ? null : Math.round(cover * 10) / 10, status,
    };
    usage.push(row);

    const list = byIngredient.get(s.ingredient_id) ?? [];
    list.push({ ...row, onHand, daily, need });
    byIngredient.set(s.ingredient_id, list);
  }

  const transfers = [];
  const stillShort = new Map();
  for (const rows of byIngredient.values()) {
    const receivers = rows
      .filter((r) => r.daily > 0 && r.onHand < r.need)
      .map((r) => ({ ...r, short: r.need - r.onHand }))
      .sort((a, b) => (a.onHand / a.daily) - (b.onHand / b.daily));
    const donors = rows
      .map((r) => ({ ...r, spare: r.onHand - r.need }))
      .filter((r) => r.spare > 0 && r.status !== 'low')
      .sort((a, b) => b.spare - a.spare);

    for (const to of receivers) {
      for (const from of donors) {
        if (to.short <= 0) break;
        if (from.branch_id === to.branch_id || from.spare <= 0) continue;
        const qty = floor2(Math.min(from.spare, to.short));
        if (qty <= 0) continue;
        from.spare -= qty;
        to.short -= qty;
        transfers.push({
          ingredient_id: to.ingredient_id, ingredient_name: to.ingredient_name, unit: to.unit,
          from_branch_id: from.branch_id, from_branch_name: from.branch_name,
          to_branch_id: to.branch_id, to_branch_name: to.branch_name,
          quantity: qty,
          from_days_of_cover: from.days_of_cover, to_days_of_cover: to.days_of_cover,
          reason:
            `${to.branch_name} has about ${to.days_of_cover} days of cover; ` +
            `${from.branch_name} has ${from.days_of_cover === null ? 'stock it is not using' : `${from.days_of_cover} days`} ` +
            `and still keeps ${horizonDays} days of its own demand after sending this.`,
        });
      }
      if (to.short > 0.005) stillShort.set(`${to.branch_id}:${to.ingredient_id}`, round2(to.short));
    }
  }
  transfers.sort((a, b) => (a.to_days_of_cover ?? 0) - (b.to_days_of_cover ?? 0));

  const order = { low: 0, surplus: 1, idle: 2, ok: 3 };
  usage.sort((a, b) =>
    order[a.status] - order[b.status] || (a.days_of_cover ?? Infinity) - (b.days_of_cover ?? Infinity));

  return {
    transfers,
    usage: usage.map((u) => ({ ...u, still_to_order: stillShort.get(`${u.branch_id}:${u.ingredient_id}`) ?? 0 })),
  };
}

// "branch:ingredient" -> [{ from_branch_name, quantity }] for every suggested transfer into that branch.
function incomingTransfers({ transfers }) {
  const map = new Map();
  for (const t of transfers) {
    const key = `${t.to_branch_id}:${t.ingredient_id}`;
    const list = map.get(key) ?? [];
    list.push({ from_branch_name: t.from_branch_name, quantity: t.quantity });
    map.set(key, list);
  }
  return map;
}

// How much of a reorder a transfer covers, and what is left to order from the supplier.
function netOrder(reorderQty, moves) {
  const transfer = round2(moves.reduce((sum, m) => sum + m.quantity, 0));
  return { transfer_qty: transfer, order_qty: Math.max(0, round2(reorderQty - transfer)) };
}

module.exports = { computeAllocation, incomingTransfers, netOrder };