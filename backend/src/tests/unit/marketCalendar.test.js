/**
 * Market calendar tests.
 *
 * These guard the specific defect that made the dashboard lie: a closed
 * market and a collapsed business both rendered as "revenue 0". The
 * classification must therefore distinguish them, and the trading-day count
 * must be usable as an honest denominator.
 */

const {
  STATUS,
  resolve,
  isTradingDay,
  range,
  tradingDayCount,
  closedDays,
  annotateSeries,
  describeWindow,
} = require('../../domain/marketCalendar');

describe('marketCalendar.resolve', () => {
  it('classifies an ordinary weekday as a trading day', () => {
    // 2026-09-01 is a Tuesday.
    const day = resolve('2026-09-01');
    expect(day.status).toBe(STATUS.TRADING);
    expect(day.isTradingDay).toBe(true);
    expect(day.reason).toBeNull();
  });

  it('classifies Sunday as the weekly market off', () => {
    // 2026-09-06 is a Sunday.
    const day = resolve('2026-09-06');
    expect(day.status).toBe(STATUS.WEEKLY_OFF);
    expect(day.isTradingDay).toBe(false);
    expect(day.reason).toMatch(/Sunday/);
  });

  it('keeps Saturday a trading day (the bazaar runs Saturday)', () => {
    // 2026-09-05 is a Saturday.
    expect(resolve('2026-09-05').isTradingDay).toBe(true);
  });

  it('closes the market on a fixed national holiday', () => {
    const day = resolve('2026-08-15'); // Independence Day
    expect(day.isTradingDay).toBe(false);
    expect(day.label).toBe('Independence Day');
  });

  it('uses the exact Pongal date from overrides for 2026', () => {
    // Pongal 2026 falls on 14 Jan, not the rule's approximate 15 Jan.
    const day = resolve('2026-01-14');
    expect(day.isTradingDay).toBe(false);
    expect(day.label).toBe('Pongal');
    expect(day.exact).toBe(true);
  });

  it('marks a continued festival day as SHUT rather than a fresh holiday', () => {
    const day = resolve('2026-01-15');
    expect(day.isTradingDay).toBe(false);
    expect(day.status).toBe(STATUS.SHUT);
    expect(day.reason).toMatch(/continues/);
  });

  it('closes Deepavali for its full span', () => {
    expect(resolve('2026-11-08').isTradingDay).toBe(false);
    expect(resolve('2026-11-09').isTradingDay).toBe(false);
  });

  it('marks rule-derived festival dates as approximate, not exact', () => {
    // 2027 has no overrides, so Pongal falls back to the rule.
    const day = resolve('2027-01-15');
    expect(day.isTradingDay).toBe(false);
    expect(day.exact).toBe(false);
    expect(day.kind).toBe('festival');
  });

  it('accepts a JS Date as well as a string', () => {
    expect(resolve(new Date('2026-09-01T00:00:00Z')).isTradingDay).toBe(true);
  });

  it('rejects an unparseable date rather than silently returning a day', () => {
    expect(() => resolve('not-a-date')).toThrow(/Invalid date/);
  });
});

describe('marketCalendar.isTradingDay', () => {
  it('distinguishes a closed market from an open one', () => {
    expect(isTradingDay('2026-09-01')).toBe(true);
    expect(isTradingDay('2026-09-06')).toBe(false);
  });
});

describe('marketCalendar.range', () => {
  it('covers every calendar day inclusively', () => {
    const days = range('2026-09-01', '2026-09-07');
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe('2026-09-01');
    expect(days[6].date).toBe('2026-09-07');
  });

  it('returns an empty array when from is after to', () => {
    expect(range('2026-09-07', '2026-09-01')).toEqual([]);
  });

  it('crosses a month boundary correctly', () => {
    const days = range('2026-08-31', '2026-09-02');
    expect(days.map((d) => d.date)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
    ]);
  });
});

describe('marketCalendar trading-day counting', () => {
  it('counts only days the market actually traded', () => {
    // 2026-09-01 (Tue) .. 2026-09-07 (Mon) is one full week: 6 trading days.
    expect(tradingDayCount('2026-09-01', '2026-09-07')).toBe(6);
  });

  it('excludes a festival span from the trading-day denominator', () => {
    // Deepavali 8-9 Nov 2026 shut the market; neither day may count.
    const withFestival = tradingDayCount('2026-11-02', '2026-11-08');
    const withoutFestival = tradingDayCount('2026-11-02', '2026-11-07');
    expect(withFestival).toBe(withoutFestival);
  });

  it('lists the closed days so the UI can explain a dip', () => {
    const shut = closedDays('2026-11-02', '2026-11-09');
    const festivalDays = shut.filter((d) => d.kind === 'festival').map((d) => d.date);
    expect(festivalDays).toEqual(['2026-11-08', '2026-11-09']);
  });
});

describe('marketCalendar.annotateSeries', () => {
  it('flags closed days in a dense zero-filled series', () => {
    // This is the exact shape revenueService produces: every day present,
    // closed days carrying a zero amount.
    const dense = [
      { date: '2026-11-06', amount: 42000 },
      { date: '2026-11-07', amount: 39000 },
      { date: '2026-11-08', amount: 0 },
      { date: '2026-11-09', amount: 0 },
      { date: '2026-11-10', amount: 45000 },
    ];
    const annotated = annotateSeries(dense);

    expect(annotated).toHaveLength(5);
    expect(annotated[0].isTradingDay).toBe(true);
    expect(annotated[2].isTradingDay).toBe(false);
    expect(annotated[2].marketStatus).toBe(STATUS.HOLIDAY);
    expect(annotated[4].isTradingDay).toBe(true);
  });

  it('does not mutate the input series', () => {
    const dense = [{ date: '2026-11-08', amount: 0 }];
    annotateSeries(dense);
    expect(dense[0].isTradingDay).toBeUndefined();
  });

  it('tolerates an empty or missing series', () => {
    expect(annotateSeries([])).toEqual([]);
    expect(annotateSeries(undefined)).toEqual([]);
  });
});

describe('marketCalendar.describeWindow', () => {
  it('summarises a window for a KPI sub-label', () => {
    const summary = describeWindow('2026-09-01', '2026-09-07');
    expect(summary.total).toBe(7);
    expect(summary.trading).toBe(6);
    expect(summary.closed).toBe(1);
    expect(summary.label).toBe('6 trading days');
  });
});
