import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, JsonView } from '../components/ui.jsx';
import { callAiMl } from '../api/client.jsx';

const QUICK = [
  { label: 'GET /monitoring/health', method: 'GET', path: '/monitoring/health' },
  { label: 'GET /learning/status', method: 'GET', path: '/learning/status' },
  { label: 'POST /demand/forecast', method: 'POST', path: '/demand/forecast', body: { storeId: 'store-1', horizonDays: 7 } },
  { label: 'POST /anomaly/detect', method: 'POST', path: '/anomaly/detect', body: { metric: 'order_volume' } },
  { label: 'POST /nlp/summarize', method: 'POST', path: '/nlp/summarize', body: { text: 'Demand is up 12% week over week in the north region.' } },
];

export default function AiPlayground() {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/monitoring/health');
  const [bodyText, setBodyText] = useState('');
  const [history, setHistory] = useState([]);
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
      if (method !== 'GET' && bodyText.trim()) body = JSON.parse(bodyText);
      const data = await callAiMl(method, path, body);
      setResult(data);
      setHistory((h) => [{ method, path, ok: true, at: new Date().toLocaleTimeString() }, ...h].slice(0, 20));
    } catch (err) {
      setError(err);
      setHistory((h) => [{ method, path, ok: false, at: new Date().toLocaleTimeString() }, ...h].slice(0, 20));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="AI/ML API playground"
        subtitle="Call any AI/ML endpoint through the dashboard proxy — auth headers are injected server-side"
        actions={<button onClick={send} disabled={busy}>{busy ? 'Calling…' : 'Send'}</button>}
      />
      <div className="card">
        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: 110 }}>
            {['GET', 'POST', 'PUT', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
          </select>
          <input value={path} onChange={(e) => setPath(e.target.value)} style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }} />
        </div>
        {method !== 'GET' && (
          <textarea rows={6} style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }} value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder='{"storeId": "store-1"}' />
        )}
        <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          {QUICK.map((q) => (
            <button key={q.label} className="secondary" style={{ fontSize: 11 }}
              onClick={() => { setMethod(q.method); setPath(q.path); setBodyText(q.body ? JSON.stringify(q.body, null, 2) : ''); }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <ErrorBanner error={error} />
      {busy && <Loading rows={3} label="Waiting for response…" />}
      {result && (
        <div className="card">
          <h3>Response</h3>
          <JsonView data={result} />
        </div>
      )}
      {history.length > 0 && (
        <div className="card">
          <h3>History</h3>
          {history.map((h, i) => (
            <div key={i} className="event-row">
              <span className={`badge ${h.ok ? 'ok' : 'err'}`}>{h.method}</span>
              <code style={{ fontSize: 12 }}>{h.path}</code>
              <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>{h.at}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
