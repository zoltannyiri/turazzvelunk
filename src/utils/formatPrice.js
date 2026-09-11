const priceFormatter = new Intl.NumberFormat('hu-HU', {
  useGrouping: true,
  maximumFractionDigits: 0
});

export const formatPrice = (value) => {
  const numericValue = Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? Math.round(numericValue) : 0;

  return priceFormatter.format(safeValue).replace(/[\u00a0\u202f]/g, ' ');
};

export const parsePriceInput = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0;

  const str = String(value).trim();
  if (!str) return 0;

  // Handle database decimal strings like "1500000.00" or "20.00"
  if (/^\d+\.\d+$/.test(str)) {
    const num = parseFloat(str);
    return Number.isFinite(num) ? Math.round(num) : 0;
  }

  // Handle user input with spaces or currency text (e.g. "1 500 000")
  const digits = str.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

export const formatPriceInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  return formatPrice(parsePriceInput(value));
};
