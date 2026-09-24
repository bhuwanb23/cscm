import React, { useState } from 'react';
import { PageHeader, CopyButton } from '../components/ui.jsx';
import { useToast } from '../state/ToastContext.jsx';

export default function Settings() {
  const [token, setToken] = useState(sessionStorage.getItem('cp_backend_token') || '');
  const toast = useToast();

  function save() {
    if (token) {
      sessionStorage.setItem('cp_backend_token', token);
      toast.success('Token saved', 'Stored in sessionStorage for this session.');
    } else {
      sessionStorage.removeItem('cp_backend_token');
      toast.info('Token cleared', 'Backend admin token removed.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Control-plane connection settings (stored in sessionStorage only)"
      />
      <div className="card">
        <h3>Backend admin JWT</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
          The dashboard proxies admin calls to the Node backend. If <code>BACKEND_JWT_SECRET</code> is
          configured on the dashboard server, it signs a short-lived admin token for you. Otherwise,
          paste a real admin JWT here (log in to the backend as an admin and copy the token).
        </p>
        <textarea
          rows={4}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
          placeholder="eyJhbGciOiJIUzI1NiIs…"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <div className="row" style={{ marginTop: 10 }}>
          <button onClick={save}>Save token</button>
          <button className="secondary" onClick={() => setToken('')}>Clear</button>
          {token && <CopyButton text={token} label="Copy token" />}
        </div>
      </div>

      <div className="card">
        <h3>Server-side env vars (dashboard server)</h3>
        <div className="json-head">
          <CopyButton
            text={`PORT=3002\nBACKEND_URL=http://localhost:3000\nGATEWAY_URL=http://localhost:8080\nAI_ML_URL=http://localhost:8000`}
            label="Copy env template"
          />
        </div>
        <pre className="json-view">{`PORT=3002                    # dashboard port
BACKEND_URL=http://localhost:3000
GATEWAY_URL=http://localhost:8080
AI_ML_URL=http://localhost:8000
DASHBOARD_USER=admin
DASHBOARD_PASSWORD=change-me
DASHBOARD_JWT_SECRET=…       # required unless NODE_ENV=development
BACKEND_JWT_SECRET=…         # optional: auto-sign backend admin tokens
AI_ML_API_KEY=…              # optional: forwarded as X-API-Key to AI/ML`}</pre>
      </div>
    </div>
  );
}
