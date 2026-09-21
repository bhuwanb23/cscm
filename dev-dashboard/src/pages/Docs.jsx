import React from 'react';
import { PageHeader } from '../components/ui.jsx';
import { GRAFANA_URL, PROMETHEUS_URL } from '../lib/registry.js';

export default function Docs() {
  return (
    <div>
      <PageHeader title="Docs & links" subtitle="Everything you can open while developing" />
      <div className="grid-2">
        <div className="card">
          <h3>Live docs</h3>
          <div className="event-row"><span>Backend Swagger UI</span><a href="http://localhost:3000/api-docs" target="_blank" rel="noreferrer">:3000/api-docs</a></div>
          <div className="event-row"><span>AI/ML FastAPI docs</span><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">:8000/docs</a></div>
          <div className="event-row"><span>Prometheus</span><a href={PROMETHEUS_URL} target="_blank" rel="noreferrer">{PROMETHEUS_URL}</a></div>
          <div className="event-row"><span>Grafana</span><a href={GRAFANA_URL} target="_blank" rel="noreferrer">{GRAFANA_URL}</a></div>
        </div>
        <div className="card">
          <h3>Repo docs</h3>
          <div className="event-row"><span>Architecture</span><code>docs/ARCHITECTURE.md</code></div>
          <div className="event-row"><span>Agents README</span><code>backend/src/agents/README.md</code></div>
          <div className="event-row"><span>Simulation setup</span><code>SIMULATION_SETUP.md</code></div>
          <div className="event-row"><span>Feature store</span><code>backend/src/features/FEATURE_STORAGE.md</code></div>
          <div className="event-row"><span>OpenAPI spec</span><code>docs/openapi.yaml</code></div>
        </div>
      </div>
    </div>
  );
}
