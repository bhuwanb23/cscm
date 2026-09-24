import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader, Loading, ErrorBanner, DataTable, useAsyncData } from '../components/ui.jsx';
import { api } from '../api/client.jsx';

export default function StoreDetail() {
  const { storeId } = useParams();
  const inv = useAsyncData(() => api.get(`/api/data/inventory/${encodeURIComponent(storeId)}`), [storeId]);
  const orders = useAsyncData(() => api.get(`/api/data/orders/${encodeURIComponent(storeId)}`), [storeId]);

  return (
    <div>
      <PageHeader
        title={`Store: ${storeId}`}
        subtitle="Combined inventory + order view"
        actions={<Link to="/db/tables"><button className="secondary">Raw tables</button></Link>}
      />
      <div className="grid-2">
        <div className="card">
          <h3>Inventory ({inv.data?.data?.length ?? '…'})</h3>
          <ErrorBanner error={inv.error} />
          {inv.loading && <Loading rows={5} />}
          {inv.data && (
            <DataTable
              columns={[
                { key: 'product_id', label: 'Product' },
                { key: 'quantity', label: 'Qty' },
                { key: 'reorder_point', label: 'ROP' },
              ]}
              rows={inv.data.data || []}
            />
          )}
        </div>
        <div className="card">
          <h3>Recent orders ({orders.data?.data?.length ?? '…'})</h3>
          <ErrorBanner error={orders.error} />
          {orders.loading && <Loading rows={5} />}
          {orders.data && (
            <DataTable
              columns={[
                { key: 'order_id', label: 'Order' },
                { key: 'status', label: 'Status' },
                { key: 'total_amount', label: 'Total' },
              ]}
              rows={orders.data.data || []}
            />
          )}
        </div>
      </div>
    </div>
  );
}
