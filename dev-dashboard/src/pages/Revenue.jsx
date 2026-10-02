import React, { useMemo, useState } from 'react';
import { PageHeader, Kpi, Loading, ErrorBanner, DataTable, EmptyState, useAsyncData, StatusPill } from '../components/ui.jsx';
import { api } from '../api/client.jsx';

/** Compact INR formatting. Indian digit grouping (lakh/crore) reads naturally here. */
function inr(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function inrExact(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

const iso = (d) => d.toISOString().slice(0, 10);

function defaultWindow() {
  const to = new Date('2026-09-30T00:00:00Z');
  const from = new Date(to.getTime() - 29 * 86400000);
  return { from: iso(from), to: iso(to) };
}

/** Small inline bar chart for the daily series — no chart library needed. */
function Spark({ data, valueKey = 'amount', label }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <div className="spark-row" style={{ flexWrap: 'wrap', gap: 2 }} aria-label={label}>
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${inrExact(d[valueKey])}`}
          style={{
            width: 6,
            minHeight: 2,
            height: `${Math.max(2, ((Number(d[valueKey]) || 0) / max) * 40)}px`,
            background: 'var(--accent, #6ea8fe)',
            opacity: Number(d[valueKey]) > 0 ? 0.85 : 0.18,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
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

  const workKinds = useMemo(() => {
    const set = new Set();
    ((work.data && work.data.data && work.data.data.summary) || []).forEach((r) => set.add(r.kind));
    return [...set];
  }, [work.data]);

  const totalWork = useMemo(
    () => ((work.data && work.data.data && work.data.data.summary) || []).reduce((s, r) => s + r.n, 0),
    [work.data]
  );

  return (
    <div>
      <PageHeader
        title="Revenue"
        subtitle="SaaS subscriptions plus GMV commission — Kanchipuram silk supply chain"
        actions={
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <input type="date" value={win.from} max={win.to} onChange={(e) => setWin((w) => ({ ...w, from: e.target.value }))} />
            <span className="muted">to</span>
            <input type="date" value={win.to} min={win.from} onChange={(e) => setWin((w) => ({ ...w, to: e.target.value }))} />
            <button className="secondary" onClick={() => { summary.refresh(); stores.refresh(); work.refresh(); }}>
              Reload
            </button>
          </div>
        }
      />

      <ErrorBanner error={summary.error} />
      {summary.loading && <Loading rows={4} />}

      {s && (
        <>
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
            <h3>Daily revenue · {win.from} → {win.to}</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Subscription collections (bars) across the window. Commission accrues per delivered order and is
              recognised on the order date.
            </p>
            <Spark data={s.dailyRevenue} label="daily subscription revenue" />
            <Spark data={s.dailyCommission} label="daily commission" />
          </div>
        </>
      )}

      {planRows && (
        <div className="card">
          <h3>Plan mix</h3>
          <DataTable
            columns={[
              { key: 'name', label: 'Plan' },
              { key: 'code', label: 'Code' },
              { key: 'monthlyPrice', label: 'Monthly', render: (p) => inrExact(p.monthlyPrice) },
              { key: 'takeRateBps', label: 'GMV take', render: (p) => `${(p.takeRateBps / 100).toFixed(2)}%` },
              { key: 'subscribers', label: 'Subscribers' },
              { key: 'mrr', label: 'MRR', render: (p) => inrExact(p.mrr) },
              { key: 'description', label: 'Includes' },
            ]}
            rows={planRows}
            keyField="code"
          />
        </div>
      )}

      {stores.data && stores.data.data && (
        <div className="card">
          <h3>Revenue by house</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Concentration matters: a single house carrying most of the revenue is a risk, not a success.
          </p>
          <DataTable
            columns={[
              { key: 'storeId', label: 'Store' },
              { key: 'planCode', label: 'Plan' },
              { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} mini /> },
              { key: 'subscriptionRevenue', label: 'Subscriptions', render: (r) => inrExact(r.subscriptionRevenue) },
              { key: 'commissionRevenue', label: 'Commission', render: (r) => inrExact(r.commissionRevenue) },
              { key: 'totalRevenue', label: 'Total', render: (r) => inrExact(r.totalRevenue) },
              { key: 'shareBps', label: 'Share', render: (r) => `${(r.shareBps / 100).toFixed(1)}%` },
            ]}
            rows={stores.data.data.stores}
            keyField="storeId"
          />
        </div>
      )}

      <div className="card">
        <h3>Work performed ({totalWork} events)</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Agent decisions and fulfillment milestones recorded by the platform.
        </p>
        <div className="row" style={{ gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
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
              { key: 'occurred_at', label: 'When' },
              { key: 'kind', label: 'Kind' },
              { key: 'actor', label: 'Actor' },
              { key: 'action', label: 'Action' },
              { key: 'subject_id', label: 'Subject', render: (w) => w.subject_id || w.subject_type || '—' },
              { key: 'store_id', label: 'Store' },
              { key: 'outcome', label: 'Outcome', render: (w) => <StatusPill status={w.outcome} mini /> },
              { key: 'detail', label: 'Detail' },
            ]}
            rows={work.data.data.entries}
            keyField="id"
          />
        )}
      </div>
    </div>
  );
}
