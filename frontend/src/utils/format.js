const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const pesoWhole = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export const formatPeso = (n) => peso.format(Number(n) || 0);
export const formatPesoWhole = (n) => pesoWhole.format(Number(n) || 0);
export const formatOrderNumber = (id) => `#TXN-${String(id).padStart(4, "0")}`;

export const ORDER_TYPE_LABELS = { "dine-in": "Dine-in", "take-out": "Take-out", delivery: "Delivery" };

const PAYMENT_LABELS = { cash: "Cash", gcash: "GCash" };
export const paymentLabel = (method) =>
  PAYMENT_LABELS[method] ?? (method ? method[0].toUpperCase() + method.slice(1) : "—");