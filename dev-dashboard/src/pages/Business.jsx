import React, { Suspense, lazy, useMemo, useState } from 'react';
import { PageHeader, Kpi, Loading, ErrorBanner, EmptyState, StatusPill, DataTable, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';
import { inr as inrExact, num, compactINR, dateTime, dayMonthShort } from '../lib/format.js';

/**
 * recharts is ~420KB raw, so the chart surfaces load on demand exactly as the
 * revenue page does rather than shipping in the entry chunk.
 */
const TrendChart = lazy(() =>
  import('../components/charts.jsx').then((m) => ({ default: m.TrendChart }))
);
const RankBars = lazy(() =>
  import('../components/charts.jsx').then((m) => ({ default: m.RankBars }))
);

function ChartFallback({ height }) {
  return <div className="chart" style={{ height }} aria-hidden="true" />;
}

/** Percentage from basis points, or an em dash when it could not be measured. */
function pct(basisPoints) {
  if (basisPoints == null || !Number.isFinite(basisPoints)) return '—';
  return `${(basisPoints / 100).toFixed(1)}%`;
}

const iso = (d) => d.toISOString().slice(0, 10);

/**
 * Default to the last 30 days ending today. This used to be pinned to a
 * hardcoded September date, so the page silently showed a stale month.
 */
function defaultWindow() {
  const to = new Date();
  const from = new Date(to.getTime() - 29 * 86400000);
  return { from: iso(from), to: iso(to) };
}

/**
 * Explains a dip instead of letting it be misread.
 *
 * A closed market and a collapsing business both render as "zero" on a chart.
 * When the market was shut, that is not lost business - it is a day that was
 * never open - so it gets its own banner rather than a silent zero.
 */
function MarketNotice({ market, onJumpToCalendar }) {
  if (!market || !market.closedDays) return null;
  const closures = market.closures || [];
  if (!closures.length) return null;

  return (
    <div className="card" style={{ borderLeft: '3px solid var(--warn)', marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Market closures in this window</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        {market.label}. {closures.length} day{closures.length === 1 ? '' : 's'} in this window the
        bazaar was shut, so those days carry no trade. Daily figures below are measured per trading
        day, and closed days appear as gaps in the charts rather than as zero revenue.
      </p>
      <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
        {closures.slice(0, 8).map((c) => (
          <li key={c.date} className="muted" style={{ fontSize: 12 }}>
            <span className="mono">{c.date}</span> — {c.reason}
            {!c.exact && (
              <span className="badge" title="Derived from a recurring rule, not an exact date">
                approx
              </span>
            )}
          </li>
        ))}
        {closures.length > 8 && (
          <li className="muted" style={{ fontSize: 12 }}>+{closures.length - 8} more</li>
        )}
      </ul>
      {onJumpToCalendar && (
        <button className="secondary" style={{ marginTop: 10 }} onClick={onJumpToCalendar}>
          Open market calendar
        </button>
      )}
    </div>
  );
}

/**
 * Daily GMV split into trading and closed days.
 *
 * recharts connects adjacent points, which would draw a misleading slope from
 * the last trading day straight to the next one across a closure. Converting
 * closed days to null breaks the line so the gap is visible.
 */
function splitByMarket(days, field) {
  return (days || []).map((d) => ({
    date: d.date,
    trading: d.isTradingDay ? Number(d[field]) || 0 : null,
    closed: d.isTradingDay ? null : 0,
  }));
}

export default function Business() {
  const [win, setWin] = useState(defaultWindow);

  const q = `from=${win.from}&to=${win.to}`;
  const metrics = useAsyncData(() => api.get(`/api/metrics/summary?${q}`), [win.from, win.to]);

  const m = metrics.data && metrics.data.data;
  const market = m && m.market;

  const gmvSeries = useMemo(
    () => splitByMarket(m && m.series.dailyGmv, 'gmv'),
    [m]
  );

  const storeRank = useMemo(() => {
    if (!m || !m.concentration) return [];
    return m.concentration.storeRank.map((s) => ({
      label: s.storeId,
      value: s.amount,
      share: s.sharePct,
    }));
  }, [m]);

  const skuRank = useMemo(() => {
    if (!m || !m.concentration) return [];
    return (m.concentration.skuRank || []).slice(0, 8).map((s) => ({
      label: s.productId,
      value: s.units,
    }));
  }, [m]);

  function shiftWindow(deltaDays) {
    setWin((w) => {
      const to = new Date(w.to);
      const from = new Date(w.from);
      to.setDate(to.getDate() + deltaDays);
      from.setDate(from.getDate() + deltaDays);
      return { from: iso(from), to: iso(to) };
    });
  }

  return (
    <div>
      <PageHeader
        title="Business"
        subtitle="Operational metrics for the silk trade — GMV, fulfilment, inventory and delivery, measured per trading day so a market closure never reads as lost business."
        actions={
          <>
            <input
              type="date"
              value={win.from}
              max={win.to}
              onChange={(e) => setWin((w) => ({ ...w, from: e.target.value }))}
            />
            <input
              type="date"
              value={win.to}
              min={win.from}
              max={iso(new Date())}
              onChange={(e) => setWin((w) => ({ ...w, to: e.target.value }))}
            />
            <button className="secondary" onClick={() => shiftWindow(-7)} aria-label="Previous week">
              −7d
            </button>
            <button className="secondary" onClick={metrics.refresh}>
              Reload
            </button>
            <button className="secondary" onClick={() => shiftWindow(7)} aria-label="Next week">
              +7d
            </button>
          </>
        }
      />

      <ErrorBanner error={metrics.error} onRetry={metrics.refresh} />

      {metrics.loading && <Loading rows={6} />}

      {m && (
        <>
          <div className="grid-4">
            <Kpi
              label="GMV"
              value={compactINR(m.volume.gmv)}
              sub={`${inrExact(m.volume.gmvPerTradingDay, true)} per trading day`}
            />
            <Kpi
              label="Orders"
              value={num(m.volume.orders)}
              sub={`${m.volume.ordersPerTradingDay} per trading day`}
            />
            <Kpi
              label="Average order"
              value={inrExact(m.volume.aov, true)}
              sub={`${num(m.volume.unitsSold)} units · ${m.volume.unitsPerOrder}/order`}
            />
            <Kpi
              label="Active stores"
              value={num(m.volume.activeStores)}
              sub={m.fulfilment.wholesaleSharePct != null
                ? `${m.fulfilment.wholesaleSharePct}% wholesale`
                : 'no wholesale orders'}
            />
          </div>

          {market && (
            <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
              Window {win.from} to {win.to} · {market.label}
            </p>
          )}

          <MarketNotice market={market} />

          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h3>GMV per trading day</h3>
              {gmvSeries.length ? (
                <Suspense fallback={<ChartFallback height={240} />}>
                  <TrendChart
                    data={gmvSeries}
                    height={240}
                    series={[{ key: 'trading', colour: 'var(--accent)', label: 'GMV (trading days)' }]}
                    formatX={dayMonthShort}
                  />
                </Suspense>
              ) : (
                <EmptyState art="chart" title="No GMV in this window" hint="Try a wider window." />
              )}
              <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
                Closed-market days are plotted as gaps, not as zero, so a festival week is not
                mistaken for a collapse in trade.
              </p>
            </div>

            <div className="card">
              <h3>GMV by store</h3>
              {storeRank.length ? (
                <Suspense fallback={<ChartFallback height={200} />}>
                  <RankBars data={storeRank} valueKey="value" labelKey="label" formatX={compactINR} />
                </Suspense>
              ) : (
                <EmptyState art="briefcase" title="No store revenue yet" hint="Orders appear here once stores trade." />
              )}
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h3>Inventory</h3>
              <DataTable
                columns={[
                  { key: 'lines', label: 'Stock lines', align: 'num' },
                  { key: 'stockValue', label: 'Stock value', align: 'num', render: (r) => inrExact(r.stockValue, true) },
                  {
                    key: 'stockoutRate',
                    label: 'Stockout rate',
                    align: 'num',
                    render: (r) => pct(r.stockoutRateBps),
                  },
                  {
                    key: 'belowReorder',
                    label: 'Below reorder',
                    align: 'num',
                    render: (r) => pct(r.belowReorderRateBps),
                  },
                  {
                    key: 'turns',
                    label: 'Turns',
                    align: 'num',
                    // null means "cannot be measured with no stock value",
                    // which is different from a measured zero.
                    render: (r) => (r.turns == null ? '—' : r.turns),
                  },
                ]}
                rows={[m.inventory]}
                keyField="lines"
              />
            </div>

            <div className="card">
              <h3>Delivery</h3>
              <DataTable
                columns={[
                  { key: 'shipments', label: 'Shipments', align: 'num' },
                  { key: 'delivered', label: 'Delivered', align: 'num' },
                  { key: 'late', label: 'Late', align: 'num' },
                  {
                    key: 'onTimeRate',
                    label: 'On time',
                    align: 'num',
                    render: (r) => pct(r.onTimeRateBps),
                  },
                  {
                    key: 'avgTransitHours',
                    label: 'Avg transit',
                    align: 'num',
                    render: (r) => (r.avgTransitHours == null ? '—' : `${r.avgTransitHours}h`),
                  },
                ]}
                rows={[m.delivery]}
                keyField="shipments"
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h3>Order status mix</h3>
              <DataTable
                columns={[
                  { key: 'status', label: 'Status' },
                  { key: 'count', label: 'Orders', align: 'num' },
                  {
                    key: 'share',
                    label: 'Share',
                    align: 'num',
                    render: (r) =>
                      m.volume.orders ? `${((r.count / m.volume.orders) * 100).toFixed(1)}%` : '—',
                  },
                ]}
                rows={Object.entries(m.fulfilment.statusMix || {}).map(([status, count]) => ({
                  id: status,
                  status,
                  count,
                }))}
                keyField="id"
              />
            </div>

            <div className="card">
              <h3>Top SKUs by units</h3>
              {skuRank.length ? (
                <Suspense fallback={<ChartFallback height={200} />}>
                  <RankBars data={skuRank} valueKey="value" labelKey="label" formatX={num} />
                </Suspense>
              ) : (
                <EmptyState art="package" title="No line items yet" hint="SKU rankings need order line items." />
              )}
            </div>
          </div>

          {m.concentration.topStore && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Concentration risk</h3>
              <p style={{ margin: 0 }}>
                <strong>{m.concentration.topStore.storeId}</strong> accounts for{' '}
                <strong>{pct(m.concentration.topStore.shareBps)}</strong> of GMV in this window
                {m.concentration.topStore.shareBps != null && m.concentration.topStore.shareBps >= 5000
                  ? ' — over half the business rests on a single house, which is fragile.'
                  : '.'}
              </p>
            </div>
          )}
        </>
      )}

      {!metrics.loading && !metrics.error && !m && (
        <EmptyState
          art="chart"
          title="No business metrics available"
          hint="Metrics need the PostgreSQL driver. Check that DATABASE_URL is configured."
        />
      )}
    </div>
  );
}
