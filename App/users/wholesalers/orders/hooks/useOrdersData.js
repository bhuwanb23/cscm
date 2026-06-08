import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPatch, apiPost } from '../../../../src/api/apiClient';
import { WHOLESALER_DEFAULT_ORDERS as DEFAULT_ORDERS } from '../../../../src/demo';

const WHOLESALER_ID = 'WHOLE-001';

function normalizeOrder(raw, index) {
  return {
    id: raw.order_id || raw.id || `WO-${1000 + index}`,
    retailer: raw.store_id || raw.retailer || 'Retailer',
    items: Number(raw.item_count || (Array.isArray(raw.items) ? raw.items.length : 0)),
    value: Number(raw.total_amount || raw.value || 0),
    status: (raw.status || 'pending').toLowerCase(),
    priority: (raw.priority || 'normal').toLowerCase(),
    date: raw.submitted_at || raw.created_at || raw.date || '',
  };
}

export const useOrdersData = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [localOrders, setLocalOrders] = useState([]);

  const orders = useApiQuery('ORDERS_CRUD', 'listByStore', { params: { storeId: WHOLESALER_ID } });

  const allOrders = useMemo(() => {
    if (orders.data) {
      const raw = Array.isArray(orders.data) ? orders.data
        : Array.isArray(orders.data.orders) ? orders.data.orders
        : null;
      if (raw && raw.length > 0) return raw.map((o, i) => normalizeOrder(o, i));
    }
    if (localOrders.length > 0) return localOrders;
    return DEFAULT_ORDERS;
  }, [orders.data, localOrders]);

  const counts = useMemo(() => ({
    all: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    approved: allOrders.filter(o => o.status === 'approved').length,
    dispatched: allOrders.filter(o => o.status === 'dispatched').length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
  }), [allOrders]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return allOrders;
    return allOrders.filter(o => o.status === activeFilter);
  }, [allOrders, activeFilter]);

  const updateStatus = useCallback(async (orderId, newStatus) => {
    setLocalOrders(prev => {
      const base = prev.length > 0 ? prev : DEFAULT_ORDERS;
      return base.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    });
    try {
      await apiPatch(`/api/v1/orders/${encodeURIComponent(orderId)}/status`, { body: { status: newStatus } });
      orders.refetch();
    } catch {}
  }, [orders]);

  const approveOrder = useCallback((orderId) => updateStatus(orderId, 'approved'), [updateStatus]);
  const dispatchOrder = useCallback((orderId) => updateStatus(orderId, 'dispatched'), [updateStatus]);
  const rejectOrder = useCallback((orderId) => updateStatus(orderId, 'rejected'), [updateStatus]);

  return {
    orders: filtered,
    counts,
    activeFilter,
    setActiveFilter,
    approveOrder,
    dispatchOrder,
    rejectOrder,
    loading: orders.loading,
    error: orders.error,
    refetch: orders.refetch,
  };
};
