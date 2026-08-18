const priceFormatter = new Intl.NumberFormat('hu-HU', {
  useGrouping: true,
  maximumFractionDigits: 2
});

export const formatPrice = (value) => {
  const numericValue = Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  return priceFormatter.format(safeValue).replace(/[\u00a0\u202f]/g, ' ');
};

export const parsePriceInput = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

export const formatPriceInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  return formatPrice(parsePriceInput(value));
};
