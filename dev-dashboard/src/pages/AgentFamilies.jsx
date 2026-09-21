import React from 'react';
import { PageHeader } from '../components/ui.jsx';
import { AGENT_FAMILIES } from '../lib/registry.js';

export default function AgentFamilies() {
  const totalSubs = AGENT_FAMILIES.reduce((n, f) => n + f.subAgents.length, 0);
  return (
    <div>
      <PageHeader
        title="Agent families & sub-agents"
        subtitle={`${AGENT_FAMILIES.length} parent agents · ${totalSubs} sub-agents · state in backend/data/*.json · sub-agents call AI/ML via BaseApiService (circuit-breaker + static fallbacks)`}
      />
      <div className="grid-2">
        {AGENT_FAMILIES.map((f) => (
          <div className="card" key={f.name}>
            <h3>{f.label}</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>{f.description}</p>
            {f.subAgents.map((s) => (
              <div key={s} className="event-row">
                <span className="badge">sub-agent</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{s}</span>
                <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>
                  {f.name}/sub-agents/{s}.js
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="card">
        <h3>How a request flows through an agent</h3>
        <pre className="json-view">{`gateway :8080 → backend route/controller
  → parent agent (JSON state in backend/data/)
      → sub-agent.call(input)
          → BaseApiService → AI/ML :8000 (X-API-Key, retry, cache)
          ← result  OR  static fallback when Python is down
      ← merged into parent state → response`}</pre>
      </div>
    </div>
  );
}
