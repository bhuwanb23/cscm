export function parsePrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const m = String(priceStr).replace(/[^0-9.]/g, '');
  return parseFloat(m) || 0;
}
