import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, JsonView } from '../../components/ui.jsx';
import { callAiMl } from '../../api/client.jsx';

/**
 * Generic AI/ML domain page: shows the domain description, a pre-filled
 * sample request the user can edit, and the live JSON response.
 */
export default function AiDomainPage({ domain }) {
  const [endpoint, setEndpoint] = useState(domain.sample.endpoint);
  const [method, setMethod] = useState(domain.sample.method);
  const [bodyText, setBodyText] = useState(
    domain.sample.body ? JSON.stringify(domain.sample.body, null, 2) : ''
  );
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function send(e) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      let body = null;
      if (method !== 'GET' && bodyText.trim()) {
        body = JSON.parse(bodyText); // throws with a helpful message if malformed
      }
      const data = await callAiMl(method, endpoint, body);
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={domain.title}
        subtitle={`${domain.desc} — proxied to AI/ML /api/v1/${domain.prefix}`}
        actions={
          <button onClick={send} disabled={busy}>{busy ? 'Calling…' : 'Send request'}</button>
        }
      />
      <div className="card">
        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: 110 }}>
            {['GET', 'POST', 'PUT', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
          </select>
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
          />
        </div>
        {method !== 'GET' && (
          <textarea
            rows={6}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder='{"key": "value"}'
          />
        )}
      </div>
      <ErrorBanner error={error} />
      {busy && <Loading label="Waiting for AI/ML…" />}
      {result && (
        <div className="card">
          <h3>Response</h3>
          <JsonView data={result} />
        </div>
      )}
    </div>
  );
}
