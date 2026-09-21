import React from 'react';
import { PageHeader, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';

export default function DbMigrations() {
  const test = useAsyncData(() => api.get('/api/system'), []);

  return (
    <div>
      <PageHeader title="Schema & migrations" subtitle="Where the schema lives and how it is applied" />
      <div className="grid-2">
        <div className="card">
          <h3>Connection</h3>
          <div className="event-row"><span>Driver</span><span style={{ marginLeft: 'auto' }}>{test.data?.data?.database?.type}</span></div>
          <div className="event-row"><span>Initialized</span><span style={{ marginLeft: 'auto' }}>{String(test.data?.data?.database?.initialized)}</span></div>
          <div className="event-row"><span>Env</span><span style={{ marginLeft: 'auto' }}>{test.data?.data?.environment}</span></div>
        </div>
        <div className="card">
          <h3>Schema sources</h3>
          <div className="event-row"><span>PostgreSQL</span><code>backend/schema/postgres-schema.sql</code></div>
          <div className="event-row"><span>SQLite</span><code>backend/src/storage/migrations</code></div>
          <div className="event-row"><span>Backup / restore</span><code>backend/src/storage/backup.js</code></div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            SQLite migrations run automatically on boot in development. PostgreSQL applies
            postgres-schema.sql during Render deploy (see render.yaml build command).
          </p>
        </div>
      </div>
    </div>
  );
}
