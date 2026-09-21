import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, DataTable, useAsyncData } from '../components/ui.jsx';
import { api, callBackend } from '../api/client.jsx';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [storeId, setStoreId] = useState('store-1');
  const orders = useAsyncData(
    () => api.get(`/api/data/orders/${encodeURIComponent(storeId)}`),
    [storeId]
  );
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function setStatus(o, status) {
    setBusy(true);
    setNote(null);
    try {
      await callBackend('PATCH', `/api/v1/orders/${o.order_id}/status`, { status });
      setNote(`Order ${o.order_id} → ${status}`);
      orders.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeOrder(o) {
    if (!window.confirm(`Delete order ${o.order_id}?`)) return;
    setBusy(true);
    try {
      await callBackend('POST', '/api/v1/debug/data/delete-order', { params: [o.order_id] });
      setNote(`Deleted ${o.order_id}`);
      orders.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Order lifecycle per store — status edits use PATCH /orders/:id/status"
        actions={
          <>
            <input value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="store id" style={{ width: 140 }} />
            <button className="secondary" onClick={orders.refresh}>Reload</button>
          </>
        }
      />
      {note && <div className="card muted">{note}</div>}
      <ErrorBanner error={orders.error} />
      <div className="card">
        {orders.loading && <Loading />}
        {orders.data && (
          <DataTable
            columns={[
              { key: 'order_id', label: 'Order' },
              { key: 'store_id', label: 'Store' },
              { key: 'items', label: 'Items', render: (o) => <code style={{ fontSize: 11 }}>{typeof o.items === 'string' ? o.items.slice(0, 60) : JSON.stringify(o.items || []).slice(0, 60)}</code> },
              { key: 'total_amount', label: 'Total' },
              {
                key: 'status',
                label: 'Status',
                render: (o) => (
                  <select value={o.status} disabled={busy} onChange={(e) => setStatus(o, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ),
              },
              { key: 'created_at', label: 'Created' },
            ]}
            rows={orders.data.data || []}
            actions={(o) => <button className="danger" disabled={busy} onClick={() => removeOrder(o)}>Delete</button>}
          />
        )}
      </div>
    </div>
  );
}
