import { useEffect, useRef, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';

const SHOP_ID = 'SHOP-001';

const FALLBACK_STOCK_LEVELS = { good: 124, low: 18, critical: 7 };
const FALLBACK_SHIPMENTS = [
  { id: 'SH001', items: 'Electronics & Accessories', eta: 'Today, 3:00 PM', status: 'in_transit' },
  { id: 'SH002', items: 'Home & Garden', eta: 'Tomorrow, 10:00 AM', status: 'preparing' },
];
const FALLBACK_ALERTS = [
  { id: 1, type: 'critical', title: 'Critical Stock Level', message: 'iPhone 14 cases below minimum threshold', time: '2 minutes ago' },
  { id: 2, type: 'warning', title: 'Delivery Delay', message: 'Shipment #SH003 delayed by 2 hours', time: '15 minutes ago' },
  { id: 3, type: 'success', title: 'Stock Replenished', message: 'Wireless headphones restocked successfully', time: '1 hour ago' },
];

function aggregateStockLevels(items) {
  if (!Array.isArray(items)) return FALLBACK_STOCK_LEVELS;
  let good = 0, low = 0, critical = 0;
  for (const item of items) {
    const qty = Number(item.quantity ?? item.current_stock ?? item.on_hand ?? 0);
    const reorder = Number(item.reorder_point ?? item.safety_stock ?? 0);
    if (qty <= 0) critical += 1;
    else if (qty <= reorder) low += 1;
    else good += 1;
  }
  return { good, low, critical, total: good + low + critical };
}

function normalizeShipments(raw) {
  if (!Array.isArray(raw)) return FALLBACK_SHIPMENTS;
  return raw.map((s, i) => ({
    id: s.shipment_id || s.id || `SH-${i}`,
    items: s.items || s.description || s.destination || 'Shipment',
    eta: s.eta || s.estimated_arrival || s.arrival_time || 'TBD',
    status: (s.status || 'in_transit').toLowerCase().replace(/[\s-]/g, '_'),
  }));
}

function normalizeAlerts(raw) {
  if (!Array.isArray(raw)) return FALLBACK_ALERTS;
  return raw.map((a, i) => ({
    id: a.alert_id || a.id || `ALERT-${i}`,
    type: a.severity || a.type || 'info',
    title: a.title || a.alert_type || 'Alert',
    message: a.message || a.description || '',
    time: a.detected_at || a.timestamp || 'recently',
  }));
}

export const useDashboardData = () => {
  const inventory = useApiQuery('INVENTORY_CRUD', 'listByStore', { params: { storeId: SHOP_ID } });
  const shipments = useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' } });
  const alerts = useApiQuery('CENTRAL_PLANNER', 'anomalyAlertList', { params: { status: 'active', limit: 5 } });

  const [isLive, setIsLive] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setIsLive(prev => !prev), 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const inventoryOk = inventory.data && Array.isArray(inventory.data.items || inventory.data);
  const stockLevels = inventoryOk ? aggregateStockLevels(inventory.data.items || inventory.data) : FALLBACK_STOCK_LEVELS;
  const shipmentList = shipments.data ? normalizeShipments(shipments.data.shipments || shipments.data) : FALLBACK_SHIPMENTS;
  const alertList = alerts.data ? normalizeAlerts(alerts.data.alerts) : FALLBACK_ALERTS;

  return {
    stockLevels,
    shipments: shipmentList,
    alerts: alertList,
    isLive,
    loading: inventory.loading || shipments.loading || alerts.loading,
    error: inventory.error || shipments.error || alerts.error,
    refetch: () => { inventory.refetch(); shipments.refetch(); alerts.refetch(); },
  };
};
