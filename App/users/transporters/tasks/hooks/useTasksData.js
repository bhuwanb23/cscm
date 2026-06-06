import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPatch } from '../../../../src/api/apiClient';

const TRANSPORTER_ID = 'TRANS-001';

function normalizeTask(raw, index) {
  const status = (raw.status || '').toLowerCase();
  const orderId = raw.order_id || raw.id || `CSCM-${9000 + index}`;
  const priority = (raw.priority || 'normal').toLowerCase();
  const eta = raw.eta || raw.estimated_arrival || raw.due_in || 'TBD';

  if (status === 'in_transit' || status === 'out_for_delivery' || status === 'arriving_soon') {
    return {
      id: raw.shipment_id || raw.id || `t-${index}`,
      status: 'inProgress',
      priority,
      orderId,
      eta,
      pickup: {
        time: raw.pickup_time || raw.origin_time || '—',
        location: raw.origin || raw.pickup_location || 'Pickup location TBD',
        completed: Boolean(raw.pickup_completed),
      },
      delivery: {
        time: raw.delivery_window || raw.estimated_arrival || eta,
        location: raw.destination || raw.delivery_location || 'Delivery location TBD',
        city: raw.destination_city || raw.city || '',
        completed: false,
      },
      packages: Number(raw.item_count || raw.packages || 1),
      specialHandling: raw.special_handling || null,
    };
  }
  if (status === 'pending' || status === 'scheduled') {
    return {
      id: raw.shipment_id || raw.id || `t-${index}`,
      status: status === 'pending' ? 'pending' : 'scheduled',
      priority,
      orderId,
      window: raw.delivery_window || eta,
      origin: {
        location: raw.origin || raw.pickup_location || 'Origin TBD',
        specialHandling: raw.special_handling || null,
      },
      destination: {
        location: raw.destination || raw.delivery_location || 'Destination TBD',
        notes: raw.notes || '',
      },
      tags: raw.tags || (raw.special_handling ? [raw.special_handling] : []),
      dueIn: raw.due_in || eta,
    };
  }
  if (status === 'delivered') {
    return {
      id: raw.shipment_id || raw.id || `t-${index}`,
      status: 'completed',
      priority,
      orderId,
      completedTime: raw.delivered_at || raw.completed_time || 'Recently',
      deliveredTo: raw.recipient || raw.delivered_to || 'Reception',
    };
  }
  return {
    id: raw.shipment_id || raw.id || `t-${index}`,
    status: 'scheduled',
    priority,
    orderId,
    window: eta,
    destination: { location: raw.destination || 'TBD', notes: '' },
    tags: [],
  };
}

const DEFAULT_TASKS = [
  {
    id: '1', status: 'inProgress', priority: 'high', orderId: '#CSCM-8921', eta: '14 min',
    pickup: { time: '09:30 AM', location: 'Warehouse A, Zone 4', completed: true },
    delivery: { time: '10:45 AM - 11:15 AM', location: 'TechSolutions HQ, 4500 Innovation Dr.', city: 'San Francisco, CA 94103', completed: false },
    packages: 5, specialHandling: null,
  },
  {
    id: '2', status: 'pending', priority: 'normal', orderId: '#CSCM-9004', window: '12:00 PM',
    origin: { location: 'Central Logistics Hub, Gate 4', specialHandling: 'Fragile' },
    dueIn: '2h 15m',
  },
  {
    id: '3', status: 'scheduled', priority: 'normal', orderId: '#CSCM-9155', window: '02:30 PM',
    destination: { location: 'Green Valley Market', notes: 'Rear entrance delivery only' },
    tags: ['Cold Chain', 'Signature'],
  },
  {
    id: '4', status: 'completed', priority: 'normal', orderId: '#CSCM-8810', completedTime: '08:45 AM', deliveredTo: 'Reception',
  },
];

export const useTasksData = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [localTasks, setLocalTasks] = useState([]);

  const inTransit = useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' } });
  const delivered = useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'delivered' } });

  const allTasks = useMemo(() => {
    const lists = [inTransit.data, delivered.data]
      .filter(Boolean)
      .map(d => Array.isArray(d) ? d : (Array.isArray(d.shipments) ? d.shipments : []));
    const flat = lists.flat();
    if (flat.length === 0) {
      if (localTasks.length > 0) return localTasks;
      return DEFAULT_TASKS;
    }
    return flat.map((s, i) => normalizeTask(s, i));
  }, [inTransit.data, delivered.data, localTasks]);

  const filteredTasks = useMemo(() => {
    let result = allTasks;
    if (activeFilter && activeFilter !== 'all') {
      result = result.filter(t => t.status === activeFilter);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        (t.orderId || '').toLowerCase().includes(q) ||
        (t.pickup?.location || '').toLowerCase().includes(q) ||
        (t.delivery?.location || '').toLowerCase().includes(q) ||
        (t.origin?.location || '').toLowerCase().includes(q) ||
        (t.destination?.location || '').toLowerCase().includes(q) ||
        (t.deliveredTo || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [allTasks, activeFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: allTasks.length,
      inProgress: allTasks.filter(t => t.status === 'inProgress').length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      scheduled: allTasks.filter(t => t.status === 'scheduled').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
    };
  }, [allTasks]);

  const markTaskCompleted = useCallback(async (taskId) => {
    setLocalTasks(prev => {
      const base = prev.length > 0 ? prev : DEFAULT_TASKS;
      return base.map(t => t.id === taskId ? { ...t, status: 'completed', completedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : t);
    });
    try {
      await apiPatch(`/api/v1/shipments/${encodeURIComponent(taskId)}/status`, { body: { status: 'delivered' } });
    } catch {}
  }, []);

  const handleTaskPress = useCallback((task) => {
    if (task.status === 'inProgress') {
      markTaskCompleted(task.id);
    }
  }, [markTaskCompleted]);

  return {
    tasks: filteredTasks,
    allTasks,
    counts,
    searchQuery,
    activeFilter,
    setSearchQuery,
    setActiveFilter,
    handleTaskPress,
    markTaskCompleted,
    loading: inTransit.loading || delivered.loading,
    error: inTransit.error || delivered.error,
    refetch: () => { inTransit.refetch(); delivered.refetch(); },
  };
};
