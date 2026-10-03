const pool = require('../config/db');
const { TZ } = require('../utils/dates');
const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;
const isConnectionError = (err) => /Connection terminated|ECONNRESET|ETIMEDOUT|timeout/i.test(err?.message ?? '');

async function createOrderWithItems({
  branch_id, cashier_id, table_id, order_type, payment_method, customer_name, guest_count, items,
}) {
  const client = await pool.connect();
  let destroy = false;
  try {
    await client.query('BEGIN');
    const { rows: branchRows } = await client.query(
      'SELECT is_active FROM branches WHERE branch_id = $1 FOR SHARE',
      [branch_id]
    );
    if (!branchRows.length) throw httpError(404, 'Branch not found');
    if (!branchRows[0].is_active) throw httpError(403, "This branch is deactivated and can't take orders.");
    // 1. Menu items, priced here on the server (never trust a price from the browser)
    const requestedIds = [...new Set(items.map((i) => Number(i.item_id)))];
    const { rows: menuItems } = await client.query(
      `SELECT item_id, item_name, selling_price, is_available FROM menu_items WHERE item_id = ANY($1::int[])`,
      [requestedIds]
    );
    if (menuItems.length !== requestedIds.length) throw httpError(404, 'One or more menu items not found');
    const unavailable = menuItems.filter((m) => !m.is_available);
    if (unavailable.length) {
      throw httpError(400, `Item(s) unavailable: ${unavailable.map((m) => m.item_name).join(', ')}`);
    }
    const menuById = new Map(menuItems.map((m) => [m.item_id, m]));
    // 2. Merge repeated lines, then price each one
    const qtyByItem = new Map();
    for (const i of items) {
      const id = Number(i.item_id);
      qtyByItem.set(id, (qtyByItem.get(id) ?? 0) + Number(i.quantity));
    }
    const lines = [...qtyByItem].map(([item_id, quantity]) => {
      const m = menuById.get(item_id);
      const unit_price = Number(m.selling_price);
      return { item_id, item_name: m.item_name, quantity, unit_price, subtotal: round2(unit_price * quantity) };
    });
    const total_amount = round2(lines.reduce((sum, l) => sum + l.subtotal, 0));
    // 3. Stock: one query for every recipe line, one to lock the stock rows, one to deduct
    const { rows: recipe } = await client.query(
      `SELECT item_id, ingredient_id, quantity_per_unit FROM bill_of_materials WHERE item_id = ANY($1::int[])`,
      [requestedIds]
    );
    const needed = new Map();
    for (const r of recipe) {
      needed.set(
        r.ingredient_id,
        (needed.get(r.ingredient_id) ?? 0) + Number(r.quantity_per_unit) * qtyByItem.get(r.item_id)
      );
    }
    let deductions = [];
    if (needed.size) {
      const { rows: stock } = await client.query(
        `SELECT inv.inventory_id, inv.ingredient_id, inv.quantity_on_hand, ing.ingredient_name, ing.unit
          FROM inventory inv
          JOIN ingredients ing ON ing.ingredient_id = inv.ingredient_id
          WHERE inv.branch_id = $1 AND inv.ingredient_id = ANY($2::int[])
          ORDER BY inv.ingredient_id
          FOR UPDATE OF inv`,
        [branch_id, [...needed.keys()]]
      );
      const stockByIngredient = new Map(stock.map((s) => [s.ingredient_id, s]));

      for (const [ingredient_id, qty] of needed) {
        const s = stockByIngredient.get(ingredient_id);
        if (!s) throw httpError(400, `No inventory record for ingredient_id ${ingredient_id} at this branch`);
        if (Number(s.quantity_on_hand) < round3(qty)) {
          throw httpError(
            400,
            `Insufficient stock for ${s.ingredient_name} (needs ${round3(qty)} ${s.unit}, has ${Number(s.quantity_on_hand)})`
          );
        }
      }

      deductions = stock.map((s) => ({ inventory_id: s.inventory_id, qty: round3(needed.get(s.ingredient_id)) }));
      const { rows: left } = await client.query(
        `UPDATE inventory inv SET quantity_on_hand = inv.quantity_on_hand - d.qty, last_updated = NOW()
          FROM unnest($1::int[], $2::numeric[]) AS d(inventory_id, qty)
          WHERE inv.inventory_id = d.inventory_id
          RETURNING inv.inventory_id, inv.quantity_on_hand`,
        [deductions.map((d) => d.inventory_id), deductions.map((d) => d.qty)]
      );
      const leftById = new Map(left.map((r) => [r.inventory_id, Number(r.quantity_on_hand)]));
      deductions.forEach((d) => { d.after = leftById.get(d.inventory_id); });
    }
    // 4. Dine-in: take the table with one atomic update that only succeeds if it's still free
    let table_number = null;
    if (order_type === 'dine-in') {
      if (!table_id) throw httpError(400, 'table_id is required for dine-in orders');
      const { rows: taken } = await client.query(
        `UPDATE tables SET status = 'occupied'
          WHERE table_id = $1 AND branch_id = $2 AND is_active = true AND status = 'available'
          RETURNING table_number`,
        [table_id, branch_id]
      );
      if (taken.length === 0) {
        const { rows: exists } = await client.query(
          'SELECT 1 FROM tables WHERE table_id = $1 AND branch_id = $2 AND is_active = true',
          [table_id, branch_id]
        );
        throw exists.length
          ? httpError(409, 'Table is already occupied')
          : httpError(404, 'Table not found for this branch');
      }
      table_number = taken[0].table_number;
    }
    // 5. Save the sale and its lines
    const {
      rows: [tx],
    } = await client.query(
      `INSERT INTO transactions
          (branch_id, cashier_id, table_id, order_type, status, total_amount, payment_method,
          customer_name, guest_count, transaction_at)
        VALUES ($1, $2, $3, $4, 'paid', $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        branch_id, cashier_id, order_type === 'dine-in' ? table_id : null, order_type,
        total_amount, payment_method, customer_name || null, guest_count || null,
      ]
    );

    await client.query(
      `INSERT INTO transaction_items (transaction_id, item_id, quantity, unit_price, subtotal)
          SELECT $1, d.item_id, d.quantity, d.unit_price, d.subtotal
          FROM unnest($2::int[], $3::int[], $4::numeric[], $5::numeric[]) AS d(item_id, quantity, unit_price, subtotal)`,
      [
        tx.transaction_id,
        lines.map((l) => l.item_id), lines.map((l) => l.quantity),
        lines.map((l) => l.unit_price), lines.map((l) => l.subtotal),
      ]
    );

    if (deductions.length) {
      await client.query(
        `INSERT INTO inventory_movements
            (inventory_id, movement_type, quantity_delta, quantity_after, reference_type, reference_id, performed_by)
          SELECT m.inventory_id, 'sale', -m.qty, m.qty_after, 'transaction', $1, $2
          FROM unnest($3::int[], $4::numeric[], $5::numeric[]) AS m(inventory_id, qty, qty_after)`,
        [tx.transaction_id, cashier_id, deductions.map((d) => d.inventory_id),
          deductions.map((d) => d.qty), deductions.map((d) => d.after)]
      );
    }

    await client.query('COMMIT');

    return { ...tx, total_amount, table_number, items: lines };
  } catch (err) {
    destroy = isConnectionError(err);
    try {
      await client.query('ROLLBACK');
    } catch {
      destroy = true;
    }
    throw err;
  } finally {
    client.release(destroy);
  }
}

async function getOrdersFiltered({ branch_id, order_type, date, search }) {
  const conditions = [];
  const values = [];
  const add = (v) => { values.push(v); return `$${values.length}`; };

  if (branch_id) conditions.push(`t.branch_id = ${add(branch_id)}`);
  if (order_type) conditions.push(`t.order_type = ${add(order_type)}`);
  if (date) {
    const d = add(date);
    conditions.push(`t.transaction_at >= (((${d}::date)::timestamp) AT TIME ZONE '${TZ}')`);
    conditions.push(`t.transaction_at < ((((${d}::date + 1))::timestamp) AT TIME ZONE '${TZ}')`);
  }
  if (search && search.trim()) {
    const escaped = search.trim().replace(/[\\%_]/g, '\\$&');
    conditions.push(`t.customer_name ILIKE ${add(`${escaped}%`)}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT t.*, u.full_name AS cashier_name, tb.table_number, b.branch_name
      FROM transactions t
      JOIN users u ON u.user_id = t.cashier_id
      LEFT JOIN tables tb ON tb.table_id = t.table_id
      JOIN branches b ON b.branch_id = t.branch_id
      ${where}
      ORDER BY t.transaction_at DESC
      LIMIT 500`,
    values
  );
  return rows;
}

async function getOrderById(id) {
  const { rows } = await pool.query(
    `SELECT t.*, u.full_name AS cashier_name, tb.table_number, b.branch_name,
            rs.business_name AS receipt_business_name, rs.footer_message AS receipt_footer_message,
            COALESCE((
              SELECT json_agg(json_build_object(
                        'tx_item_id', ti.tx_item_id, 'item_id', ti.item_id, 'item_name', mi.item_name,
                        'quantity', ti.quantity, 'unit_price', ti.unit_price, 'subtotal', ti.subtotal
                      ) ORDER BY ti.tx_item_id)
              FROM transaction_items ti
              JOIN menu_items mi ON mi.item_id = ti.item_id
              WHERE ti.transaction_id = t.transaction_id
            ), '[]'::json) AS items
      FROM transactions t
      JOIN users u ON u.user_id = t.cashier_id
      JOIN branches b ON b.branch_id = t.branch_id
      LEFT JOIN tables tb ON tb.table_id = t.table_id
      LEFT JOIN receipt_settings rs ON rs.branch_id = t.branch_id
      WHERE t.transaction_id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

module.exports = { createOrderWithItems, getOrdersFiltered, getOrderById };