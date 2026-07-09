import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPost } from '../../../../src/api/apiClient';
import {
  WHOLESALER_DEFAULT_STATS as DEFAULT_STATS,
  WHOLESALER_DEFAULT_TOP_RETAILERS as DEFAULT_TOP_RETAILERS,
  WHOLESALER_DEFAULT_RECENT_ORDERS as DEFAULT_RECENT_ORDERS,
} from '../../../../src/demo';
import { WHOLESALER_ID } from '../../../../src/constants/storeIds';

function parseOrder(raw, index) {
  return {
    id: raw.order_id || raw.id || `WO-${1000 + index}`,
    retailer: raw.store_id || raw.retailer || raw.retailer_name || 'Retailer',
    items: Number(raw.item_count || (Array.isArray(raw.items) ? raw.items.length : 0)),
    value: Number(raw.total_amount || raw.value || 0),
    status: (raw.status || 'pending').toLowerCase(),
  };
}

function summarizeOrders(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return DEFAULT_STATS;
  const today = orders.filter(o => o.status !== 'delivered');
  const pending = orders.filter(o => ['pending', 'approved'].includes(o.status));
  const value = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  return {
    todayOrders: orders.length,
    pendingFulfillment: pending.length,
    lowStockItems: DEFAULT_STATS.lowStockItems,
    monthlyRevenue: value || DEFAULT_STATS.monthlyRevenue,
    fulfillmentRate: DEFAULT_STATS.fulfillmentRate,
  };
}

export const useDashboardData = () => {
  const orders = useApiQuery('ORDERS_CRUD', 'listByStore', { params: { storeId: WHOLESALER_ID } });
  const inventory = useApiQuery('INVENTORY_CRUD', 'listByStore', { params: { storeId: WHOLESALER_ID } });

  const rawOrders = useMemo(() => {
    if (!orders.data) return [];
    return Array.isArray(orders.data) ? orders.data
      : Array.isArray(orders.data.orders) ? orders.data.orders
      : [];
  }, [orders.data]);

  const rawInventory = useMemo(() => {
    if (!inventory.data) return [];
    return Array.isArray(inventory.data) ? inventory.data
      : Array.isArray(inventory.data.items) ? inventory.data.items
      : [];
  }, [inventory.data]);

  const stats = useMemo(() => {
    const base = summarizeOrders(rawOrders);
    if (rawInventory.length > 0) {
      const low = rawInventory.filter(i => Number(i.quantity || 0) <= Number(i.reorder_point || 0)).length;
      return { ...base, lowStockItems: low };
    }
    return base;
  }, [rawOrders, rawInventory]);

  const recentOrders = useMemo(() => {
    if (rawOrders.length === 0) return DEFAULT_RECENT_ORDERS;
    return rawOrders.slice(0, 5).map((o, i) => parseOrder(o, i));
  }, [rawOrders]);

  const topRetailers = useMemo(() => {
    if (rawOrders.length === 0) return DEFAULT_TOP_RETAILERS;
    const byRetailer = new Map();
    rawOrders.forEach(o => {
      const k = o.store_id || o.retailer || 'unknown';
      const cur = byRetailer.get(k) || { id: k, name: k, orders: 0, value: 0 };
      cur.orders += 1;
      cur.value += Number(o.total_amount || 0);
      byRetailer.set(k, cur);
    });
    return Array.from(byRetailer.values()).sort((a, b) => b.value - a.value).slice(0, 3);
  }, [rawOrders]);

  const approveOrder = useCallback(async (orderId) => {
    try { await apiPost(`/api/v1/orders/${encodeURIComponent(orderId)}/approve`, { body: {} }); orders.refetch(); } catch {}
  }, [orders]);

  return {
    stats,
    recentOrders,
    topRetailers,
    approveOrder,
    loading: orders.loading || inventory.loading,
    error: orders.error || inventory.error,
    refetch: () => { orders.refetch(); inventory.refetch(); },
  };
};
