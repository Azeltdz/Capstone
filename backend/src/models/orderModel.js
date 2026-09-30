const pool = require('../config/db');
const TZ = "Asia/Manila";

async function createOrderWithItems({ branch_id, cashier_id, table_id, order_type, payment_method, customer_name, guest_count, items }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const itemIds = items.map((i) => i.item_id);
    const { rows: menuItems } = await client.query(
      `SELECT item_id, item_name, selling_price, is_available FROM menu_items WHERE item_id = ANY($1::int[])`,
      [itemIds]
    );
    if (menuItems.length !== itemIds.length) {
      throw Object.assign(new Error('One or more menu items not found'), { statusCode: 404 });
    }
    const unavailable = menuItems.filter((m) => !m.is_available);
    if (unavailable.length) {
      throw Object.assign(
        new Error(`Item(s) unavailable: ${unavailable.map((m) => m.item_name).join(', ')}`),
        { statusCode: 400 }
      );
    }

    let total_amount = 0;
    const itemsWithPrice = items.map((orderItem) => {
      const menuItem = menuItems.find((m) => m.item_id === orderItem.item_id);
      const subtotal = Number(menuItem.selling_price) * orderItem.quantity;
      total_amount += subtotal;
      return { ...orderItem, unit_price: menuItem.selling_price, subtotal };
    });

    for (const orderItem of itemsWithPrice) {
      const { rows: bomRows } = await client.query(
        `SELECT ingredient_id, quantity_per_unit FROM bill_of_materials WHERE item_id = $1`,
        [orderItem.item_id]
      );

      for (const bom of bomRows) {
        const deduction = Number(bom.quantity_per_unit) * orderItem.quantity;

        const { rows: invRows } = await client.query(
          `SELECT inventory_id, quantity_on_hand FROM inventory
            WHERE branch_id = $1 AND ingredient_id = $2 FOR UPDATE`,
          [branch_id, bom.ingredient_id]
        );

        if (invRows.length === 0) {
          throw Object.assign(
            new Error(`No inventory record for ingredient_id ${bom.ingredient_id} at this branch`),
            { statusCode: 400 }
          );
        }

        const inv = invRows[0];
        if (Number(inv.quantity_on_hand) < deduction) {
          throw Object.assign(
            new Error(`Insufficient stock for ingredient_id ${bom.ingredient_id} (needs ${deduction}, has ${inv.quantity_on_hand})`),
            { statusCode: 400 }
          );
        }

        await client.query(
          `UPDATE inventory SET quantity_on_hand = quantity_on_hand - $1, last_updated = NOW() WHERE inventory_id = $2`,
          [deduction, inv.inventory_id]
        );
      }
    }
  
    if (order_type === 'dine-in') {
      if (!table_id) {
        throw Object.assign(new Error('table_id is required for dine-in orders'), { statusCode: 400 });
      }
      const { rows: tableRows } = await client.query(
        `SELECT * FROM tables WHERE table_id = $1 AND branch_id = $2 AND is_active = true FOR UPDATE`,
        [table_id, branch_id]
      );
      if (tableRows.length === 0) {
        throw Object.assign(new Error('Table not found for this branch'), { statusCode: 404 });
      }
      if (tableRows[0].status === 'occupied') {
        throw Object.assign(new Error('Table is already occupied'), { statusCode: 409 });
      }
      await client.query(`UPDATE tables SET status = 'occupied' WHERE table_id = $1`, [table_id]);
    }

    const { rows: txRows } = await client.query(
      `INSERT INTO transactions
        (branch_id, cashier_id, table_id, order_type, status, total_amount, payment_method, customer_name, guest_count, transaction_at)
      VALUES ($1, $2, $3, $4, 'paid', $5, $6, $7, $8, NOW())
      RETURNING *`,
      [
        branch_id,
        cashier_id,
        order_type === "dine-in" ? table_id : null,
        order_type,
        total_amount,
        payment_method,
        customer_name || null,
        guest_count || null,
      ]
    );
    const transaction = txRows[0];

    for (const item of itemsWithPrice) {
      await client.query(
        `INSERT INTO transaction_items (transaction_id, item_id, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5)`,
        [transaction.transaction_id, item.item_id, item.quantity, item.unit_price, item.subtotal]
      );
    }

    await client.query('COMMIT');
    return transaction;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getOrdersFiltered({ branch_id, order_type, date, search }) {
  const conditions = [];
  const values = [];
  let i = 1;

  if (branch_id) { conditions.push(`t.branch_id = $${i++}`); values.push(branch_id); }
  if (order_type) { conditions.push(`t.order_type = $${i++}`); values.push(order_type); }

  if (date) {
    conditions.push(`DATE(t.transaction_at AT TIME ZONE '${TZ}') = $${i++}`);
    values.push(date);
  }

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[\\%_]/g, "\\$&");
    conditions.push(`t.customer_name ILIKE $${i++}`);
    values.push(`${escaped}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT t.*, u.full_name AS cashier_name, tb.table_number, b.branch_name
      FROM transactions t
      JOIN users u ON u.user_id = t.cashier_id
      LEFT JOIN tables tb ON tb.table_id = t.table_id
      JOIN branches b ON b.branch_id = t.branch_id
      ${where}
      ORDER BY t.transaction_at DESC`,
    values
  );
  return rows;
}

async function getOrderById(id) {
  const { rows } = await pool.query(
    `SELECT t.*, u.full_name AS cashier_name, tb.table_number, b.branch_name
      FROM transactions t
      JOIN users u ON u.user_id = t.cashier_id
      LEFT JOIN tables tb ON tb.table_id = t.table_id
      JOIN branches b ON b.branch_id = t.branch_id
      WHERE t.transaction_id = $1`,
    [id]
  );
  if (!rows[0]) return null;

  const { rows: items } = await pool.query(
    `SELECT ti.*, mi.item_name
      FROM transaction_items ti
      JOIN menu_items mi ON mi.item_id = ti.item_id
      WHERE ti.transaction_id = $1`,
    [id]
  );

  return { ...rows[0], items };
}

module.exports = { createOrderWithItems, getOrdersFiltered, getOrderById };