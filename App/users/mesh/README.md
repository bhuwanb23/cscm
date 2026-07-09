# Mesh Console

Cross-cutting operational view of the entire supply-chain mesh. Accessible from any role's bottom-nav (demo mode) — intended for admin/operator only in production (see issue 5.3).

## Sub-views

### Alerts (`alerts/`)
- **Hook**: `useAlertsData` (backs onto `CENTRAL_PLANNER.anomalyAlertList`)
- **Displays**: anomaly alerts from the AI/ML `anomaly_detection` router
- **Features**: filter by status (all / active / critical / high), acknowledge alerts, pull-to-refresh
- **Mock data**: `MESH_DEFAULT_ALERTS` in `App/src/demo/index.js`

### Graph (`graph/`)
- **Hook**: `useGraphData` (backs onto `CENTRAL_PLANNER.kgQuery`)
- **Displays**: mesh topology — shopkeeper, transporter, wholesaler, warehouse, and central-planner nodes with their relationships
- **Features**: zoom/pan node graph (scroll-based zoom), query filter, node selection showing edge details
- **Mock data**: `MESH_DEFAULT_GRAPH` — 7 nodes + 8 edges

### Drift (`drift/`)
- **Hook**: `useDriftData` (backs onto `CENTRAL_PLANNER.driftCheck`)
- **Displays**: model drift monitoring — baseline vs. current accuracy, drift score vs. threshold, history chart
- **Features**: auto-retrain action, color-coded status (green=healthy, red=drift detected), history sparkline
- **Mock data**: `MESH_DEFAULT_DRIFT` — `DemandForecaster` with drift_score 0.13 (> 0.10 threshold)

### Network (`network/`)
- **Hook**: `useNetworkData` (backs onto `CENTRAL_PLANNER.coordinationPlan`)
- **Displays**: agent health, latency stats, and type-filterable agent list
- **Features**: filter by agent type, see per-agent status (healthy/warning/down) and response times
- **Mock data**: `MESH_DEFAULT_NETWORK` — 8 agents across all types

## API families used

`CENTRAL_PLANNER` (coordination/plan, anomaly/alerts, kg/query, monitoring/drift) and `SIMULATION` (read-only).

## Architecture

```
mesh/
  mesh.js                  # Tabbed shell — 4 tabs via useState
  alerts/
    alerts.js              # Alert list + filters + ack
    hooks/useAlertsData.js # Hook (apiClient -> CENTRAL_PLANNER.anomalyAlertList)
  graph/
    graph.js               # Node graph visualization
    hooks/useGraphData.js  # Hook (apiClient -> CENTRAL_PLANNER.kgQuery)
  drift/
    drift.js               # Drift monitoring + history chart
    hooks/useDriftData.js  # Hook (apiClient -> CENTRAL_PLANNER.driftCheck)
  network/
    network.js             # Agent health + network status
    hooks/useNetworkData.js# Hook (apiClient -> CENTRAL_PLANNER.coordinationPlan)
  components/
    Header.js              # Shared back-navigate header bar
```
