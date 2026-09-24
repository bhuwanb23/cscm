import React, { useState } from 'react';
import { PageHeader, Loading, ErrorBanner, JsonView } from '../components/ui.jsx';
import { callAiMl } from '../api/client.jsx';

export default function KnowledgeGraph() {
  const [query, setQuery] = useState('suppliers of product milk');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run(e) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await callAiMl('POST', '/kg/query', { query });
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Knowledge graph"
        subtitle="Entity graph over stores, suppliers, products and routes (graphStructure.js + AI/ML /kg)"
      />
      <div className="grid-2">
        <div className="card">
          <h3>Graph structure (source)</h3>
          <pre className="json-view">{`Nodes:
  Store, Warehouse, Transporter, Supplier, Product
Edges:
  Store     —stocks→    Product
  Store     —orders→    Warehouse
  Warehouse —ships→     Store
  Supplier  —supplies→  Product
  Transporter —delivers→ Store

Source of truth:
  backend/src/knowledge-graph/graphStructure.js
Queried by:
  CentralPlanner › KnowledgeGraphQuerier (sub-agent)`}</pre>
        </div>
        <div className="card">
          <h3>Query console</h3>
          <form className="row" onSubmit={run} style={{ gap: 8 }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1 }} placeholder="natural language graph query" />
            <button disabled={busy}>{busy ? 'Querying…' : 'Query'}</button>
          </form>
          <ErrorBanner error={error} />
          {busy && <Loading rows={3} label="Querying the graph…" />}
          {result && <JsonView data={result} />}
        </div>
      </div>
    </div>
  );
}
