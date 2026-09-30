function cell(value) {
  if (value === null || value === undefined) return '""';
  let s = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(header, rows) {
  const lines = [header, ...rows].map((r) => r.map(cell).join(','));
  return '\uFEFF' + lines.join('\r\n') + '\r\n'; // BOM so Excel reads the file as UTF-8
}

module.exports = { toCsv };