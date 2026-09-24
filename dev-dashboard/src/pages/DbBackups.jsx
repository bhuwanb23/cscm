import React from 'react';
import { PageHeader, Loading, ErrorBanner, EmptyState, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';
import { useToast } from '../state/ToastContext.jsx';

export default function DbBackups() {
  const backups = useAsyncData(() => api.get('/api/backups'), []);
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();

  async function create() {
    setBusy(true);
    try {
      const res = await api.post('/api/backups', {});
      toast.success('Backup created', JSON.stringify(res.data || res).slice(0, 120));
      backups.refresh();
    } catch (e) {
      toast.error('Backup failed', e.message);
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
      <div className="card">
        {backups.loading && <Loading rows={4} />}
        {!backups.loading && list.length === 0 && (
          <EmptyState art="archive" title="No backups yet" hint="Create a snapshot of the SQLite database file — backups land in the backups/ dir on the backend host." />
        )}
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
