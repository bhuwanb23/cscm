import React from 'react';
import { useLive } from '../state/LiveContext.jsx';
import { StatusPill, JsonView, PageHeader } from '../components/ui.jsx';

export default function Services() {
  const { status } = useLive();

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Per-service health, response times, and topology for the Node backend, API gateway, and AI/ML platform."
      />
      <div className="grid-3">
        {['backend', 'gateway', 'aiMl'].map((s) => (
          <div className="card" key={s}>
            <h3 style={{ textTransform: 'capitalize' }}>{s === 'aiMl' ? 'AI/ML (Python :8000)' : `${s} (${s === 'gateway' ? ':8080' : ':3000'})`}</h3>
            <div className="event-row">
              <StatusPill status={status[s]?.status || 'unknown'} />
              <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
                last check: {status[s]?.lastCheck ? new Date(status[s].lastCheck).toLocaleTimeString() : '—'}
              </span>
            </div>
            <div className="event-row">
              <span className="muted">response time</span>
              <span style={{ marginLeft: 'auto' }}>{status[s]?.responseTime != null ? `${status[s].responseTime} ms` : '—'}</span>
            </div>
            {status[s]?.error && <div className="error-text">{status[s].error}</div>}
            {status[s]?.detail && <JsonView data={status[s].detail} />}
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Topology</h3>
        <pre className="json-view">{`Expo app (8081)
   └─> Gateway :8080  (JWT verify, rate limit, circuit breakers)
         ├─> Node backend :3000   (CRUD, auth, agents, SQLite/Postgres)
         ├─> AI/ML :8000          (FastAPI, 16 ML domains, X-API-Key)
         └─> Prometheus :9090 → Grafana :3001 (metrics)`}</pre>
      </div>
    </div>
  );
}
