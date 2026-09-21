import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, DataTable, useAsyncData } from '../components/ui.jsx';
import { api, callBackend } from '../api/client.jsx';

const STATUSES = ['pending', 'assigned', 'in_transit', 'delivered', 'failed'];

export default function Shipments() {
  const [status, setStatus] = useState('pending');
  const shipments = useAsyncData(
    () => api.get(`/api/data/shipments/${encodeURIComponent(status)}`),
    [status]
  );
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function setStatusOf(s, next) {
    setBusy(true);
    setNote(null);
    try {
      await callBackend('PATCH', `/api/v1/shipments/${s.shipment_id}/status`, { status: next });
      setNote(`Shipment ${s.shipment_id} → ${next}`);
      shipments.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeShipment(s) {
    if (!window.confirm(`Delete shipment ${s.shipment_id}?`)) return;
    setBusy(true);
    try {
      await callBackend('POST', '/api/v1/debug/data/delete-shipment', { params: [s.shipment_id] });
      setNote(`Deleted ${s.shipment_id}`);
      shipments.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Shipments"
        subtitle="Filter by status; transitions go through the shipments API (checks access)"
        actions={
          <>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="secondary" onClick={shipments.refresh}>Reload</button>
          </>
        }
      />
      {note && <div className="card muted">{note}</div>}
      <ErrorBanner error={shipments.error} />
      <div className="card">
        {shipments.loading && <Loading />}
        {shipments.data && (
          <DataTable
            columns={[
              { key: 'shipment_id', label: 'Shipment' },
              { key: 'order_id', label: 'Order' },
              { key: 'transporter_id', label: 'Transporter' },
              { key: 'current_location', label: 'Location' },
              {
                key: 'status',
                label: 'Status',
                render: (s) => (
                  <select value={s.status} disabled={busy} onChange={(e) => setStatusOf(s, e.target.value)}>
                    {STATUSES.map((x) => <option key={x}>{x}</option>)}
                  </select>
                ),
              },
              { key: 'updated_at', label: 'Updated' },
            ]}
            rows={shipments.data.data || []}
            actions={(s) => <button className="danger" disabled={busy} onClick={() => removeShipment(s)}>Delete</button>}
          />
        )}
      </div>
    </div>
  );
}
