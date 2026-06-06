import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPost } from '../../../../src/api/apiClient';

const DEFAULT_NODES = [
  { id: 's1', type: 'shopkeeper', label: 'Fresh Mart', status: 'active', region: 'South' },
  { id: 's2', type: 'shopkeeper', label: 'City Grocer', status: 'active', region: 'North' },
  { id: 's3', type: 'shopkeeper', label: 'Quick Stop', status: 'inactive', region: 'East' },
  { id: 'w1', type: 'wholesaler', label: 'CSCM Wholesale', status: 'active', region: 'HQ' },
  { id: 'wh1', type: 'warehouse', label: 'Warehouse A', status: 'active', region: 'South', utilization: 0.78 },
  { id: 'wh2', type: 'warehouse', label: 'Warehouse B', status: 'warning', region: 'West', utilization: 0.92 },
  { id: 't1', type: 'transporter', label: 'FedEx Express', status: 'active', region: 'Pan-India' },
  { id: 't2', type: 'transporter', label: 'DHL Logistics', status: 'active', region: 'Pan-India' },
  { id: 'p1', type: 'central-planner', label: 'Central Planner', status: 'active', region: 'HQ' },
];

export const useNetworkData = () => {
  const [selectedType, setSelectedType] = useState('all');
  const inventory = useApiQuery('INVENTORY_CRUD', 'listByStore', { params: { storeId: 'MESH-AGG' }, skip: true });
  const orders = useApiQuery('ORDERS_CRUD', 'listByStore', { params: { storeId: 'MESH-AGG' }, skip: true });
  const alerts = useApiQuery('CENTRAL_PLANNER', 'anomalyAlertList', { params: { limit: 20 } });

  const nodes = useMemo(() => {
    if (alerts.data) {
      const raw = Array.isArray(alerts.data) ? alerts.data
        : Array.isArray(alerts.data.alerts) ? alerts.data.alerts
        : Array.isArray(alerts.data.anomalies) ? alerts.data.anomalies
        : null;
      if (raw && raw.length > 0 && raw[0].nodes) return raw[0].nodes;
    }
    return DEFAULT_NODES;
  }, [alerts.data]);

  const counts = useMemo(() => ({
    all: nodes.length,
    shopkeeper: nodes.filter(n => n.type === 'shopkeeper').length,
    wholesaler: nodes.filter(n => n.type === 'wholesaler').length,
    warehouse: nodes.filter(n => n.type === 'warehouse').length,
    transporter: nodes.filter(n => n.type === 'transporter').length,
    'central-planner': nodes.filter(n => n.type === 'central-planner').length,
  }), [nodes]);

  const filtered = useMemo(() => {
    if (selectedType === 'all') return nodes;
    return nodes.filter(n => n.type === selectedType);
  }, [nodes, selectedType]);

  return {
    nodes: filtered,
    counts,
    selectedType,
    setSelectedType,
    loading: alerts.loading,
    error: alerts.error,
    refetch: alerts.refetch,
  };
};
