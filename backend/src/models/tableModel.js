const pool = require('../config/db');

const DEFAULT_CAPACITY = 4;
const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

async function getTablesByBranch(branchId) {
  const { rows } = await pool.query(
    `SELECT tb.table_id, tb.branch_id, tb.table_number, tb.guest_capacity, tb.status,
            s.transaction_id AS seated_transaction_id, s.customer_name AS seated_customer,
            s.guest_count AS seated_guests, s.transaction_at AS seated_at
      FROM tables tb
      LEFT JOIN LATERAL (
        SELECT t.transaction_id, t.customer_name, t.guest_count, t.transaction_at
        FROM transactions t
        WHERE t.table_id = tb.table_id AND t.status = 'paid'
        ORDER BY t.transaction_at DESC LIMIT 1
      ) s ON tb.status = 'occupied'
      WHERE tb.branch_id = $1 AND tb.is_active = true
      ORDER BY tb.table_number ASC`,
    [branchId]
  );
  return rows;
}

async function getTableById(id) {
  const { rows } = await pool.query('SELECT * FROM tables WHERE table_id = $1', [id]);
  return rows[0];
}

async function releaseTableById(id) {
  const { rows } = await pool.query(
    `UPDATE tables SET status = 'available' WHERE table_id = $1 RETURNING *`, [id]
  );
  return rows[0];
}

async function applyLayout(branchId, count, capacities = []) {
  const wanted = new Map(capacities.map((c) => [Number(c.table_number), Number(c.guest_capacity)]));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT 1 FROM branches WHERE branch_id = $1 FOR UPDATE', [branchId]); // serializes edits
    const { rows: existing } = await client.query('SELECT * FROM tables WHERE branch_id = $1 FOR UPDATE', [branchId]);
    const byNumber = new Map(existing.map((t) => [t.table_number, t]));

    const blocked = existing.filter((t) => t.is_active && t.table_number > count && t.status === 'occupied');
    if (blocked.length) {
      throw httpError(
        409,
        `Free table ${blocked.map((t) => t.table_number).join(', ')} before removing ${blocked.length === 1 ? 'it' : 'them'}.`
      );
    }

    for (let n = 1; n <= count; n++) {
      const t = byNumber.get(n);
      const seats = wanted.get(n);
      if (!t) {
        await client.query(
          `INSERT INTO tables (branch_id, table_number, guest_capacity, status) VALUES ($1, $2, $3, 'available')`,
          [branchId, n, seats ?? DEFAULT_CAPACITY]
        );
      } else if (!t.is_active) {
        await client.query(
          `UPDATE tables SET is_active = true, status = 'available',
                  guest_capacity = COALESCE($2, guest_capacity) WHERE table_id = $1`,
          [t.table_id, seats ?? null]
        );
      } else if (seats !== undefined && seats !== t.guest_capacity) {
        await client.query('UPDATE tables SET guest_capacity = $2 WHERE table_id = $1', [t.table_id, seats]);
      }
    }

    await client.query(
      'UPDATE tables SET is_active = false WHERE branch_id = $1 AND is_active = true AND table_number > $2',
      [branchId, count]
    );
    await client.query('UPDATE branches SET table_count = $2 WHERE branch_id = $1', [branchId, count]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getTablesByBranch, getTableById, releaseTableById, applyLayout };