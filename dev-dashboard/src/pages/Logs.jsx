import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';

export default function Logs() {
  const [file, setFile] = useState('combined');
  const [lines, setLines] = useState(200);
  const [filter, setFilter] = useState('');

  const logs = useAsyncData(
    () => api.get(`/api/logs?file=${file}&lines=${lines}`),
    [file, lines]
  );

  const rows = (logs.data?.data?.lines || []).filter((l) => {
    if (!filter) return true;
    return JSON.stringify(l).toLowerCase().includes(filter.toLowerCase());
  });

  function renderLine(l, i) {
    const level = (l.level || '').toLowerCase();
    return (
      <div key={i} className="event-row" style={{ fontFamily: 'monospace', fontSize: 12 }}>
        <span className={`badge ${level.includes('error') ? 'err' : level.includes('warn') ? 'warn' : 'ok'}`}>
          {l.level || 'log'}
        </span>
        <span style={{ wordBreak: 'break-all' }}>{l.message || l.raw || JSON.stringify(l)}</span>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 11, whiteSpace: 'nowrap' }}>
          {l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : ''}
        </span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Backend logs"
        subtitle="Tails logs/combined.log and logs/error.log from the Node backend host"
        actions={
          <>
            <select value={file} onChange={(e) => setFile(e.target.value)}>
              <option value="combined">combined.log</option>
              <option value="error">error.log</option>
            </select>
            <select value={lines} onChange={(e) => setLines(Number(e.target.value))}>
              <option value={100}>100 lines</option>
              <option value={200}>200 lines</option>
              <option value={500}>500 lines</option>
              <option value={1000}>1000 lines</option>
            </select>
            <input placeholder="filter…" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 180 }} />
            <button className="secondary" onClick={logs.refresh}>Refresh</button>
          </>
        }
      />
      <ErrorBanner error={logs.error} />
      <div className="card">
        {logs.loading && <Loading rows={8} />}
        {!logs.loading && rows.length === 0 && (
          <div className="muted">No log lines match. If the backend runs elsewhere, its logs/ dir is on that host.</div>
        )}
        {rows.map(renderLine)}
      </div>
    </div>
  );
}
