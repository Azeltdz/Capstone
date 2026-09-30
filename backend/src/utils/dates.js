const TZ = 'Asia/Manila';

const manilaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });

function shiftDate(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateRange(start, end) {
  const out = [];
  for (let d = start; d <= end; d = shiftDate(d, 1)) out.push(d);
  return out;
}

function monthRange(startMonth, endMonth) {
  const out = [];
  let [y, m] = startMonth.split('-').map(Number);
  const [endY, endM] = endMonth.split('-').map(Number);
  while (y < endY || (y === endY && m <= endM)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

module.exports = { TZ, manilaToday, shiftDate, dateRange, monthRange };