import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Loading, ErrorBanner, useAsyncData } from '../components/ui.jsx';
import { callAiMl } from '../api/client.jsx';
import { AI_DOMAINS } from '../lib/registry.js';

export default function AiOverview() {
  const health = useAsyncData(() => callAiMl('GET', '/monitoring/health'), []);

  return (
    <div>
      <PageHeader
        title="AI/ML platform"
        subtitle="FastAPI :8000 — 16 ML domains behind X-API-Key auth; agents reach it via BaseApiService with static fallbacks"
      />
      <div className="card">
        <h3>Model monitoring health</h3>
        <ErrorBanner error={health.error} />
        {health.loading && <Loading />}
        {health.data && (
          <pre className="json-view" style={{ maxHeight: 220 }}>{JSON.stringify(health.data, null, 2)}</pre>
        )}
      </div>
      <div className="grid-3">
        {AI_DOMAINS.map((d) => (
          <div className="card" key={d.key}>
            <h3>{d.title}</h3>
            <p className="muted" style={{ fontSize: 13 }}>{d.desc}</p>
            <code style={{ fontSize: 11 }}>{d.sample.method} /api/v1{d.sample.endpoint}</code>
            <div style={{ marginTop: 10 }}>
              <Link to={`/ai/${d.key}`}><button className="secondary">Open</button></Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
