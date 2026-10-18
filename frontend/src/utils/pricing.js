// src/utils/pricing.js
export const VAT_RATE = 0.12;
export const PWD_DISCOUNT_RATE = 0.2;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcOrderTotals(lines, { pwdEnabled = false } = {}) {
  let regularGross = 0;
  let pwdGross = 0;
  let itemCount = 0;

  for (const line of lines) {
    const gross = Number(line.price) * line.qty;
    itemCount += line.qty;
    if (pwdEnabled && line.pwd !== false) pwdGross += gross;
    else regularGross += gross;
  }

  const vatableSales = round2(regularGross / (1 + VAT_RATE));
  const vatAmount = round2(regularGross - vatableSales);
  const vatExemptSales = round2(pwdGross / (1 + VAT_RATE));
  const vatExemption = round2(pwdGross - vatExemptSales);
  const pwdDiscount = round2(vatExemptSales * PWD_DISCOUNT_RATE);
  const subtotal = round2(regularGross + pwdGross);
  const total = round2(regularGross + vatExemptSales - pwdDiscount);

  return { itemCount, subtotal, vatableSales, vatAmount, vatExemptSales, vatExemption, pwdDiscount, total };
}