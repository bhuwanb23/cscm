import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, JsonView, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';

export default function Cache() {
  const stats = useAsyncData(() => api.get('/api/cache/stats'), []);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function clear() {
    if (!window.confirm('Clear the entire BaseApiService TTL cache?')) return;
    setBusy(true);
    setNote(null);
    try {
      await api.post('/api/cache/clear', {});
      setNote('Cache cleared.');
      stats.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Cache"
        subtitle="TTL cache backing BaseApiService calls from sub-agents to AI/ML"
        actions={
          <>
            <button className="secondary" onClick={stats.refresh}>Refresh</button>
            <button className="danger" onClick={clear} disabled={busy}>Clear cache</button>
          </>
        }
      />
      {note && <div className="card muted">{note}</div>}
      <ErrorBanner error={stats.error} />
      <div className="card">
        {stats.loading && <Loading />}
        {stats.data && <JsonView data={stats.data.data ?? stats.data} />}
      </div>
    </div>
  );
}
