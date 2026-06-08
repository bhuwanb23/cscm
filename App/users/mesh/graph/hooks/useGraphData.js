import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { MESH_DEFAULT_GRAPH as DEFAULT_GRAPH } from '../../../../src/demo';

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
