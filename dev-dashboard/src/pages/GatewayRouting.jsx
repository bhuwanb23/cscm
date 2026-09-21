import React from 'react';
import { PageHeader, DataTable } from '../components/ui.jsx';
import { GATEWAY_ROUTES } from '../lib/registry.js';

export default function GatewayRouting() {
  return (
    <div>
      <PageHeader
        title="Gateway routing"
        subtitle="How gateway :8080 maps /api/v1/* to the Node backend or AI/ML (mirrors gateway/config.yaml)"
      />
      <div className="card">
        <DataTable
          columns={[
            { key: 'prefix', label: 'Route prefix', render: (r) => <code>{r.prefix}</code> },
            { key: 'target', label: 'Proxied to' },
            { key: 'auth', label: 'Auth' },
          ]}
          rows={GATEWAY_ROUTES}
          keyField="prefix"
        />
      </div>
      <div className="card">
        <h3>Gateway middleware chain (in order)</h3>
        <pre className="json-view">{`helmet (CSP) → CORS (ALLOWED_ORIGINS) → express.json
→ optional-auth JWT (HS256, iss/aud pinned)
→ per-user rate limiting
→ service discovery → circuit breaker → proxy target
→ Prometheus metrics (/metrics)`}</pre>
      </div>
    </div>
  );
}
