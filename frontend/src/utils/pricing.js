export const VAT_RATE = 0.12;
export const PWD_DISCOUNT_RATE = 0.2;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Work in whole centavos when comparing or subtracting money, so 0.1 + 0.2 never bites.
export const toCents = (n) => Math.round((Number(n) + Number.EPSILON) * 100);
export const calcChange = (tendered, total) => (toCents(tendered) - toCents(total)) / 100;

// lines: [{ price, qty, pwd }]. pwd === true means the PWD eats that line.
export function calcOrderTotals(lines) {
  let regularGross = 0;
  let pwdGross = 0;
  for (const l of lines) {
    const gross = Number(l.price) * l.qty;
    if (l.pwd) pwdGross += gross;
    else regularGross += gross;
  }
  const vatableSales = round2(regularGross / (1 + VAT_RATE));
  const vatAmount = round2(regularGross - vatableSales);
  const vatExemptSales = round2(pwdGross / (1 + VAT_RATE));
  const pwdDiscount = round2(vatExemptSales * PWD_DISCOUNT_RATE);
  const subtotal = round2(regularGross + pwdGross);
  const total = round2(regularGross + vatExemptSales - pwdDiscount);
  return {
    subtotal,
    vatableSales,
    vatAmount,
    vatExemptSales,
    pwdDiscount,
    vatExemption: round2(pwdGross - vatExemptSales), // the VAT taken off the PWD's food
    total,
  };
}

export function cashSuggestions(total, max = 4) {
  const t = toCents(total);
  if (!(t > 0)) return [];
  const out = new Set();
  for (const d of [2000, 5000, 10000, 20000, 50000, 100000]) {
    const v = Math.ceil(t / d) * d;
    if (v > t) out.add(v);
  }
  return [...out].sort((a, b) => a - b).slice(0, max).map((c) => c / 100);
}