import React from 'react';
import { useLive } from '../state/LiveContext.jsx';
import { Kpi, StatusPill, Loading, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';

function EventFeed({ events }) {
  return (
    <div className="card">
      <h3>Live activity</h3>
      {events.length === 0 && <div className="muted">Waiting for events…</div>}
      {events.slice(0, 12).map((e) => (
        <div key={e.id} className="event-row">
          <span className={`badge ${e.level === 'error' ? 'err' : e.level === 'ok' ? 'ok' : ''}`}>
            {e.kind}
          </span>
          <span>{e.message}</span>
          <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>
            {new Date(e.ts || Date.now()).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const { status, events } = useLive();
  const system = useAsyncData(() => api.get('/api/system'), []);

  const healthy = ['backend', 'gateway', 'aiMl'].filter((s) => status[s]?.status === 'healthy').length;
  const memory = system.data?.data?.memory;

  return (
    <div>
      <div className="grid-4">
        <Kpi label="Services healthy" value={`${healthy}/3`} sub="backend · gateway · ai/ml" />
        <Kpi
          label="Backend uptime"
          value={system.data?.data?.uptimeSeconds != null ? `${Math.round(system.data.data.uptimeSeconds / 60)}m` : '—'}
          sub={`node ${system.data?.data?.nodeVersion || '—'}`}
        />
        <Kpi label="Heap used" value={memory ? `${memory.heapUsedMb} MB` : '—'} sub={`rss ${memory?.rssMb ?? '—'} MB`} />
        <Kpi label="Environment" value={system.data?.data?.environment || '—'} sub={`db: ${system.data?.data?.database?.type || '—'}`} />
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Service health</h3>
          {['backend', 'gateway', 'aiMl', 'redis'].map((s) => (
            <div key={s} className="event-row">
              <StatusPill status={status[s]?.status || 'unknown'} />
              <span style={{ textTransform: 'capitalize' }}>{s === 'aiMl' ? 'AI/ML' : s}</span>
              <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
                {status[s]?.responseTime != null ? `${status[s].responseTime}ms` : '—'}
              </span>
            </div>
          ))}
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Messaging — kafka: {system.data?.data?.messaging?.kafkaConfigured ? 'on' : 'off'} · mqtt:{' '}
            {system.data?.data?.messaging?.mqttConfigured ? 'on' : 'off'} · redis:{' '}
            {system.data?.data?.messaging?.redisConfigured ? 'on' : 'off'}
          </div>
        </div>
        <EventFeed events={events} />
      </div>
    </div>
  );
}
