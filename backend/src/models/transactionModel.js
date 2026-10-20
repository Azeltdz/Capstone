const pool = require('../config/db');
const { TZ } = require('../utils/dates');

const EXPORT_LIMIT = 50000;
const SORT_COLUMNS = { time: 't.transaction_at', total: 't.total_amount' };
const BUCKET_PATTERNS = { hour: 'HH24', day: 'YYYY-MM-DD', month: 'YYYY-MM' };
const money = (n) => Math.round(Number(n) * 100) / 100;

const FROM_LIST = `FROM transactions t
  JOIN users u ON u.user_id = t.cashier_id
  JOIN branches b ON b.branch_id = t.branch_id
  LEFT JOIN tables tb ON tb.table_id = t.table_id`;

function parseOrderSearch(text) {
  const m = /^(#)?(?:(t|tx|txn)-?)?(\d*)$/i.exec(text);
  if (!m) return null;
  const [, hash, token, digits] = m;
  if (!hash && token?.toLowerCase() !== 'txn' && digits === '') return null;
  return digits;
}

const PAY_STATUS = new Set(['paid', 'unpaid']);

function buildWhere(f, { branch = true, search = true, status = 'paid' } = {}) {
  if (!PAY_STATUS.has(status)) throw new Error('invalid payment status');
  const values = [f.from, f.to];
  const conditions = [
    `t.status = '${status}'`,
    `t.transaction_at >= (($1::date)::timestamp AT TIME ZONE '${TZ}')`,
    `t.transaction_at < (($2::date + 1)::timestamp AT TIME ZONE '${TZ}')`,
  ];

  if (branch && f.branchId) {
    values.push(f.branchId);
    conditions.push(`t.branch_id = $${values.length}`);
  }
  if (f.orderType) {
    values.push(f.orderType);
    conditions.push(`t.order_type = $${values.length}`);
  }
  if (search && f.search) {
    const digits = parseOrderSearch(f.search);

    if (digits !== '') {
      const escaped = f.search.replace(/[\\%_]/g, '\\$&'); // a typed % or _ stays literal
      values.push(`${escaped}%`);                          // names: starts with what was typed
      const like = `$${values.length}`;
      let clause = `u.full_name ILIKE ${like} OR t.customer_name ILIKE ${like}`;

      if (digits !== null) {
        values.push(`${digits}%`);
        const digitsLike = `$${values.length}`;
        clause += digits.startsWith('0')
          ? ` OR (CASE WHEN t.transaction_id < 10000 THEN LPAD(t.transaction_id::text, 4, '0') ELSE t.transaction_id::text END) LIKE ${digitsLike}`
          : ` OR t.transaction_id::text LIKE ${digitsLike}`;
      }
      conditions.push(`(${clause})`);
    }
  }
  return { where: conditions.join(' AND '), values };
}

async function countRows(f) {
  const { where, values } = buildWhere(f);
  const { rows } = await pool.query(`SELECT COUNT(*) AS count ${FROM_LIST} WHERE ${where}`, values);
  return Number(rows[0].count);
}

async function fetchRows(f, limit, offset) {
  const { where, values } = buildWhere(f);
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  const { rows } = await pool.query(
    `SELECT t.transaction_id, t.branch_id, b.branch_name, u.full_name AS cashier_name,
            t.customer_name, t.guest_count, t.order_type, tb.table_number,
            t.total_amount, t.payment_method, t.transaction_at,
            t.subtotal_amount, t.vatable_sales, t.vat_amount, t.vat_exempt_sales, t.pwd_discount,
            t.amount_tendered, t.status AS payment_status, t.order_status
      ${FROM_LIST}
      WHERE ${where}
      ORDER BY ${SORT_COLUMNS[f.sort]} ${dir}, t.transaction_id ${dir}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );
    return rows.map((r) => ({
    ...r,
    total_amount: money(r.total_amount),
    vat_amount: r.vat_amount === null ? null : money(r.vat_amount),
    pwd_discount: money(r.pwd_discount),
  }));
}

async function listTransactions(f) {
  const total = await countRows(f);
  const pageCount = Math.max(1, Math.ceil(total / f.pageSize));
  const page = Math.min(f.page, pageCount); // asking for a page past the end returns the last page
  const rows = total ? await fetchRows(f, f.pageSize, (page - 1) * f.pageSize) : [];
  return { rows, total, page, page_count: pageCount, page_size: f.pageSize };
}

// Totals cover every matching row, not just the visible page.
async function getSummary(f) {
  const { where, values } = buildWhere(f);
  const { rows } = await pool.query(
    `SELECT t.payment_method, COUNT(*) AS count, COALESCE(SUM(t.total_amount), 0) AS amount
      FROM transactions t
      JOIN users u ON u.user_id = t.cashier_id
      WHERE ${where}
      GROUP BY t.payment_method
      ORDER BY amount DESC`,
    values
  );
  const by_payment = rows.map((r) => ({ method: r.payment_method, count: Number(r.count), amount: money(r.amount) }));
  const count = by_payment.reduce((s, p) => s + p.count, 0);
  const total = money(by_payment.reduce((s, p) => s + p.amount, 0));

  const { rows: [tax] } = await pool.query(
    `SELECT COALESCE(SUM(t.vatable_sales), 0) AS vatable_sales,
            COALESCE(SUM(t.vat_amount), 0) AS vat_amount,
            COALESCE(SUM(t.vat_exempt_sales), 0) AS vat_exempt_sales,
            COALESCE(SUM(t.pwd_discount), 0) AS pwd_discount,
            COUNT(*) FILTER (WHERE t.pwd_discount > 0) AS pwd_orders
      FROM transactions t
      JOIN users u ON u.user_id = t.cashier_id
      WHERE ${where}`,
    values
  );

  const open = buildWhere(f, { status: 'unpaid' });
  const { rows: [unpaid] } = await pool.query(
    `SELECT COUNT(*) AS count, COALESCE(SUM(t.total_amount), 0) AS amount
      FROM transactions t
      JOIN users u ON u.user_id = t.cashier_id
      WHERE ${open.where}`,
    open.values
  );

  return {
    total_sales: total, count, avg_order_value: count ? money(total / count) : 0, by_payment,
    vatable_sales: money(tax.vatable_sales), vat_amount: money(tax.vat_amount),
    vat_exempt_sales: money(tax.vat_exempt_sales), pwd_discount: money(tax.pwd_discount),
    pwd_orders: Number(tax.pwd_orders),
    unpaid_count: Number(unpaid.count), unpaid_amount: money(unpaid.amount),
  };
}

async function getTrendRows(f) {
  const pattern = BUCKET_PATTERNS[f.granularity];
  const { where, values } = buildWhere(f, { branch: false, search: false });
  const { rows } = await pool.query(
    `SELECT t.branch_id,
            to_char(t.transaction_at AT TIME ZONE '${TZ}', '${pattern}') AS bucket,
            SUM(t.total_amount) AS total
      FROM transactions t
      WHERE ${where}
      GROUP BY t.branch_id, bucket`,
    values
  );
  return rows.map((r) => ({ branch_id: r.branch_id, bucket: r.bucket, total: money(r.total) }));
}

module.exports = { EXPORT_LIMIT, countRows, fetchRows, listTransactions, getSummary, getTrendRows };