const VAT_RATE = 0.12;
const PWD_DISCOUNT_RATE = 0.2;
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// lines: [{ price, qty, pwd }]  where pwd === true means "PWD item"
function calcOrderTotals(lines) {
  let regularGross = 0, pwdGross = 0;
  for (const l of lines) {
    const gross = Number(l.price) * l.qty;
    if (l.pwd) pwdGross += gross; else regularGross += gross;
  }
  const vatableSales = round2(regularGross / (1 + VAT_RATE));
  const vatAmount = round2(regularGross - vatableSales);
  const vatExemptSales = round2(pwdGross / (1 + VAT_RATE));
  const pwdDiscount = round2(vatExemptSales * PWD_DISCOUNT_RATE);
  return {
    subtotal: round2(regularGross + pwdGross),
    vatableSales, vatAmount, vatExemptSales, pwdDiscount,
    total: round2(regularGross + vatExemptSales - pwdDiscount),
  };
}
module.exports = { calcOrderTotals, VAT_RATE, PWD_DISCOUNT_RATE };