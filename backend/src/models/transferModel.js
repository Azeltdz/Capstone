const pool = require('../config/db');
const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const round3 = (n) => Math.round(n * 1000) / 1000;

// Moves stock from one branch to another in ONE database transaction:
// either both branches are updated and both movements are logged, or nothing changes.
async function createTransfer({ ingredient_id, from_branch_id, to_branch_id, quantity, note, performed_by }) {
  if (from_branch_id === to_branch_id) throw httpError(400, 'Choose two different branches.');
  const qty = round3(Number(quantity));
  if (!(qty > 0)) throw httpError(400, 'Quantity must be greater than zero.');

  return pool.withTransaction(async (client) => {
    // Lock both stock rows in a fixed order (lowest id first) so two transfers at once can't deadlock.
    const { rows } = await client.query(
      `SELECT inv.inventory_id, inv.branch_id, inv.quantity_on_hand, ing.ingredient_name, ing.unit, b.branch_name, b.is_active
          FROM inventory inv
          JOIN ingredients ing ON ing.ingredient_id = inv.ingredient_id
          JOIN branches b ON b.branch_id = inv.branch_id
        WHERE inv.ingredient_id = $1 AND inv.branch_id IN ($2, $3)
        ORDER BY inv.inventory_id
        FOR UPDATE OF inv`,
      [ingredient_id, from_branch_id, to_branch_id]
    );
    const from = rows.find((r) => r.branch_id === from_branch_id);
    const to = rows.find((r) => r.branch_id === to_branch_id);
    if (!from) throw httpError(404, 'The sending branch does not track this ingredient.');
    if (!to) throw httpError(404, 'The receiving branch does not track this ingredient yet. Add it to that branch\'s inventory first.');
    if (!from.is_active || !to.is_active) throw httpError(400, 'Both branches must be active.');

    const fromBefore = Number(from.quantity_on_hand);
    const toBefore = Number(to.quantity_on_hand);
    const fromAfter = round3(fromBefore - qty);
    const toAfter = round3(toBefore + qty);
    if (fromAfter < 0) {
      throw httpError(400, `${from.branch_name} only has ${fromBefore} ${from.unit} of ${from.ingredient_name}, so ${qty} ${from.unit} can't be sent.`);
    }

    const { rows: [transfer] } = await client.query(
      `INSERT INTO stock_transfers (ingredient_id, from_branch_id, to_branch_id, quantity, note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [ingredient_id, from_branch_id, to_branch_id, qty, note || null, performed_by]
    );

    await client.query('UPDATE inventory SET quantity_on_hand = $2, last_updated = NOW() WHERE inventory_id = $1', [from.inventory_id, fromAfter]);
    await client.query('UPDATE inventory SET quantity_on_hand = $2, last_updated = NOW() WHERE inventory_id = $1', [to.inventory_id, toAfter]);

    const suffix = note ? ` (${note})` : '';
    await client.query(
      `INSERT INTO inventory_movements (inventory_id, movement_type, quantity_delta, quantity_after, reason, reference_type, reference_id, performed_by)
        VALUES ($1, 'transfer_out', $2, $3, $4, 'transfer', $5, $6),
              ($7, 'transfer_in',  $8, $9, $10, 'transfer', $5, $6)`,
      [
        from.inventory_id, -qty, fromAfter, `Sent to ${to.branch_name}${suffix}`, transfer.transfer_id, performed_by,
        to.inventory_id, qty, toAfter, `Received from ${from.branch_name}${suffix}`,
      ]
    );

    return {
      transfer: { ...transfer, quantity: Number(transfer.quantity) },
      ingredient_name: from.ingredient_name, unit: from.unit,
      from: { branch_id: from_branch_id, branch_name: from.branch_name, quantity_on_hand: fromAfter },
      to: { branch_id: to_branch_id, branch_name: to.branch_name, quantity_on_hand: toAfter },
    };
  });
}

async function listTransfers(limit = 20) {
  const { rows } = await pool.query(
    `SELECT t.transfer_id, t.quantity, t.note, t.created_at,
            ing.ingredient_name, ing.unit,
            fb.branch_name AS from_branch_name, tb.branch_name AS to_branch_name,
            u.full_name AS created_by_name
        FROM stock_transfers t
        JOIN ingredients ing ON ing.ingredient_id = t.ingredient_id
        JOIN branches fb ON fb.branch_id = t.from_branch_id
        JOIN branches tb ON tb.branch_id = t.to_branch_id
        LEFT JOIN users u ON u.user_id = t.created_by
      ORDER BY t.created_at DESC, t.transfer_id DESC
      LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({ ...r, quantity: Number(r.quantity) }));
}

module.exports = { createTransfer, listTransfers };