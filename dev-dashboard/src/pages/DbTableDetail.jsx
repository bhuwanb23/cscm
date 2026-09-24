import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader, Loading, ErrorBanner, DataTable, JsonView, useAsyncData } from '../components/ui.jsx';
import { api, callBackend } from '../api/client.jsx';
import { useConfirm } from '../state/ConfirmContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

// Primary-key columns + guarded delete action per table (backend WRITE_ACTIONS).
const PK_BY_TABLE = {
  users: { pk: ['id'], action: 'delete-user' },
  orders: { pk: ['order_id'], action: 'delete-order' },
  shipments: { pk: ['shipment_id'], action: 'delete-shipment' },
  inventory: { pk: ['store_id', 'product_id'], action: 'delete-inventory' },
};

export default function DbTableDetail() {
  const { table } = useParams();
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const schema = useAsyncData(() => api.get(`/api/db/tables/${table}/schema`), [table]);
  const rows = useAsyncData(
    () => api.get(`/api/db/tables/${table}/rows?limit=${limit}&offset=${offset}`),
    [table, offset]
  );
  const [busy, setBusy] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  async function deleteRow(row) {
    const spec = PK_BY_TABLE[table];
    if (!spec) {
      toast.warn('No guarded delete', `No delete action registered for "${table}". Use the SQL console with care.`);
      return;
    }
    const ok = await confirm({
      title: `Delete this row from ${table}?`,
      message: `Matched on ${spec.pk.join(' + ')} — this cannot be undone.`,
      confirmLabel: 'Delete row',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await callBackend('POST', `/api/v1/debug/data/${spec.action}`, {
        params: spec.pk.map((k) => row[k]),
      });
      toast.success('Row deleted', `${table} row removed.`);
      rows.refresh();
    } catch (e) {
      toast.error('Delete failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  const columns = (schema.data?.data?.columns || []).map((c) => ({
    key: c.name,
    label: `${c.name}${c.pk ? ' 🔑' : ''}`,
  }));

  return (
    <div>
      <PageHeader
        title={`Table: ${table}`}
        subtitle={`${schema.data?.data?.columns?.length || '?'} columns · showing rows ${offset}–${offset + limit}`}
        actions={
          <>
            <Link to="/db/tables"><button className="secondary">← All tables</button></Link>
            <button className="secondary" onClick={rows.refresh}>Reload</button>
          </>
        }
      />
      <ErrorBanner error={schema.error || rows.error} />

      <div className="card">
        <h3>Schema</h3>
        {schema.loading && <Loading rows={4} />}
        {schema.data && (
          <table className="data-table">
            <thead><tr><th>Column</th><th>Type</th><th>Nullable</th><th>Default</th></tr></thead>
            <tbody>
              {(schema.data.data.columns || []).map((c) => (
                <tr key={c.name}>
                  <td>{c.name}{c.pk ? ' 🔑' : ''}</td>
                  <td>{c.type}</td>
                  <td>{c.nullable ? 'yes' : 'no'}</td>
                  <td>{c.default ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Rows</h3>
        {rows.loading && <Loading rows={6} />}
        {rows.data && (
          <>
            <DataTable
              columns={columns}
              rows={rows.data.data?.rows || []}
              keyField={columns[0]?.key}
              actions={(row) => (
                <button className="danger" disabled={busy} onClick={() => deleteRow(row)}>Delete</button>
              )}
            />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>← Prev</button>
              <button className="secondary" onClick={() => setOffset(offset + limit)}>Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
