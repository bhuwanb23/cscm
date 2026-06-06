import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPatch } from '../../../../src/api/apiClient';

const TRANSPORTER_ID = 'TRANS-001';

const DEFAULT_STOPS = [
  { id: 's1', name: 'Warehouse A', address: '123 Storage St', status: 'completed' },
  { id: 's2', name: 'Customer Location', address: '456 Delivery Ave', status: 'current' },
  { id: 's3', name: 'Return Point', address: '789 Return Rd', status: 'pending' },
];

const DEFAULT_TURNS = [
  { instruction: 'Head north on Main St', distance: '200 m', icon: 'arrow-up' },
  { instruction: 'Turn right onto Oak Ave', distance: '1.2 km', icon: 'turn-right' },
  { instruction: 'Continue straight', distance: '800 m', icon: 'arrow-forward' },
  { instruction: 'Turn left onto Pine Rd', distance: '450 m', icon: 'turn-left' },
];

function normalizeStop(raw, index) {
  const status = (raw.status || '').toLowerCase();
  return {
    id: raw.shipment_id || raw.id || `stop-${index}`,
    name: raw.destination || raw.origin || raw.recipient || `Stop ${index + 1}`,
    address: raw.address || raw.destination_address || '',
    status: status === 'delivered' ? 'completed' : status === 'in_transit' || status === 'out_for_delivery' ? 'current' : 'pending',
  };
}

function deriveTurns(shipment) {
  if (!shipment) return DEFAULT_TURNS;
  const turns = Array.isArray(shipment.turns) ? shipment.turns : null;
  if (turns && turns.length > 0) {
    return turns.map((t, i) => ({
      instruction: t.instruction || t.description || `Continue on ${t.street || 'route'}`,
      distance: t.distance || t.length || '—',
      icon: t.icon || (t.direction === 'left' ? 'turn-left' : t.direction === 'right' ? 'turn-right' : 'arrow-up'),
    }));
  }
  return DEFAULT_TURNS;
}

export const useNavigationData = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const activeShipment = useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' } });

  const routeStops = useMemo(() => {
    if (activeShipment.data) {
      const raw = Array.isArray(activeShipment.data) ? activeShipment.data
        : Array.isArray(activeShipment.data.shipments) ? activeShipment.data.shipments
        : null;
      if (raw && raw.length > 0) return raw.slice(0, 6).map((s, i) => normalizeStop(s, i));
    }
    return DEFAULT_STOPS;
  }, [activeShipment.data]);

  const upcomingTurns = useMemo(() => {
    if (activeShipment.data) {
      const raw = Array.isArray(activeShipment.data) ? activeShipment.data
        : Array.isArray(activeShipment.data.shipments) ? activeShipment.data.shipments
        : null;
      if (raw && raw.length > 0) return deriveTurns(raw[0]);
    }
    return DEFAULT_TURNS;
  }, [activeShipment.data]);

  const currentShipment = useMemo(() => {
    if (activeShipment.data) {
      const raw = Array.isArray(activeShipment.data) ? activeShipment.data
        : Array.isArray(activeShipment.data.shipments) ? activeShipment.data.shipments
        : null;
      if (raw && raw.length > 0) return raw[0];
    }
    return null;
  }, [activeShipment.data]);

  const startNavigation = useCallback(async () => {
    setIsNavigating(true);
    if (currentShipment && currentShipment.shipment_id) {
      try {
        await apiPatch(`/api/v1/shipments/${encodeURIComponent(currentShipment.shipment_id)}/status`, { body: { status: 'out_for_delivery' } });
      } catch {}
    }
  }, [currentShipment]);

  const stopNavigation = useCallback(async () => {
    setIsNavigating(false);
  }, []);

  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);

  return {
    isNavigating,
    isMuted,
    routeStops,
    upcomingTurns,
    currentShipment,
    startNavigation,
    stopNavigation,
    toggleMute,
    loading: activeShipment.loading,
    error: activeShipment.error,
    refetch: activeShipment.refetch,
  };
};
