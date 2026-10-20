const model = require('../models/transactionModel');
const { getAllBranches } = require('../models/branchModel');
const { TZ, manilaToday, shiftDate, dateRange, monthRange } = require('../utils/dates');
const { toCsv } = require('../utils/csv');

const PERIODS = {
  today: { days: 1, granularity: 'hour' },
  '7d': { days: 7, granularity: 'day' },
  '30d': { days: 30, granularity: 'day' },
  '365d': { days: 365, granularity: 'month' },
};

const peso = (v) => (v === null || v === undefined ? null : Number(v).toFixed(2));

const ORDER_TYPES = new Set(['dine-in', 'take-out', 'delivery']);
const clampInt = (v, fallback, min, max) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

function parseFilters(q) {
  const period = PERIODS[q.period] ? q.period : 'today';
  const { days, granularity } = PERIODS[period];
  const to = manilaToday();
  const branchId = Number(q.branchId);
  return {
    period, granularity, to,
    from: shiftDate(to, -(days - 1)),
    branchId: Number.isInteger(branchId) && branchId > 0 ? branchId : null,
    orderType: ORDER_TYPES.has(q.orderType) ? q.orderType : null,
    search: (q.search || '').trim().slice(0, 100),
    sort: q.sort === 'total' ? 'total' : 'time',
    dir: q.dir === 'asc' ? 'asc' : 'desc',
    page: clampInt(q.page, 1, 1, 100000),
    pageSize: clampInt(q.pageSize, 25, 1, 100),
  };
}

async function list(req, res, next) {
  try {
    res.json(await model.listTransactions(parseFilters(req.query)));
  } catch (err) { next(err); }
}

async function summary(req, res, next) {
  try {
    const f = parseFilters(req.query);
    res.json({ period: f.period, from: f.from, to: f.to, ...(await model.getSummary(f)) });
  } catch (err) { next(err); }
}

async function trend(req, res, next) {
  try {
    const f = parseFilters(req.query);
    const [rows, branches] = await Promise.all([model.getTrendRows(f), getAllBranches()]);

    let buckets;
    if (f.granularity === 'day') buckets = dateRange(f.from, f.to);
    else if (f.granularity === 'month') buckets = monthRange(f.from.slice(0, 7), f.to.slice(0, 7));
    else {
      const hours = rows.map((r) => Number(r.bucket));
      const lo = Math.min(...hours);
      buckets = hours.length
        ? Array.from({ length: Math.max(...hours) - lo + 1 }, (_, i) => String(lo + i).padStart(2, '0'))
        : [];
    }

    const position = new Map(buckets.map((k, i) => [k, i]));
    const series = new Map();
    for (const r of rows) {
      const values = series.get(r.branch_id) ?? new Array(buckets.length).fill(0);
      const i = position.get(r.bucket);
      if (i !== undefined) values[i] += r.total;
      series.set(r.branch_id, values);
    }

    const shown = branches
      .filter((b) => b.is_active || series.has(b.branch_id))
      .sort((a, b) => a.branch_id - b.branch_id);

    res.json({
      granularity: f.granularity, from: f.from, to: f.to, buckets,
      branches: shown.map((b) => ({
        branch_id: b.branch_id,
        branch_name: b.branch_name,
        values: (series.get(b.branch_id) ?? new Array(buckets.length).fill(0)).map((v) => Math.round(v * 100) / 100),
      })),
    });
  } catch (err) { next(err); }
}

async function exportCsv(req, res, next) {
  try {
    const f = parseFilters(req.query);
    const total = await model.countRows(f);
    if (total > model.EXPORT_LIMIT) {
      return res.status(400).json({
        message: `Too many rows to export (${total.toLocaleString()}; the limit is ${model.EXPORT_LIMIT.toLocaleString()}). Narrow the period or branch and try again.`,
      });
    }

    const rows = await model.fetchRows(f, model.EXPORT_LIMIT, 0);
    const csv = toCsv(
      ['Order #', 'Date', 'Time', 'Branch', 'Cashier', 'Customer', 'Order type', 'Table', 'Guests', 'Payment', 'Total (PHP)',
      'VATable sales', 'VAT 12%', 'VAT-exempt sales', 'PWD discount'],
      rows.map((r) => {
        const at = new Date(r.transaction_at);
        return [
          `TXN-${String(r.transaction_id).padStart(4, '0')}`,
          at.toLocaleDateString('en-CA', { timeZone: TZ }),
          at.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
          r.branch_name, r.cashier_name, r.customer_name, r.order_type,
          r.table_number, r.guest_count, r.payment_method, r.total_amount.toFixed(2),
          peso(r.vatable_sales), peso(r.vat_amount), peso(r.vat_exempt_sales), peso(r.pwd_discount),
        ];
      })
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${f.from}_to_${f.to}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
}

module.exports = { list, summary, trend, exportCsv };