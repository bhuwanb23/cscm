import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';

const DEFAULT_GRAPH = {
  nodes: [
    { id: 'shopkeeper-1', type: 'shopkeeper', label: 'Fresh Mart' },
    { id: 'shopkeeper-2', type: 'shopkeeper', label: 'City Grocer' },
    { id: 'wholesaler-1', type: 'wholesaler', label: 'CSCM Wholesale' },
    { id: 'warehouse-1', type: 'warehouse', label: 'Warehouse A' },
    { id: 'transporter-1', type: 'transporter', label: 'FedEx Express' },
    { id: 'transporter-2', type: 'transporter', label: 'DHL Logistics' },
    { id: 'planner-1', type: 'central-planner', label: 'Central Planner' },
  ],
  edges: [
    { from: 'shopkeeper-1', to: 'wholesaler-1', relationship: 'orders_from' },
    { from: 'shopkeeper-2', to: 'wholesaler-1', relationship: 'orders_from' },
    { from: 'wholesaler-1', to: 'warehouse-1', relationship: 'stocks_at' },
    { from: 'warehouse-1', to: 'transporter-1', relationship: 'ships_via' },
    { from: 'warehouse-1', to: 'transporter-2', relationship: 'ships_via' },
    { from: 'transporter-1', to: 'shopkeeper-1', relationship: 'delivers_to' },
    { from: 'transporter-2', to: 'shopkeeper-2', relationship: 'delivers_to' },
    { from: 'planner-1', to: 'wholesaler-1', relationship: 'coordinates' },
  ],
};

export const useGraphData = () => {
  const [query, setQuery] = useState('');
  const graph = useApiQuery('CENTRAL_PLANNER', 'knowledgeGraphQuery', { params: { q: 'mesh' }, skip: true });

  const data = useMemo(() => {
    if (graph.data) {
      const raw = graph.data;
      if (raw.nodes || raw.edges || raw.triples) return raw;
    }
    return DEFAULT_GRAPH;
  }, [graph.data]);

  const filtered = useMemo(() => {
    if (!query || !query.trim()) return data;
    const q = query.toLowerCase();
    return {
      nodes: (data.nodes || []).filter(n => (n.label || '').toLowerCase().includes(q) || (n.type || '').toLowerCase().includes(q)),
      edges: (data.edges || []).filter(e => (e.relationship || '').toLowerCase().includes(q)),
    };
  }, [data, query]);

  return {
    graph: filtered,
    query,
    setQuery,
    loading: graph.loading,
    error: graph.error,
    refetch: graph.refetch,
  };
};
