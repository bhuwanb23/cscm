import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, JsonView, useAsyncData } from '../components/ui.jsx';
import { callGateway } from '../api/client.jsx';

export default function GatewayCircuits() {
  const circuits = useAsyncData(() => callGateway('GET', '/circuit-breaker/state'), []);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function resetAll() {
    if (!window.confirm('Reset all gateway circuit breakers?')) return;
    setBusy(true);
    setNote(null);
    try {
      await callGateway('POST', '/circuit-breaker/reset/all', {});
      setNote('Circuit breakers reset.');
      circuits.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message} — gateway admin endpoints require an admin JWT (Settings).`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Circuit breakers"
        subtitle="Per-downstream breakers in the gateway (open = failing fast, half-open = probing, closed = normal)"
        actions={
          <>
            <button className="secondary" onClick={circuits.refresh}>Refresh</button>
            <button className="danger" onClick={resetAll} disabled={busy}>Reset all</button>
          </>
        }
      />
      {note && <div className="card muted">{note}</div>}
      <ErrorBanner error={circuits.error} />
      <div className="card">
        {circuits.loading && <Loading />}
        {circuits.data && <JsonView data={circuits.data} />}
        {!circuits.loading && !circuits.data && (
          <div className="muted">
            No data. These endpoints live on the gateway: /circuit-breaker/state (GET) and
            /circuit-breaker/reset/:service (POST) — admin JWT required.
          </div>
        )}
      </div>
    </div>
  );
}
