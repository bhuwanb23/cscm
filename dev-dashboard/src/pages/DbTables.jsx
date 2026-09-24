import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Loading, ErrorBanner, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';
import { DB_TABLES } from '../lib/registry.js';

export default function DbTables() {
  const tables = useAsyncData(() => api.get('/api/db/tables'), []);

  const rows = tables.data?.data || [];

  return (
    <div>
      <PageHeader
        title="Database tables"
        subtitle="Live row counts from the active driver (SQLite dev / PostgreSQL prod)"
        actions={<button className="secondary" onClick={tables.refresh}>Refresh</button>}
      />
      <ErrorBanner error={tables.error} />
      {tables.loading && <Loading rows={7} />}
      {rows.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Table</th><th>Columns</th><th>Rows</th><th></th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.name}>
                  <td><Link to={`/db/tables/${t.name}`} style={{ color: 'var(--accent)' }}>{t.name}</Link></td>
                  <td>{t.columnCount}</td>
                  <td>{t.rowCount}</td>
                  <td className="muted">{(DB_TABLES.find((k) => k.name === t.name) || {}).desc || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === 0 && !tables.loading && (
        <div className="card">
          <h3>Known tables</h3>
          {DB_TABLES.map((t) => (
            <div key={t.name} className="event-row">
              <Link to={`/db/tables/${t.name}`} style={{ color: 'var(--accent)' }}>{t.label}</Link>
              <span className="muted">{t.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
