import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, DataTable, useAsyncData } from '../components/ui.jsx';
import { api, callBackend } from '../api/client.jsx';
import { useConfirm } from '../state/ConfirmContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [storeId, setStoreId] = useState('store-1');
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
