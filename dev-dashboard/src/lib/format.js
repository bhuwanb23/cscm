/**
 * Display formatters for dense tables.
 *
 * Raw values are unreadable at a glance: `1590.27` and
 * `2026-09-30T16:56:00.000Z` force the eye to decode them, which is what makes
 * a wide table feel cluttered. These render the value the way an operator
 * reads it, and keep the column width narrow.
 */

const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrPreciseFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numFmt = new Intl.NumberFormat('en-IN');

/** 1590.27 -> ₹1,590 */
export function inr(value, precise = false) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return (precise ? inrPreciseFmt : inrFmt).format(n);
}

/** 1234567 -> 12,34,567 (Indian grouping) */
export function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? numFmt.format(n) : '—';
}

/** Compact magnitude for axis ticks: 3329215 -> 33.3L */
export function compactINR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`;
  return `₹${n.toFixed(0)}`;
}

function toDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const dayMonth = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });
const dayMonthTime = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * 2026-09-30T16:56:00.000Z -> 30 Sep, 16:56
 * Returns an em dash for anything unparseable rather than printing "Invalid Date".
 */
export function dateTime(value) {
  const d = toDate(value);
  return d ? dayMonthTime.format(d) : '—';
}

/** 2026-09-30T16:56:00.000Z -> 30 Sep */
export function dayMonthShort(value) {
  const d = toDate(value);
  return d ? dayMonth.format(d) : '—';
}

/** Seconds-since-epoch helper for relative labels such as "4m ago". */
export function relative(value) {
  const d = toDate(value);
  if (!d) return '—';
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return `${Math.max(0, secs)}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  return `${Math.round(secs / 86400)}d ago`;
}

/** Middle-ellipsis a long identifier, keeping both ends readable. */
export function midTruncate(text, max = 28) {
  const s = String(text ?? '');
  if (s.length <= max) return s;
  const keep = Math.floor((max - 1) / 2);
  return `${s.slice(0, keep)}…${s.slice(-keep)}`;
}
