import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPatch } from '../../../../src/api/apiClient';
import { TRANSPORTER_DEFAULT_TASKS as DEFAULT_TASKS } from '../../../../src/demo';

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
