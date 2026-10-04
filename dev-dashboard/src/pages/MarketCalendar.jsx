import React, { useMemo, useState } from 'react';
import { PageHeader, Kpi, Loading, ErrorBanner, DataTable, StatusPill, EmptyState, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';
import { dayMonthShort } from '../lib/format.js';

const iso = (d) => d.toISOString().slice(0, 10);

function startOfMonth(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function monthEnd(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function statusTone(status) {
  if (status === 'trading') return 'ok';
  if (status === 'half_day') return 'warn';
  return 'unknown';
}

/**
 * Month grid. Leading blanks align the first day to its weekday column so the
 * layout matches a real calendar rather than sliding the 1st to the left.
 */
function MonthGrid({ days, monthStart, monthEndDate, today }) {
  const byDate = useMemo(
    () => Object.fromEntries(days.map((d) => [d.date, d])),
    [days]
  );

  // getUTCDay() is Sunday-first; the grid is Monday-first.
  const firstDow = (monthStart.getUTCDay() + 6) % 7;
  const totalDays = monthEndDate.getUTCDate();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) {
    const key = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push(byDate[key] || { date: key, status: 'trading', label: 'Trading day', reason: null, exact: true });
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} className="muted" style={{ fontSize: 11, textAlign: 'center' }}>
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((day, i) =>
          day ? (
            <div
              key={day.date}
              title={`${day.reason || 'Trading day'}${day.exact === false ? ' (approximate)' : ''}`}
              style={{
                padding: '8px 6px',
                borderRadius: 8,
                border: `1px solid ${day.date === today ? 'var(--accent)' : 'var(--border)'}`,
                background: day.isTradingDay ? 'var(--surface-2)' : 'transparent',
                opacity: day.isTradingDay ? 1 : 0.65,
                minHeight: 54,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {Number(day.date.slice(8))}
              </div>
              <div style={{ fontSize: 10, marginTop: 2, lineHeight: 1.3 }}>
                {day.isTradingDay ? (
                  <span className="badge ok">Open</span>
                ) : (
                  <span className="badge">{day.label}</span>
                )}
              </div>
            </div>
          ) : (
            <div key={`blank-${i}`} aria-hidden="true" />
          )
        )}
      </div>
    </div>
  );
}

export default function MarketCalendar() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });

  const from = iso(startOfMonth(month));
  const to = iso(monthEnd(month));
  const today = iso(new Date());

  const calendar = useAsyncData(
    () => api.get(`/api/metrics/calendar?from=${from}&to=${to}`),
    [from, to]
  );
  const todayStatus = useAsyncData(() => api.get('/api/metrics/calendar/today'), []);

  const data = calendar.data && calendar.data.data;
  const summary = data && data.summary;
  const current = todayStatus.data && todayStatus.data.data;

  function shiftMonth(delta) {
    setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + delta, 1)));
  }

  const closures = (data && data.days ? data.days : []).filter((d) => !d.isTradingDay);

  return (
    <div>
      <PageHeader
        title="Market calendar"
        subtitle="Which days the Kanchipuram silk bazaar actually traded. Metrics across the console use this to avoid reading a closed market as a business collapse."
        actions={
          <>
            <button className="secondary" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              ←
            </button>
            <strong style={{ minWidth: 120, textAlign: 'center' }}>
              {month.toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </strong>
            <button className="secondary" onClick={() => shiftMonth(1)} aria-label="Next month">
              →
            </button>
          </>
        }
      />

      <ErrorBanner error={calendar.error} onRetry={calendar.refresh} />

      {current && (
        <div className="grid-4">
          <Kpi
            label="Today"
            value={current.today.isTradingDay ? 'Open' : 'Closed'}
            sub={current.today.reason || 'Trading day'}
            tone={current.today.isTradingDay ? 'ok' : 'warn'}
          />
          <Kpi
            label="Next trading day"
            value={current.nextTradingDay ? dayMonthShort(current.nextTradingDay.date) : '—'}
            sub={current.nextTradingDay ? current.nextTradingDay.date : 'none in the next 14 days'}
          />
          <Kpi
            label="Trading days this month"
            value={summary ? summary.trading : '—'}
            sub={summary ? `of ${summary.total} calendar days` : '—'}
          />
          <Kpi
            label="Closures this month"
            value={summary ? summary.closed : '—'}
            sub={summary && summary.closed ? 'excluded from daily averages' : 'no closures'}
          />
        </div>
      )}

      {calendar.loading && <Loading rows={4} />}

      {data && (
        <>
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Month view</h3>
            <MonthGrid days={data.days} monthStart={startOfMonth(month)} monthEndDate={monthEnd(month)} today={today} />
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Closures</h3>
            {closures.length ? (
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', width: 120, render: (r) => <span className="mono">{r.date}</span> },
                  { key: 'status', label: 'Type', width: 120, render: (r) => <StatusPill status={statusTone(r.status)} mini /> },
                  { key: 'label', label: 'Reason', render: (r) => r.label },
                  {
                    key: 'accuracy',
                    label: 'Accuracy',
                    width: 120,
                    render: (r) => (
                      <span className="badge" title={
                        r.exact === false
                          ? 'Derived from a recurring rule; the Gregorian date shifts each year'
                          : 'Exact date'
                      }>
                        {r.exact === false ? 'approx' : 'exact'}
                      </span>
                    ),
                  },
                ]}
                rows={closures}
                keyField="date"
              />
            ) : (
              <EmptyState
                art="calendar"
                title="No closures this month"
                hint="Every day in this month was a trading day apart from the usual weekly offs."
              />
            )}
          </div>

          {data.coverage && data.coverage.exact === false && (
            <div className="card" style={{ marginTop: 16, borderLeft: '3px solid var(--warn)' }}>
              <h3 style={{ marginTop: 0 }}>Festival dates for {data.coverage.year} are approximate</h3>
              <p style={{ marginBottom: 0 }}>
                Tamil-calendar festivals shift every year, and exact dates are confirmed only for{' '}
                <strong>{(data.coverage.exactYears || []).join(', ') || 'no years yet'}</strong>. Dates
                outside those years are derived from recurring rules, so a festival closure may fall on
                the wrong day. Add the year&rsquo;s overrides to the calendar module before relying on
                them for trading decisions.
              </p>
            </div>
          )}

          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            Dates marked <strong>approx</strong> come from recurring rules because Tamil-calendar
            festivals shift each year. Exact dates are listed in the calendar module and can be
            overridden per year.
          </p>
        </>
      )}
    </div>
  );
}
