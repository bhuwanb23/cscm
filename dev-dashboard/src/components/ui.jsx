import React, { useEffect, useState } from 'react';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, sub, tone }) {
  return (
    <div className="card">
      <h3>{label}</h3>
      <div className="value" style={tone ? { color: tone } : undefined}>
        {value === undefined || value === null || value === '' ? '—' : value}
      </div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function StatusPill({ status }) {
  const cls = status === 'healthy' || status === 'ok' ? 'ok' : status === 'unknown' ? 'warn' : 'err';
  return (
    <span>
      <span className={`status-dot ${status === 'healthy' ? 'healthy' : status === 'unknown' ? 'unknown' : 'unhealthy'}`} />
      <span className={`badge ${cls}`}>{status}</span>
    </span>
  );
}

export function DataTable({ columns, rows, empty = 'No data', keyField = 'id', actions }) {
  if (!rows || rows.length === 0) {
    return <div className="muted" style={{ padding: 14 }}>{empty}</div>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
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

export function Loading({ label = 'Loading…' }) {
  return <div className="muted" style={{ padding: 14 }}>{label}</div>;
}

export function ErrorBanner({ error }) {
  if (!error) return null;
  return <div className="error-text">{String(error.message || error)}</div>;
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
