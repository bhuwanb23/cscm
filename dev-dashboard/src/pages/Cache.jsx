import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, JsonView, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';
import { useConfirm } from '../state/ConfirmContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

export default function Cache() {
  const stats = useAsyncData(() => api.get('/api/cache/stats'), []);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  async function clear() {
    const ok = await confirm({
      title: 'Clear the entire cache?',
      message: 'All BaseApiService TTL entries are dropped; sub-agents will refetch from AI/ML.',
      confirmLabel: 'Clear cache',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.post('/api/cache/clear', {});
      toast.success('Cache cleared', 'All TTL entries were dropped.');
      stats.refresh();
    } catch (e) {
      toast.error('Clear failed', e.message);
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
      <ErrorBanner error={stats.error} />
      <div className="card">
        {stats.loading && <Loading rows={3} />}
        {stats.data && <JsonView data={stats.data.data ?? stats.data} copy />}
      </div>
    </div>
  );
}
