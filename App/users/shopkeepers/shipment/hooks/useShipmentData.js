import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPatch } from '../../../../src/api/apiClient';
import { SHIPMENT_CONSTANTS } from '../constants';

const SHOP_ID = 'SHOP-001';

const ACTIVE_STATUSES = ['in_transit', 'arriving_soon', 'out_for_delivery', 'delayed'];

const STATUS_META = {
  in_transit: { icon: 'location-dot', iconColor: '#3B82F6', actionText: 'View Details', actionColor: '#3B82F6' },
  arriving_soon: { icon: 'location-dot', iconColor: '#10B981', actionText: 'Confirm Delivery', actionColor: '#10B981' },
  delayed: { icon: 'triangle-exclamation', iconColor: '#F59E0B', actionText: 'View Details', actionColor: '#3B82F6' },
  out_for_delivery: { icon: 'truck', iconColor: '#A855F7', actionText: 'Track Live', actionColor: '#3B82F6' },
  delivered: { icon: 'shield-alt', iconColor: '#10B981', actionText: 'View Receipt', actionColor: '#10B981' },
  unknown: { icon: 'location-dot', iconColor: '#6B7280', actionText: 'View Details', actionColor: '#3B82F6' },
};

function normalizeShipment(raw, index) {
  const status = (raw.status || 'in_transit').toLowerCase().replace(/[\s-]/g, '_');
  const meta = STATUS_META[status] || STATUS_META.unknown;
  return {
    id: raw.shipment_id || raw.id || `SH-${index}`,
    title: raw.title || raw.description || raw.origin || 'Shipment',
    description: raw.description || '',
    status,
    progress: typeof raw.progress === 'number' ? raw.progress : (status === 'delivered' ? 100 : 50),
    eta: raw.eta || raw.estimated_arrival || raw.arrival_time || 'TBD',
    transporter: raw.transporter || raw.carrier || 'Carrier',
    distance: raw.distance || '',
    icon: meta.icon,
    iconColor: meta.iconColor,
    actionText: meta.actionText,
    actionColor: meta.actionColor,
    orderValue: raw.order_value || raw.value || '',
    items: raw.item_count || raw.items || 0,
    weight: raw.weight || '',
    dimensions: raw.dimensions || '',
  };
}

function filterShipmentsByTab(shipments, activeFilter) {
  switch (activeFilter) {
    case 'active':
      return shipments.filter(s => ACTIVE_STATUSES.includes(s.status));
    case 'delivered':
      return shipments.filter(s => s.status === 'delivered');
    case 'delayed':
      return shipments.filter(s => s.status === 'delayed');
    case 'all':
    default:
      return shipments;
  }
}

export const useShipmentData = () => {
  const [activeFilter, setActiveFilter] = useState('active');
  const [isMapViewEnabled, setIsMapViewEnabled] = useState(true);
  const [localShipments, setLocalShipments] = useState([]);

  const allShipments = useApiQuery('SHIPMENTS', 'listByStore', { params: { storeId: SHOP_ID } });
  const deliveredShipments = useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'delivered' } });

  const sourceShipments = useMemo(() => {
    if (allShipments.data) {
      const raw = Array.isArray(allShipments.data) ? allShipments.data
        : Array.isArray(allShipments.data.shipments) ? allShipments.data.shipments
        : null;
      if (raw) return raw.map((r, i) => normalizeShipment(r, i));
    }
    if (localShipments.length > 0) return localShipments;
    return SHIPMENT_CONSTANTS.SAMPLE_SHIPMENTS;
  }, [allShipments.data, localShipments]);

  const recentDeliveries = useMemo(() => {
    if (deliveredShipments.data) {
      const raw = Array.isArray(deliveredShipments.data) ? deliveredShipments.data
        : Array.isArray(deliveredShipments.data.shipments) ? deliveredShipments.data.shipments
        : null;
      if (raw) return raw.slice(0, 4).map((r, i) => ({
        id: r.shipment_id || r.id || `SH-DEL-${i}`,
        title: r.title || r.description || 'Delivered shipment',
        deliveredAt: r.delivered_at || r.eta || 'Delivered recently',
        itemCount: r.item_count ? `${r.item_count} items` : `${r.items || 0} items`,
        status: 'delivered',
        orderValue: r.order_value || r.value || '',
        transporter: r.transporter || r.carrier || 'Carrier',
      }));
    }
    return SHIPMENT_CONSTANTS.RECENT_DELIVERIES;
  }, [deliveredShipments.data]);

  const shipments = useMemo(
    () => filterShipmentsByTab(sourceShipments, activeFilter),
    [sourceShipments, activeFilter]
  );

  const getStatusStyle = useCallback((status) => {
    const key = (status || 'in_transit').toUpperCase().replace(/[\s-]/g, '_');
    return SHIPMENT_CONSTANTS.SHIPMENT_STATUS[key] || SHIPMENT_CONSTANTS.SHIPMENT_STATUS.IN_TRANSIT;
  }, []);

  const updateShipmentStatus = useCallback((shipmentId, newStatus) => {
    setLocalShipments(prev => {
      const base = prev.length > 0 ? prev : SHIPMENT_CONSTANTS.SAMPLE_SHIPMENTS;
      return base.map(s => s.id === shipmentId ? { ...s, status: newStatus } : s);
    });
    apiPatch(`/api/v1/shipments/${encodeURIComponent(shipmentId)}/status`, { body: { status: newStatus } })
      .catch(() => {});
  }, []);

  const confirmDelivery = useCallback((shipmentId) => {
    updateShipmentStatus(shipmentId, 'delivered');
  }, [updateShipmentStatus]);

  return {
    shipments,
    activeFilter,
    setActiveFilter,
    isMapViewEnabled,
    setIsMapViewEnabled,
    recentDeliveries,
    getStatusStyle,
    updateShipmentStatus,
    confirmDelivery,
    loading: allShipments.loading || deliveredShipments.loading,
    error: allShipments.error || deliveredShipments.error,
    refetch: () => { allShipments.refetch(); deliveredShipments.refetch(); },
  };
};
