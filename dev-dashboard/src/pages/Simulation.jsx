import React from 'react';
import { PageHeader, Loading, ErrorBanner, JsonView, useAsyncData } from '../components/ui.jsx';
import { callBackend } from '../api/client.jsx';

export default function Simulation() {
  const status = useAsyncData(() => callBackend('GET', '/api/v1/debug/simulation/status'), []);
  const [busy, setBusy] = React.useState(null);
  const [note, setNote] = React.useState(null);

  async function act(action) {
    setBusy(action);
    setNote(null);
    try {
      await callBackend('POST', `/api/v1/debug/simulation/${action}`, {});
      setNote(action === 'start' ? 'Simulation started (runs until users complete a cycle or you stop it).' : 'Stop requested — finishes the current simulated user first.');
      status.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  const running = status.data?.data?.running;

  return (
    <div>
      <PageHeader
        title="User simulation"
        subtitle="Simulated shopkeepers/transporters/wholesalers driving the real APIs — same flow as the mobile app and the user-simulation GitHub Action"
        actions={
          <>
            <button className="secondary" onClick={status.refresh}>Refresh</button>
            <button onClick={() => act('start')} disabled={!!busy || running}>Start</button>
            <button className="danger" onClick={() => act('stop')} disabled={!!busy || !running}>Stop</button>
          </>
        }
      />
      {note && <div className="card muted">{note}</div>}
      <ErrorBanner error={status.error} />
      <div className="grid-2">
        <div className="card">
          <h3>Status</h3>
          {status.loading && <Loading />}
          {status.data && (
            <>
              <div className="event-row">
                <span>Running</span>
                <span className={`badge ${running ? 'ok' : ''}`} style={{ marginLeft: 'auto' }}>
                  {running ? 'yes' : 'no'}
                </span>
              </div>
              <div className="event-row">
                <span>Started at</span>
                <span style={{ marginLeft: 'auto' }}>{status.data.data.startedAt || '—'}</span>
              </div>
            </>
          )}
        </div>
        <div className="card">
          <h3>Last report</h3>
          {status.data?.data?.report
            ? <JsonView data={status.data.data.report} />
            : <div className="muted">No report yet — run a full cycle, or see the audit CSV from the GitHub Action runs.</div>}
        </div>
      </div>
      <div className="card">
        <h3>What the simulator does</h3>
        <pre className="json-view">{`userSimulator.js (behaviors/*)
  ├─ registers demo users (crypto-random passwords, role per persona)
  ├─ shopkeepers: browse → create orders → check inventory
  ├─ transporters: accept shipments → update status/location
  └─ wholesalers: bulk inventory updates
Requests go through the gateway exactly like the mobile app, so
Prometheus metrics + agent JSON state update as if real users were active.`}</pre>
      </div>
    </div>
  );
}
