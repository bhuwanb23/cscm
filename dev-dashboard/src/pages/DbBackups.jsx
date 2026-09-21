import React from 'react';
import { PageHeader, Loading, ErrorBanner, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';

export default function DbBackups() {
  const backups = useAsyncData(() => api.get('/api/backups'), []);
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState(null);

  async function create() {
    setBusy(true);
    setNote(null);
    try {
      const res = await api.post('/api/backups', {});
      setNote(`Created: ${JSON.stringify(res.data || res)}`);
      backups.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const list = backups.data?.data || [];

  return (
    <div>
      <PageHeader
        title="Database backups"
        subtitle="Snapshots of the SQLite database file (backups/ dir on the backend host)"
        actions={<button onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create backup'}</button>}
      />
      <ErrorBanner error={backups.error} />
      {note && <div className="card muted">{note}</div>}
      <div className="card">
        {backups.loading && <Loading />}
        {!backups.loading && list.length === 0 && <div className="muted">No backups yet.</div>}
        {Array.isArray(list) && list.map((b, i) => (
          <div key={i} className="event-row">
            <span>{b.name || b.file || JSON.stringify(b).slice(0, 60)}</span>
            <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
              {b.size ? `${Math.round(b.size / 1024)} KB` : ''} {b.createdAt || ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
