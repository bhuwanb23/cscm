import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, DataTable, useAsyncData } from '../components/ui.jsx';
import { api, callBackend } from '../api/client.jsx';
import { useConfirm } from '../state/ConfirmContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

const STATUSES = ['pending', 'assigned', 'in_transit', 'delivered', 'failed'];

export default function Shipments() {
  const [status, setStatus] = useState('pending');
  const shipments = useAsyncData(
    () => api.get(`/api/data/shipments/${encodeURIComponent(status)}`),
    [status]
  );
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  async function setStatusOf(s, next) {
    setBusy(true);
    try {
      await callBackend('PATCH', `/api/v1/shipments/${s.shipment_id}/status`, { status: next });
      toast.success('Shipment updated', `${s.shipment_id} → ${next}`);
      shipments.refresh();
    } catch (e) {
      toast.error('Status update failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeShipment(s) {
    const ok = await confirm({
      title: `Delete shipment ${s.shipment_id}?`,
      message: 'This removes the shipment record permanently.',
      confirmLabel: 'Delete shipment',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await callBackend('POST', '/api/v1/debug/data/delete-shipment', { params: [s.shipment_id] });
      toast.success('Shipment deleted', s.shipment_id);
      shipments.refresh();
    } catch (e) {
      toast.error('Delete failed', e.message);
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
      <ErrorBanner error={shipments.error} />
      <div className="card">
        {shipments.loading && <Loading rows={6} />}
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
