import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPost, apiPatch } from '../../../../src/api/apiClient';

const TRANSPORTER_ID = 'TRANS-001';

function parsePrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const m = String(priceStr).replace(/[^0-9.]/g, '');
  return parseFloat(m) || 0;
}

function defaultQuickStats() {
  return {
    pendingDeliveries: 12,
    pendingDeliveriesProgress: 45,
    scheduledPickups: 4,
    scheduledPickupsProgress: 25,
  };
}

function defaultNextTask() {
  return {
    priority: 'High',
    distance: '2.4 miles away',
    eta: '10:45 AM',
    storeName: 'Whole Foods Market',
    storeAddress: '1200 Broadway, Seattle, WA',
    orderId: '#ORD-9921',
    packages: '15 Boxes',
    weight: '320 lbs',
    type: 'DELIVERY',
  };
}

function defaultRouteProgress() {
  return { completed: 4, total: 16 };
}

function defaultAlerts() {
  return [
    {
      id: 'traffic',
      type: 'warning',
      title: 'Traffic Delay Detected',
      description: 'Estimated +15 mins on I-5 South. Rerouting recommended.',
    },
    {
      id: 'pickup',
      type: 'info',
      title: 'New Pickup Added',
      description: 'Stop added to route: TechHub Logistics (Order #993)',
      hasViewDetails: true,
    },
  ];
}

function defaultStops() {
  return [
    { id: 's1', time: '11:30', period: 'AM', name: 'Starbucks Reserve', type: 'Delivery', details: '3 Boxes', completed: false },
    { id: 's2', time: '12:15', period: 'PM', name: 'Amazon Hub Locker', type: 'Pickup', details: '12 Packages', completed: false },
    { id: 's3', time: '01:45', period: 'PM', name: 'Best Buy Warehouse', type: 'Delivery', details: 'Pallet', completed: true },
  ];
}

function normalizeShipment(raw, index) {
  return {
    id: raw.shipment_id || raw.id || `SHP-${index}`,
    priority: raw.priority || 'High',
    distance: raw.distance || 'TBD',
    eta: raw.eta || raw.estimated_arrival || 'TBD',
    storeName: raw.store_name || raw.destination || raw.recipient || 'Destination',
    storeAddress: raw.address || raw.destination_address || '',
    orderId: raw.order_id || raw.id || '',
    packages: raw.item_count ? `${raw.item_count} Boxes` : (raw.packages || '—'),
    weight: raw.weight || '',
    type: (raw.task_type || raw.type || 'DELIVERY').toString().toUpperCase(),
  };
}

function normalizeStop(raw, index) {
  return {
    id: raw.stop_id || raw.id || `STOP-${index}`,
    time: raw.time || '',
    period: raw.period || 'AM',
    name: raw.name || raw.destination || 'Stop',
    type: raw.type || 'Delivery',
    details: raw.details || raw.items || '',
    completed: Boolean(raw.completed),
  };
}

function summarizeShipments(shipments) {
  const all = Array.isArray(shipments) ? shipments : [];
  const pending = all.filter(s => {
    const st = (s.status || '').toLowerCase();
    return ['in_transit', 'out_for_delivery', 'arriving_soon', 'pending'].includes(st) || !st;
  });
  return {
    pendingDeliveries: pending.length || defaultQuickStats().pendingDeliveries,
    pendingDeliveriesProgress: Math.min(100, Math.round((pending.length / Math.max(all.length, 1)) * 100)),
    scheduledPickups: all.filter(s => (s.task_type || '').toLowerCase() === 'pickup').length || defaultQuickStats().scheduledPickups,
    scheduledPickupsProgress: 25,
  };
}

export const useDashboardData = () => {
  const activeShipments = useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' } });
  const alerts = useApiQuery('CENTRAL_PLANNER', 'anomalyAlertList', { params: { limit: 5 } });
  const [stopState, setStopState] = useState([]);

  const rawShipments = useMemo(() => {
    if (!activeShipments.data) return [];
    return Array.isArray(activeShipments.data) ? activeShipments.data
      : Array.isArray(activeShipments.data.shipments) ? activeShipments.data.shipments
      : [];
  }, [activeShipments.data]);

  const quickStats = useMemo(() => {
    if (rawShipments.length === 0) return defaultQuickStats();
    return summarizeShipments(rawShipments);
  }, [rawShipments]);

  const nextTask = useMemo(() => {
    if (rawShipments.length === 0) return defaultNextTask();
    return normalizeShipment(rawShipments[0], 0);
  }, [rawShipments]);

  const routeProgress = useMemo(() => {
    if (rawShipments.length === 0) return defaultRouteProgress();
    const total = rawShipments.length;
    const completed = rawShipments.filter(s => (s.status || '').toLowerCase() === 'delivered').length;
    return { completed: completed || 1, total: total || 16 };
  }, [rawShipments]);

  const dashboardAlerts = useMemo(() => {
    if (alerts.data) {
      const raw = Array.isArray(alerts.data) ? alerts.data
        : Array.isArray(alerts.data.alerts) ? alerts.data.alerts
        : Array.isArray(alerts.data.anomalies) ? alerts.data.anomalies
        : null;
      if (raw && raw.length > 0) {
        return raw.slice(0, 4).map((a, i) => ({
          id: a.alert_id || a.id || `ALERT-${i}`,
          type: (a.severity || 'info').toLowerCase() === 'critical' ? 'warning' : 'info',
          title: a.title || a.message || 'Alert',
          description: a.description || a.message || '',
          hasViewDetails: true,
        }));
      }
    }
    return defaultAlerts();
  }, [alerts.data]);

  const upcomingStops = useMemo(() => {
    if (rawShipments.length === 0) {
      if (stopState.length > 0) return stopState;
      return defaultStops();
    }
    return rawShipments.slice(0, 6).map((s, i) => normalizeStop(s, i));
  }, [rawShipments, stopState]);

  const startRoute = useCallback(async (shipmentId) => {
    if (!shipmentId) return;
    try {
      await apiPatch(`/api/v1/shipments/${encodeURIComponent(shipmentId)}/status`, { body: { status: 'out_for_delivery' } });
    } catch {}
  }, []);

  const acknowledgeAlert = useCallback(async (alertId) => {
    if (!alertId) return;
    try {
      await apiPost(`/api/v1/central-planner/alerts/${encodeURIComponent(alertId)}/acknowledge`, { body: {} });
    } catch {}
  }, []);

  return {
    transporterId: TRANSPORTER_ID,
    quickStats,
    nextTask,
    routeProgress,
    dashboardAlerts,
    upcomingStops,
    startRoute,
    acknowledgeAlert,
    loading: activeShipments.loading || alerts.loading,
    error: activeShipments.error || alerts.error,
    refetch: () => { activeShipments.refetch(); alerts.refetch(); },
  };
};
