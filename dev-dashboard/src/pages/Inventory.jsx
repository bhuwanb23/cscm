import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, DataTable, useAsyncData } from '../components/ui.jsx';
import { api, callBackend } from '../api/client.jsx';

export default function Inventory() {
  const [storeId, setStoreId] = useState('store-1');
  const inv = useAsyncData(
    () => api.get(`/api/data/inventory/${encodeURIComponent(storeId)}`),
    [storeId]
  );
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function saveQuantity(item, value) {
    setBusy(true);
    setNote(null);
    try {
      await callBackend('PUT', `/api/v1/inventory/${item.store_id}/${item.product_id}/quantity`, { quantity: Number(value) });
      setNote(`Updated ${item.product_id} → ${value}`);
      inv.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`Delete inventory for ${item.product_id}?`)) return;
    setBusy(true);
    try {
      await callBackend('POST', '/api/v1/debug/data/delete-inventory', {
        params: [item.store_id, item.product_id],
      });
      setNote(`Deleted ${item.product_id}`);
      inv.refresh();
    } catch (e) {
      setNote(`Failed: ${e.message}`);
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
      {note && <div className="card muted">{note}</div>}
      <ErrorBanner error={inv.error} />
      <div className="card">
        {inv.loading && <Loading />}
        {inv.data && (
          <DataTable
            columns={[
              { key: 'store_id', label: 'Store' },
              { key: 'product_id', label: 'Product' },
              { key: 'quantity', label: 'Qty' },
              {
                key: 'reorder_point',
                label: 'Reorder point',
                render: (it) => <span className={it.quantity <= (it.reorder_point ?? 0) ? 'error-text' : ''}>{it.reorder_point ?? '—'}</span>,
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
