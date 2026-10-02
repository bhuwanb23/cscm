import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, DataTable, EmptyState, useAsyncData } from '../components/ui.jsx';
import { api, callBackend } from '../api/client.jsx';
import { useConfirm } from '../state/ConfirmContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

export default function Inventory() {
  const [storeId, setStoreId] = useState('STORE001');
  const inv = useAsyncData(
    () => api.get(`/api/data/inventory/${encodeURIComponent(storeId)}`),
    [storeId]
  );
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  async function saveQuantity(item, value) {
    setBusy(true);
    try {
      await callBackend('PUT', `/api/v1/inventory/${item.store_id}/${item.product_id}/quantity`, { quantity: Number(value) });
      toast.success('Stock updated', `${item.product_id} → ${value}`);
      inv.refresh();
    } catch (e) {
      toast.error('Update failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item) {
    const ok = await confirm({
      title: `Delete inventory for ${item.product_id}?`,
      message: `This removes the stock record for ${item.store_id} / ${item.product_id}.`,
      confirmLabel: 'Delete record',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await callBackend('POST', '/api/v1/debug/data/delete-inventory', {
        params: [item.store_id, item.product_id],
      });
      toast.success('Inventory deleted', item.product_id);
      inv.refresh();
    } catch (e) {
      toast.error('Delete failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock levels per store — edits go through the gateway inventory API"
        actions={
          <>
            <input value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="store id" style={{ width: 140 }} />
            <button className="secondary" onClick={inv.refresh}>Reload</button>
          </>
        }
      />
      <ErrorBanner error={inv.error} />
      <div className="card">
        {inv.loading && <Loading rows={6} />}
        {inv.data && !inv.loading && (inv.data.data || []).length === 0 && (
          <EmptyState art="package" title={`No inventory for ${storeId}`} hint="Stock records appear once created via the mobile app, simulation or SQL console." />
        )}
        {inv.data && (
          <DataTable
            columns={[
              { key: 'store_id', label: 'Store' },
              { key: 'product_id', label: 'Product' },
              { key: 'quantity', label: 'Qty' },
              {
                key: 'min_stock_level',
                label: 'Reorder point',
                render: (it) => {
                  const rop = it.min_stock_level ?? it.reorder_point ?? null;
                  return (
                    <span className={rop !== null && it.quantity <= rop ? 'error-text' : ''}>
                      {rop ?? '—'}
                    </span>
                  );
                },
              },
              {
                key: '_edit',
                label: 'Set qty',
                render: (it) => (
                  <form
                    className="row"
                    style={{ gap: 6 }}
                    onSubmit={(e) => { e.preventDefault(); saveQuantity(it, e.target.elements.qty.value); }}
                  >
                    <input name="qty" type="number" defaultValue={it.quantity} style={{ width: 80 }} />
                    <button className="secondary" disabled={busy}>Save</button>
                  </form>
                ),
              },
            ]}
            rows={inv.data.data || []}
            actions={(it) => <button className="danger" disabled={busy} onClick={() => removeItem(it)}>Delete</button>}
          />
        )}
      </div>
    </div>
  );
}
