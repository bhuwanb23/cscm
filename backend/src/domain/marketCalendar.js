/**
 * Market calendar for the Kanchipuram silk trade.
 *
 * WHY THIS EXISTS
 * ---------------
 * Metrics that average over "a month" are wrong unless the month is measured
 * against the days the market actually traded. revenueService.dailySeries()
 * dense-fills every calendar day, so a Deepavali week with the bazaar shut
 * renders as revenue 0 -- visually identical to a business collapse, and it
 * drags every average down. This module is the single authority on which days
 * counted, so both the backend metrics and the dashboard can agree.
 *
 * ACCURACY AND ITS LIMITS
 * -----------------------
 * Pongal and Deepavali follow the Tamil calendar, so their Gregorian dates
 * shift year to year. Rather than hardcode a table that silently rots, the
 * recurring rules below derive approximate dates, and OVERRIDES holds the
 * exact dates for years where they are known. `resolve()` prefers an override
 * when one exists. Dates taken from a rule are marked `exact: false` so the
 * UI can show them as approximate rather than presenting a guess as fact.
 *
 * This is deliberately NOT an exchange calendar. NSE/BSE closures are
 * irrelevant to a handloom silk wholesaler; what matters is the local bazaar,
 * the weavers' working calendar and the state holidays.
 */

/** Day classifications. */
const STATUS = {
  TRADING: 'trading', // Market open, full trading
  HALF_DAY: 'half_day', // Open but curtailed (festival eve, last market day)
  HOLIDAY: 'holiday', // Public holiday, market shut
  WEEKLY_OFF: 'weekly_off', // Sunday / weekly closing
  SHUT: 'shut', // Festival or seasonal closure spanning days
};

/**
 * Recurring national + Tamil Nadu holidays, by month-day.
 * These are fixed-date observances and do not drift.
 */
const FIXED_HOLIDAYS = {
  '01-01': "New Year's Day",
  '01-26': 'Republic Day',
  '05-01': 'Labour Day',
  '08-15': 'Independence Day',
  '10-02': 'Gandhi Jayanti',
  '12-25': 'Christmas',
};

/** Sunday is the weekly market off. Saturday trades (bazaar runs half day). */
const WEEKLY_OFF_DAYS = new Set([0]); // getUTCDay(): 0 = Sunday

/**
 * Approximate drifting-festival rules.
 * Each returns the month/day for a given year. Kept deliberately small and
 * documented so the approximation is auditable.
 */
const MOVING_RULES = [
  {
    name: 'Pongal',
    // Pongal is the 4th day of the Tamil month Thai; it falls 14-17 January.
    // We anchor on the mid-point and let OVERRIDES correct known years.
    resolve: () => ({ month: 1, day: 15 }),
    duration: 1,
  },
  {
    name: 'Tamil New Year (Puthandu)',
    // Day 1 of Chithirai: 13-16 April.
    resolve: () => ({ month: 4, day: 14 }),
    duration: 1,
  },
  {
    name: 'Deepavali',
    // Kartika 4, roughly late October into early November.
    resolve: () => ({ month: 10, day: 30 }),
    duration: 2,
  },
  {
    name: 'Karthigai Deepam',
    // Krittika nakshatra within the Tamil month Karthigai: mid-Nov to mid-Dec.
    resolve: () => ({ month: 11, day: 24 }),
    duration: 1,
  },
];

/**
 * Exact dates for years where the drifting festivals are known with
 * certainty. Anything here beats the approximate rule above.
 * Format: 'YYYY-MM-DD' -> { name, duration }
 */
const OVERRIDES = {
  // 2026 dates, verified against the Tamil calendar.
  '2026-01-14': { name: 'Pongal', duration: 2 },
  '2026-01-15': { name: 'Pongal', duration: 1, continue: true },
  '2026-04-14': { name: 'Tamil New Year (Puthandu)', duration: 1 },
  '2026-11-08': { name: 'Deepavali', duration: 2 },
  '2026-11-24': { name: 'Karthigai Deepam', duration: 1 },
};

/** Normalise anything date-ish to 'YYYY-MM-DD' in UTC. */
function isoDay(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || '').trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function dayOfWeek(day) {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

function addDays(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Build the moving-festival table for one year, merging approximate rules
 * with exact overrides.
 */
function festivalMap(year) {
  const map = new Map();

  for (const rule of MOVING_RULES) {
    // An override keyed to this year wins over the rule entirely.
    const hasOverride = Object.keys(OVERRIDES).some((k) => k.startsWith(`${year}-`));
    const { month, day } = rule.resolve(year);
    if (hasOverride) continue; // overridden below with exact dates
    const start = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    for (let i = 0; i < rule.duration; i += 1) {
      map.set(addDays(start, i), {
        name: rule.name,
        exact: false,
        approximate: true,
        continue: i > 0,
      });
    }
  }

  // Expand each override across its declared duration. Day 0 is the festival
  // proper; later days are continuations, so the UI can distinguish "Deepavali"
  // from "Deepavali (continues)". A later explicit override for the same day
  // wins, because Object.entries below is applied after this loop.
  for (const [day, info] of Object.entries(OVERRIDES)) {
    if (!day.startsWith(`${year}-`)) continue;
    const span = Math.max(1, Number(info.duration) || 1);
    for (let i = 0; i < span; i += 1) {
      const at = addDays(day, i);
      // An explicitly declared `continue` flag wins over the inferred one,
      // so a hand-tuned override is never overwritten by a later entry's
      // expansion of a different festival.
      const isContinuation = info.continue != null ? !!info.continue : i > 0;
      map.set(at, {
        name: info.name,
        exact: true,
        approximate: false,
        continue: isContinuation,
      });
    }
  }

  return map;
}

/**
 * Classify a single day.
 *
 * Returns:
 *   { date, status, isTradingDay, label, reason, exact, kind }
 */
function resolve(dateLike) {
  const date = isoDay(dateLike);
  if (!date) {
    throw new Error(`Invalid date for market calendar: ${String(dateLike)}`);
  }
  const year = Number(date.slice(0, 4));
  const monthDay = date.slice(5);
  const festivals = festivalMap(year);

  const base = {
    date,
    kind: null,
    label: null,
    exact: true,
    reason: null,
  };

  // Festival closure wins over everything: the bazaar simply does not open.
  const festival = festivals.get(date);
  if (festival) {
    return {
      ...base,
      kind: 'festival',
      status: festival.continue ? STATUS.SHUT : STATUS.HOLIDAY,
      isTradingDay: false,
      label: festival.name,
      exact: festival.exact,
      reason: festival.continue
        ? `${festival.name} (continues)`
        : `${festival.name} — market closed`,
    };
  }

  const fixed = FIXED_HOLIDAYS[monthDay];
  if (fixed) {
    return {
      ...base,
      kind: 'public_holiday',
      status: STATUS.HOLIDAY,
      isTradingDay: false,
      label: fixed,
      reason: `${fixed} — public holiday`,
    };
  }

  if (WEEKLY_OFF_DAYS.has(dayOfWeek(date))) {
    return {
      ...base,
      kind: 'weekly_off',
      status: STATUS.WEEKLY_OFF,
      isTradingDay: false,
      label: 'Weekly market off',
      reason: 'Sunday — bazaar closed',
    };
  }

  return {
    ...base,
    kind: 'trading',
    status: STATUS.TRADING,
    isTradingDay: true,
    label: 'Trading day',
    reason: null,
  };
}

/** True when the market traded on this day. */
function isTradingDay(dateLike) {
  return resolve(dateLike).isTradingDay;
}

/**
 * Every day in [from, to] inclusive. Used to dense-fill metric series so a
 * closed day is present but flagged, rather than silently absent or zeroed.
 */
function range(from, to) {
  const start = isoDay(from);
  const end = isoDay(to);
  if (!start || !end) throw new Error('range() requires valid from/to dates');
  if (start > end) return [];

  const out = [];
  let cursor = start;
  // Guard against a runaway loop if a caller passes absurd dates.
  for (let i = 0; i < 3660; i += 1) {
    out.push(resolve(cursor));
    if (cursor === end) break;
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** Count of trading days in a window. The correct denominator for averages. */
function tradingDayCount(from, to) {
  return range(from, to).filter((d) => d.isTradingDay).length;
}

/**
 * Closed days inside a window, for the "3 days the market was shut" note that
 * stops a festival dip being read as a business collapse.
 */
function closedDays(from, to) {
  return range(from, to).filter((d) => !d.isTradingDay);
}

/**
 * Annotate a dense day series with trading-day flags, so the chart can render
 * closed days differently instead of plotting them as zero revenue.
 *
 * `days` is an array of { date, ... }. Returns a new array; input untouched.
 */
function annotateSeries(days) {
  const out = [];
  for (const entry of days || []) {
    const cal = resolve(entry.date);
    out.push({
      ...entry,
      isTradingDay: cal.isTradingDay,
      marketStatus: cal.status,
      marketLabel: cal.label,
      marketReason: cal.reason,
    });
  }
  return out;
}

/** Human summary of a window, e.g. for a KPI sub-label. */
function describeWindow(from, to) {
  const total = range(from, to).length;
  const trading = total - closedDays(from, to).length;
  if (!total) return { total: 0, trading: 0, closed: 0, label: '—' };
  return {
    total,
    trading,
    closed: total - trading,
    label: `${trading} trading ${trading === 1 ? 'day' : 'days'}`,
  };
}

/**
 * Whether OVERRIDES carries confirmed dates for a given year.
 *
 * Tamil-calendar festivals shift every year, so the override table is
 * populated one year at a time. When the current year has no entries the
 * calendar silently degrades to approximate rules, which is the failure mode
 * that hides best: every date still renders, it is just wrong. Surfacing this
 * lets the UI say so instead of presenting a guess as fact.
 */
function coverageFor(year) {
  const y = Number(year);
  const years = new Set(
    Object.keys(OVERRIDES)
      .map((k) => Number(k.slice(0, 4)))
      .filter(Number.isFinite)
  );
  return {
    year: y,
    exact: years.has(y),
    exactYears: [...years].sort(),
  };
}

/** Coverage report for the year a window sits in, for the staleness banner. */
function coverage(from, to) {
  const start = isoDay(from);
  const end = isoDay(to);
  if (!start || !end) return { year: new Date().getUTCFullYear(), exact: false, exactYears: [] };
  // A window can straddle a year boundary; report the current year, which is
  // what actually decides whether today's dates are trustworthy.
  return coverageFor(new Date().getUTCFullYear());
}

module.exports = {
  STATUS,
  FIXED_HOLIDAYS,
  MOVING_RULES,
  OVERRIDES,
  isoDay,
  resolve,
  isTradingDay,
  range,
  tradingDayCount,
  closedDays,
  annotateSeries,
  describeWindow,
  coverageFor,
  coverage,
};
