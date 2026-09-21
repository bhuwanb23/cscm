import React, { useEffect, useState } from 'react';

/* ------------------------------------------------------------- helpers -- */

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="muted">{subtitle}</div>}
      </div>
      {actions && <div className="row wrap">{actions}</div>}
    </div>
  );
}

const TONE_COLORS = {
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  err: 'var(--err)',
  accent: 'var(--accent)',
};

export function Kpi({ label, value, sub, tone }) {
  const toneColor = tone && TONE_COLORS[tone] ? { color: TONE_COLORS[tone] } : undefined;
  return (
    <div className="card">
      <h3>{label}</h3>
      <div className="value" style={toneColor}>
        {value === undefined || value === null || value === '' ? '—' : value}
      </div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function StatusPill({ status }) {
  const s = String(status || 'unknown').toLowerCase();
  const cls = s === 'healthy' || s === 'ok' || s === 'closed' ? 'ok' : s === 'unknown' ? 'warn' : 'err';
  const dotCls = cls === 'ok' ? 'healthy' : cls === 'warn' ? 'unknown' : 'unhealthy';
  return (
    <span className="row" style={{ gap: 0 }}>
      <span className={`status-dot ${dotCls}`} aria-hidden="true" />
      <span className={`badge ${cls}`}>{status}</span>
    </span>
  );
}

/* -------------------------------------------------------------- states -- */

export function Skeleton({ variant = 'text', style }) {
  return <div className={`skeleton ${variant}`} style={style} aria-hidden="true" />;
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skeleton-table" role="status" aria-label="Loading data" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="row" />
      ))}
    </div>
  );
}

export function SkeletonKpis({ count = 4 }) {
  return (
    <div className="kpi-row" role="status" aria-label="Loading metrics" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="kpi" />
      ))}
    </div>
  );
}

export function Loading({ label = 'Loading…', skeleton }) {
  if (skeleton) return <SkeletonTable />;
  return (
    <div className="muted" style={{ padding: 14, fontSize: 13 }} role="status" aria-live="polite">
      {label}
    </div>
  );
}

export function EmptyState({ icon = '◇', title = 'Nothing here yet', hint, action }) {
  return (
    <div className="empty-state" role="status">
      <div className="icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  const message = String(error.message || error);
  return (
    <div className="error-banner" role="alert">
      <span aria-hidden="true">⚠</span>
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{message}</span>
      {onRetry && (
        <button className="ghost sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- table -- */

export function DataTable({ columns, rows, empty = 'No data', keyField = 'id', actions, loading, loadingRows = 5 }) {
  if (loading) return <SkeletonTable rows={loadingRows} />;

  if (!rows || rows.length === 0) {
    return typeof empty === 'string' ? (
      <EmptyState title={empty} hint="Data may appear once the system has activity." />
    ) : (
      empty
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">{c.label}</th>
            ))}
            {actions && <th style={{ width: 130 }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[keyField] !== undefined ? row[keyField] : i}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? '—')}</td>
              ))}
              {actions && <td>{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function JsonView({ data }) {
  return <pre className="json-view">{JSON.stringify(data, null, 2)}</pre>;
}

export function useAsyncData(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => !cancelled && setState({ loading: false, data, error: null }))
      .catch((error) => !cancelled && setState({ loading: false, data: null, error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, refresh: () => setTick((t) => t + 1) };
}
