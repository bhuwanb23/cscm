import React from 'react';
import { useLive } from '../state/LiveContext.jsx';
import { PageHeader, useAsyncData, EmptyState } from '../components/ui.jsx';
import { api } from '../api/client.jsx';

export default function Events() {
  const { events } = useLive();
  const snapshot = useAsyncData(() => api.get('/api/events'), []);

  // A partial or error payload can put a non-array here, so normalise before
  // anything calls .map on it.
  const rest = Array.isArray(snapshot.data) ? snapshot.data : [];
  const live = events.length ? events : rest;

  return (
    <div>
      <PageHeader
        title="Event stream"
        subtitle="Service up/down transitions and control-plane actions, broadcast over WebSocket"
        actions={<button className="secondary" onClick={snapshot.refresh}>Reload snapshot</button>}
      />
      <div className="card">
        {live.length === 0 && (
          <EmptyState art="inbox" title="No events yet" hint="Service transitions and control-plane actions will stream in here live." />
        )}
        {live.map((e) => (
          <div key={e.id} className="event-row">
            <span className={`badge ${e.level === 'error' ? 'err' : e.level === 'ok' ? 'ok' : ''}`}>{e.kind}</span>
            <span>{e.message}</span>
            <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>
              {new Date(e.ts || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
