import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPatch } from '../../../../src/api/apiClient';
import { WHOLESALER_DEFAULT_SHIPMENTS as DEFAULT_SHIPMENTS } from '../../../../src/demo';

const WHOLESALER_ID = 'WHOLE-001';

function normalizeShipment(raw, index) {
  return {
    id: raw.shipment_id || raw.id || `WS-${2000 + index}`,
    retailer: raw.store_id || raw.destination || raw.recipient || 'Retailer',
    items: Number(raw.item_count || (Array.isArray(raw.items) ? raw.items.length : 0)),
    status: (raw.status || 'pending').toLowerCase(),
    eta: raw.eta || raw.estimated_arrival || 'TBD',
    carrier: raw.carrier || raw.transporter || 'Carrier',
    tracking: raw.tracking_id || raw.tracking || '',
  };
}

export const useShipmentsData = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const inTransit = useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' } });
  const delivered = useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'delivered' } });

  const allShipments = useMemo(() => {
    const lists = [inTransit.data, delivered.data]
      .filter(Boolean)
      .map(d => Array.isArray(d) ? d : (Array.isArray(d.shipments) ? d.shipments : []));
    const flat = lists.flat();
    if (flat.length === 0) return DEFAULT_SHIPMENTS;
    return flat.map((s, i) => normalizeShipment(s, i));
  }, [inTransit.data, delivered.data]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return allShipments;
    return allShipments.filter(s => s.status === activeFilter);
  }, [allShipments, activeFilter]);

  const updateStatus = useCallback(async (shipmentId, newStatus) => {
    try { await apiPatch(`/api/v1/shipments/${encodeURIComponent(shipmentId)}/status`, { body: { status: newStatus } }); inTransit.refetch(); delivered.refetch(); } catch {}
  }, [inTransit, delivered]);

  return {
    shipments: filtered,
    counts: {
      all: allShipments.length,
      in_transit: allShipments.filter(s => s.status === 'in_transit').length,
      dispatched: allShipments.filter(s => s.status === 'dispatched').length,
      delivered: allShipments.filter(s => s.status === 'delivered').length,
    },
    activeFilter,
    setActiveFilter,
    updateStatus,
    loading: inTransit.loading || delivered.loading,
    error: inTransit.error || delivered.error,
    refetch: () => { inTransit.refetch(); delivered.refetch(); },
  };
};
