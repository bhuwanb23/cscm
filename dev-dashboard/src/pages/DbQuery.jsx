import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, Loading, ErrorBanner, DataTable } from '../components/ui.jsx';
import { api } from '../api/client.jsx';
import { useToast } from '../state/ToastContext.jsx';

const EXAMPLES = [
  // No LIMIT: the query endpoint appends its own row cap.
  'SELECT id, username, role, created_at FROM users ORDER BY id DESC',
  'SELECT store_id, product_id, quantity, min_stock_level FROM inventory ORDER BY quantity',
  "SELECT status, COUNT(*) AS n FROM orders GROUP BY status",
  "SELECT status, COUNT(*) AS n FROM shipments GROUP BY status",
];

export default function DbQuery() {
  const [sql, setSql] = useState(EXAMPLES[0]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  // Deep link from the command palette: /db/query?q=SELECT…
  const q = params.get('q') || '';
  useEffect(() => {
    if (q) {
      setSql(q);
      run(q);
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function run(override) {
    if (override && typeof override.preventDefault === 'function') override.preventDefault();
    const queryText = typeof override === 'string' ? override : sql;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.post('/api/db/query', { sql: queryText });
      setResult(data.data);
      toast.success('Query complete', `${data.data?.rowCount ?? 0} row(s) returned`);
    } catch (err) {
      setError(err);
      toast.error('Query failed', err.message);
    } finally {
      setBusy(false);
    }
  }

  const columns = result?.rows?.length
    ? Object.keys(result.rows[0]).map((k) => ({ key: k, label: k }))
    : [];

  return (
    <div>
      <PageHeader
        title="SQL console"
        subtitle="Read-only: SELECT / WITH / EXPLAIN only · params bound · 500-row cap"
        actions={<button onClick={run} disabled={busy}>{busy ? 'Running…' : 'Run (Ctrl+Enter)'}</button>}
      />
      <div className="card">
        <textarea
          rows={5}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); }}
        />
        <div className="row" style={{ marginTop: 8 }}>
          {EXAMPLES.map((ex) => (
            <button key={ex} className="secondary" style={{ fontSize: 11 }} onClick={() => setSql(ex)}>
              {ex.slice(0, 42)}…
            </button>
          ))}
        </div>
      </div>
      <ErrorBanner error={error} />
      {busy && <Loading rows={6} label="Running query…" />}
      {result && (
        <div className="card">
          <h3>{result.rowCount} row(s)</h3>
          <DataTable columns={columns} rows={result.rows} keyField="__i" />
          <details style={{ marginTop: 10 }}>
            <summary className="muted">Raw JSON</summary>
            <pre className="json-view">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
