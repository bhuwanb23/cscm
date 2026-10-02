import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, DataTable, EmptyState, useAsyncData } from '../components/ui.jsx';
import { api, callBackend } from '../api/client.jsx';
import { useConfirm } from '../state/ConfirmContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { inr, dateTime } from '../lib/format.js';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [storeId, setStoreId] = useState('STORE001');
  const orders = useAsyncData(
    () => api.get(`/api/data/orders/${encodeURIComponent(storeId)}`),
    [storeId]
  );
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  async function setStatus(o, status) {
    setBusy(true);
    try {
      await callBackend('PATCH', `/api/v1/orders/${o.order_id}/status`, { status });
      toast.success('Order updated', `${o.order_id} → ${status}`);
      orders.refresh();
    } catch (e) {
      toast.error('Status update failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeOrder(o) {
    const ok = await confirm({
      title: `Delete order ${o.order_id}?`,
      message: 'This removes the order record permanently.',
      confirmLabel: 'Delete order',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await callBackend('POST', '/api/v1/debug/data/delete-order', { params: [o.order_id] });
      toast.success('Order deleted', o.order_id);
      orders.refresh();
    } catch (e) {
      toast.error('Delete failed', e.message);
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
      <ErrorBanner error={orders.error} />
      <div className="card">
        {orders.loading && <Loading rows={6} />}
        {orders.data && !orders.loading && (orders.data.data || []).length === 0 && (
          <EmptyState art="briefcase" title={`No orders for ${storeId}`} hint="Orders appear once the simulation or mobile app creates them for this store." />
        )}
        {orders.data && (
          <DataTable
            columns={[
              { key: 'order_id', label: 'Order', width: 180, render: (o) => <span className="mono">{o.order_id}</span> },
              { key: 'store_id', label: 'Store', width: 110 },
              {
                key: 'items',
                label: 'Items',
                width: 90,
                align: 'num',
                // A raw JSON blob was unreadable and dominated the row width.
                // The count is the fact an operator actually scans for.
                render: (o) => {
                  const n = Array.isArray(o.items) ? o.items.length : 0;
                  return n ? `${n} item${n === 1 ? '' : 's'}` : '—';
                },
              },
              {
                key: 'total_amount',
                label: 'Total',
                align: 'num',
                width: 110,
                render: (o) => inr(o.total_amount, true),
              },
              {
                key: 'status',
                label: 'Status',
                width: 140,
                render: (o) => (
                  <select value={o.status} disabled={busy} onChange={(e) => setStatus(o, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ),
              },
              {
                key: 'created_at',
                label: 'Created',
                width: 120,
                render: (o) => dateTime(o.created_at),
              },
            ]}
            rows={orders.data.data || []}
            actions={(o) => <button className="danger" disabled={busy} onClick={() => removeOrder(o)}>Delete</button>}
          />
        )}
      </div>
    </div>
  );
}
