const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const pesoWhole = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export const formatPeso = (n) => peso.format(Number(n) || 0);
export const formatPesoWhole = (n) => pesoWhole.format(Number(n) || 0);