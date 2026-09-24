import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, JsonView, useAsyncData } from '../components/ui.jsx';
import { callGateway } from '../api/client.jsx';
import { useConfirm } from '../state/ConfirmContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

export default function GatewayCircuits() {
  const circuits = useAsyncData(() => callGateway('GET', '/circuit-breaker/state'), []);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  async function resetAll() {
    const ok = await confirm({
      title: 'Reset all circuit breakers?',
      message: 'Open and half-open breakers on the gateway return to closed; failing downstreams will be retried immediately.',
      confirmLabel: 'Reset all',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await callGateway('POST', '/circuit-breaker/reset/all', {});
      toast.success('Breakers reset', 'All gateway circuit breakers are closed.');
      circuits.refresh();
    } catch (e) {
      toast.error('Reset failed', `${e.message} — gateway admin endpoints require an admin JWT (Settings).`);
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
      <ErrorBanner error={circuits.error} />
      <div className="card">
        {circuits.loading && <Loading rows={3} />}
        {circuits.data && <JsonView data={circuits.data} copy />}
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
