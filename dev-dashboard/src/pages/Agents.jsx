import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, JsonView, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';

export default function Agents() {
  const agents = useAsyncData(() => api.get('/api/agents'), []);
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState(null);

  async function act(name, action) {
    setBusy(name + action);
    setNote(null);
    try {
      await api.post(`/api/agents/${name}/${action}`, {});
      setNote(`${action} sent to ${name}`);
      agents.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  const data = agents.data?.data || {};
  const isMap = !data.note && Object.keys(data).length > 0;

  return (
    <div>
      <PageHeader
        title="Agent runtime control"
        subtitle="Process manager status and start/stop/restart — requires the agent runtime in the backend process (npm run agent-runtime)"
        actions={<button className="secondary" onClick={agents.refresh}>Refresh</button>}
      />
      {note && <div className="card muted">{note}</div>}
      <ErrorBanner error={agents.error} />
      <div className="card">
        {agents.loading && <Loading />}
        {!agents.loading && !isMap && (
          <>
            <div className="muted" style={{ marginBottom: 10 }}>
              {data.note || 'Agent runtime not reporting agent entries.'}
            </div>
            <JsonView data={data} />
          </>
        )}
        {isMap && Object.entries(data).map(([name, s]) => (
          <div key={name} className="event-row">
            <span style={{ fontFamily: 'monospace' }}>{name}</span>
            <span className={`badge ${s?.status === 'running' || s?.status === 'healthy' ? 'ok' : s?.status ? 'warn' : ''}`}>
              {s?.status || 'unknown'}
            </span>
            <span className="muted" style={{ fontSize: 12 }}>
              {s?.restarts != null ? `restarts: ${s.restarts}` : ''} {s?.lastError ? `⚠ ${String(s.lastError).slice(0, 60)}` : ''}
            </span>
            <span className="row" style={{ marginLeft: 'auto', gap: 6 }}>
              <button className="secondary" disabled={!!busy} onClick={() => act(name, 'start')}>Start</button>
              <button className="secondary" disabled={!!busy} onClick={() => act(name, 'stop')}>Stop</button>
              <button className="secondary" disabled={!!busy} onClick={() => act(name, 'restart')}>Restart</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
