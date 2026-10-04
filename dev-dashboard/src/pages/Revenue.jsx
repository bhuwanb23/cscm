import React, { Suspense, lazy, useMemo, useState } from 'react';
import { PageHeader, Kpi, Loading, ErrorBanner, DataTable, EmptyState, useAsyncData } from '../components/ui.jsx';
import { Reveal } from '../components/motion.jsx';
import { api } from '../api/client.jsx';
import { inr as inrExact, dateTime } from '../lib/format.js';

/**
 * recharts is ~420KB raw. Only the revenue surface needs it, so it is loaded
 * on demand rather than shipped in the entry chunk — the rest of the console
 * (30+ routes) keeps the small bundle.
 */
const TrendChart = lazy(() =>
  import('../components/charts.jsx').then((m) => ({ default: m.TrendChart }))
);
const BarsChart = lazy(() =>
  import('../components/charts.jsx').then((m) => ({ default: m.BarsChart }))
);
const RankBars = lazy(() =>
  import('../components/charts.jsx').then((m) => ({ default: m.RankBars }))
);
const Donut = lazy(() =>
  import('../components/charts.jsx').then((m) => ({ default: m.Donut }))
);

function ChartFallback({ height }) {
  return <div className="chart" style={{ height }} aria-hidden="true" />;
}

/** Compact INR formatting. Indian digit grouping (lakh/crore) reads naturally here. */
/** Axis/KPI magnitude label: 33.3L rather than 3,329,215. */
function inr(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** Full precision for money that must reconcile exactly. */

const iso = (d) => d.toISOString().slice(0, 10);
const shortDay = (v) => String(v).slice(5); // 09-01

/**
 * Default to the last 30 days ending today.
 *
 * This was pinned to a hardcoded 2026-09-30, which meant the page kept
 * showing September long after it was over - a stale window that looks like
 * plausible data rather than an obvious bug.
 */
function defaultWindow() {
  const to = new Date();
  const from = new Date(to.getTime() - 29 * 86400000);
  return { from: iso(from), to: iso(to) };
}

export default function Revenue() {
  const [win, setWin] = useState(defaultWindow);
  const [kind, setKind] = useState('');

  const q = `from=${win.from}&to=${win.to}`;
  const summary = useAsyncData(() => api.get(`/api/revenue/summary?${q}`), [win.from, win.to]);
  const stores = useAsyncData(() => api.get(`/api/revenue/stores?${q}`), [win.from, win.to]);
  const plans = useAsyncData(() => api.get('/api/revenue/plans'), []);
  const work = useAsyncData(
    () => api.get(`/api/revenue/work?${q}${kind ? `&kind=${kind}` : ''}&limit=200`),
    [win.from, win.to, kind]
  );

  const s = summary.data && summary.data.data;
  const planRows = plans.data && plans.data.data;

  // Daily revenue and commission share an axis so their relative size is honest.
  const dailySeries = useMemo(() => {
    if (!s) return [];
    const subs = new Map(s.dailyRevenue.map((d) => [d.date, d.amount]));
    const comm = new Map(s.dailyCommission.map((d) => [d.date, d.amount]));
    const gmv = new Map(s.dailyGmv.map((d) => [d.date, d.gmv]));
    return s.dailyRevenue.map((d) => ({
      date: d.date,
      subscription: subs.get(d.date) || 0,
      commission: comm.get(d.date) || 0,
      gmv: gmv.get(d.date) || 0,
    }));
  }, [s]);

  const revenueSplit = useMemo(() => {
    if (!s) return [];
    return [
      { name: 'Subscriptions', value: s.subscriptionRevenue },
      { name: 'Commission', value: s.commissionRevenue },
    ].filter((r) => r.value > 0);
  }, [s]);

  const houseRanking = useMemo(() => {
    const rows = stores.data && stores.data.data && stores.data.data.stores;
    if (!rows) return [];
    return rows.map((r) => ({
      label: r.storeId,
      value: r.totalRevenue,
      sub: `${(r.shareBps / 100).toFixed(1)}%`,
    }));
  }, [stores.data]);

  const planMix = useMemo(() => {
    if (!planRows) return [];
    return planRows
      .filter((p) => p.subscribers > 0)
      .map((p) => ({ name: p.name, value: p.subscribers }));
  }, [planRows]);

  const workKinds = useMemo(() => {
    const set = new Set();
    ((work.data && work.data.data && work.data.data.summary) || []).forEach((r) => set.add(r.kind));
    return [...set];
  }, [work.data]);

  const totalWork = useMemo(
    () => ((work.data && work.data.data && work.data.data.summary) || []).reduce((a, r) => a + r.n, 0),
    [work.data]
  );

  const refreshAll = () => {
    summary.refresh();
    stores.refresh();
    work.refresh();
  };

  return (
    <div>
      <PageHeader
        title="Revenue"
        subtitle="SaaS subscriptions plus GMV commission — Kanchipuram silk supply chain"
        actions={
          <div className="row wrap" style={{ gap: 8 }}>
            <input
              type="date"
              value={win.from}
              max={win.to}
              aria-label="From date"
              onChange={(e) => setWin((w) => ({ ...w, from: e.target.value }))}
            />
            <span className="muted">to</span>
            <input
              type="date"
              value={win.to}
              min={win.from}
              aria-label="To date"
              onChange={(e) => setWin((w) => ({ ...w, to: e.target.value }))}
            />
            <button className="secondary" onClick={refreshAll}>Reload</button>
          </div>
        }
      />

      <ErrorBanner error={summary.error} />
      {summary.loading && <Loading rows={4} />}

      {s && (
        <Reveal className="stack">
          <div className="kpi-grid">
            <Kpi label="MRR" value={s.mrr} sub="recurring subscription revenue" tone="good" spark={s.dailyRevenue.map((d) => d.amount)} />
            <Kpi label="ARR run-rate" value={s.arr} sub={`${s.activeSubscriptions} active subscriptions`} tone="good" />
            <Kpi label="GMV processed" value={s.gmv} sub="goods value across all orders" spark={s.dailyGmv.map((d) => d.gmv)} />
            <Kpi label="Platform revenue" value={s.totalRevenue} sub="subscriptions + commission" tone="good" />
          </div>

          <div className="kpi-grid">
            <Kpi label="Subscription revenue" value={s.subscriptionRevenue} sub="collected this window" />
            <Kpi label="Commission revenue" value={s.commissionRevenue} sub={`${(s.grossMarginBps / 100).toFixed(2)}% take rate`} />
            <Kpi label="ARPU" value={s.arpu} sub={`per paying account (${s.payingAccounts})`} />
            <Kpi
              label="Churn"
              value={`${(s.churn.churnRateBps / 100).toFixed(1)}%`}
              sub={`${s.churn.churned} of ${s.churn.base} accounts`}
              tone={s.churn.churnRateBps > 0 ? 'warn' : 'good'}
            />
          </div>

          <div className="card">
            <h3>Revenue over time</h3>
            <p className="muted">
              Collections accrue on each house's billing date; commission is recognised the day an
              order settles. 1–30 September 2026.
            </p>
            <Suspense fallback={<ChartFallback height={260} />}>
              <TrendChart
                data={dailySeries}
                formatX={shortDay}
                height={260}
                series={[
                  { key: 'subscription', name: 'Subscriptions', colour: 'var(--accent)' },
                  { key: 'commission', name: 'Commission', colour: 'var(--cyan)' },
                ]}
              />
            </Suspense>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>GMV per day</h3>
              <p className="muted">Goods value processed across all eight houses.</p>
              <Suspense fallback={<ChartFallback height={220} />}>
                <BarsChart
                  data={dailySeries}
                  formatX={shortDay}
                  height={220}
                  series={[{ key: 'gmv', name: 'GMV', colour: 'var(--violet)' }]}
                />
              </Suspense>
            </div>

            <div className="card">
              <h3>Revenue mix</h3>
              <p className="muted">
                {inr(s.subscriptionRevenue)} subscriptions against {inr(s.commissionRevenue)} commission.
              </p>
              <Suspense fallback={<ChartFallback height={220} />}>
                <Donut data={revenueSplit} height={220} />
              </Suspense>
              <div className="legend">
                {revenueSplit.map((r, i) => (
                  <span className="legend-item" key={r.name}>
                    <span className="legend-swatch" data-i={i} />
                    {r.name}
                    <strong>{inr(r.value)}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {houseRanking.length > 0 && (
            <div className="card">
              <h3>Revenue by house</h3>
              <p className="muted">
                Concentration is a risk, not a success — the top two houses carry{' '}
                {inr(houseRanking.slice(0, 2).reduce((a, r) => a + r.value, 0))} of{' '}
                {inr(stores.data.data.total)}.
              </p>
              <Suspense fallback={<ChartFallback height={houseRanking.length * 30 + 24} />}>
                <RankBars data={houseRanking} />
              </Suspense>
            </div>
          )}
        </Reveal>
      )}

      {planRows && (
        <Reveal className="stack">
          <div className="grid-2">
            <div className="card">
              <h3>Plan mix</h3>
              <p className="muted">{planMix.length} tiers in use across {s ? s.activeSubscriptions : 0} houses.</p>
              <Suspense fallback={<ChartFallback height={200} />}>
                <Donut data={planMix} height={200} />
              </Suspense>
              <div className="legend">
                {planMix.map((r, i) => (
                  <span className="legend-item" key={r.name}>
                    <span className="legend-swatch" data-i={i} />
                    {r.name}
                    <strong>{r.value}</strong>
                  </span>
                ))}
              </div>
            </div>

            <div className="card">
              <h3>Plan economics</h3>
              <DataTable
                columns={[
                  { key: 'name', label: 'Plan' },
                  { key: 'monthlyPrice', label: 'Monthly', render: (p) => inrExact(p.monthlyPrice) },
                  { key: 'takeRateBps', label: 'GMV take', render: (p) => `${(p.takeRateBps / 100).toFixed(2)}%` },
                  { key: 'subscribers', label: 'Houses', align: 'num' },
                  { key: 'mrr', label: 'MRR', align: 'num', render: (p) => inrExact(p.mrr) },
                ]}
                rows={planRows}
                keyField="code"
              />
            </div>
          </div>
        </Reveal>
      )}

      <div className="card">
        <h3>Work performed · {totalWork} events</h3>
        <p className="muted">
          Agent decisions and fulfillment milestones recorded by the platform over the window.
        </p>
        <div className="row wrap" style={{ gap: 6, marginBottom: 12 }}>
          <button className={kind === '' ? 'primary' : 'secondary'} onClick={() => setKind('')}>All</button>
          {workKinds.map((k) => (
            <button key={k} className={kind === k ? 'primary' : 'secondary'} onClick={() => setKind(k)}>
              {k}
            </button>
          ))}
        </div>
        <ErrorBanner error={work.error} />
        {work.loading && <Loading rows={5} />}
        {work.data && work.data.data && work.data.data.entries.length === 0 && (
          <EmptyState art="data" title="No work logged" hint="Run the revenue/work seed for this window." />
        )}
        {work.data && work.data.data && work.data.data.entries.length > 0 && (
          <DataTable
            columns={[
              { key: 'occurred_at', label: 'When', width: 118, render: (w) => dateTime(w.occurred_at) },
              { key: 'kind', label: 'Kind', width: 110 },
              { key: 'actor', label: 'Actor', width: 140 },
              { key: 'action', label: 'Action', width: 170 },
              { key: 'subject_id', label: 'Subject', width: 150, render: (w) => w.subject_id || w.subject_type || '—' },
              { key: 'store_id', label: 'House', width: 100 },
              { key: 'outcome', label: 'Outcome', width: 110 },
              { key: 'detail', label: 'Detail', width: 240 },
            ]}
            rows={work.data.data.entries}
            keyField="id"
          />
        )}
      </div>
    </div>
  );
}
