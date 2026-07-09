# CSCM Mobile App — Requirements

**Cognitive Supply Chain Mesh**: a mobile-first app (Expo SDK 54, React Native 0.81, React 19) where supply-chain participants interact as nodes of a mesh. The app targets **demo** (role-pick login, seeded fixtures, polished UI); real auth is deferred.

---

## 1. Shopkeeper

A retail-store manager who monitors sales, keeps inventory in check, and coordinates with transporters and wholesalers.

### Screens

| Screen | Route | Key Data |
|--------|-------|----------|
| **Dashboard** | `users/shopkeepers/dashboard/` | `{sales, topProducts[], alerts[], pendingShipments[], stats}` |
| **Inventory** | `users/shopkeepers/inventory/` | `{items[], stats, reorderAlerts[]}` |
| **Shipment** | `users/shopkeepers/shipment/` | `{shipments[], quickActions[], recentDeliveries[]}` |
| **Stock Request** | `users/shopkeepers/stock_request/` | `{requests[], stats}` |
| **Communication** | `users/shopkeepers/communication/` | `{messages[], contacts[]}` |
| **Analysis** | `users/shopkeepers/analysis/` | `{categories[], metrics, charts[]}` |
| **Profile** | `users/shopkeepers/profile/` | `{user, store, settings}` |

### API Families

`STORE` (demand forecast, inventory optimization, anomaly detection), `INVENTORY_CRUD`, `ORDERS`, `SHIPMENTS`, `CUSTOMER_DEMAND`, `CENTRAL_PLANNER` (read-only).

### Data Shapes
```
stats: { totalSales, orderCount, avgOrderValue, lowStockCount }
sales: [{ date, amount, category }]
topProducts: [{ sku, name, quantitySold, revenue }]
alerts: [{ type, message, severity, date }]
```

---

## 2. Transporter

A logistics operator who manages delivery routes, tracks tasks, and monitors fleet performance.

### Screens

| Screen | Route | Key Data |
|--------|-------|----------|
| **Dashboard** | `users/transporters/dashboard/` | `{routeProgress, nextTask, alerts[], upcomingStops[], quickStats, header}` |
| **Tasks** | `users/transporters/tasks/` | `{tasks[], filter, stats}` |
| **Navigation** | `users/transporters/navigation/` | `{routes[], waypoints[], status}` |
| **Profile** | `users/transporters/profile/` | `{user, vehicle, stats}` |

### API Families

`TRANSPORT` (routing optimization, ETA, travel time, GNN route planning, edge deploy), `CENTRAL_PLANNER` (read-only), `SHIPMENTS`.

### Data Shapes
```
routeProgress: { currentStop, nextStop, progressPct, estimatedArrival }
nextTask: { id, type, location, priority }
quickStats: { deliveriesToday, onTimePct, distanceCovered }
upcomingStops: [{ location, eta, action }]
```

---

## 3. Wholesaler

A wholesale distributor who places bulk orders, manages stock across warehouses, and assesses supplier risk.

### Screens

| Screen | Route | Key Data |
|--------|-------|----------|
| **Dashboard** | `users/wholesalers/dashboard/` | `{stats, topRetailers[], recentOrders[]}` |
| **Orders** | `users/wholesalers/orders/` | `{orders[], filters, stats}` |
| **Shipments** | `users/wholesalers/shipments/` | `{shipments[], filters}` |
| **Inventory** | `users/wholesalers/inventory/` | `{items[], warehouses[]}` |
| **Profile** | `users/wholesalers/profile/` | `{user, company, settings}` |

### API Families

`SUPPLIER` (risk assessment, sourcing, survival, graph risk, calibration, backup), `INVENTORY_CRUD`, `ORDERS`, `SHIPMENTS`.

### Data Shapes
```
stats: { totalOrders, pendingShipments, activeSuppliers, avgLeadTime }
topRetailers: [{ id, name, orderVolume, lastOrder }]
recentOrders: [{ id, status, items, total, date }]
```

---

## 4. Mesh (Central Planner / Operator)

A cross-cutting operational view of the entire supply-chain mesh — alerts, topology graph, model drift, and network health. Accessible from any role (demo mode); intended for admin/operator only in production.

### Sub-views

| Sub-view | Route | Key Data |
|----------|-------|----------|
| **Alerts** | `users/mesh/alerts/` | `{alerts[], total, pendingAction}` |
| **Graph** | `users/mesh/graph/` | `{nodes[], edges[]}` — mesh topology |
| **Drift** | `users/mesh/drift/` | `{driftScore, threshold, affectedModels[]}` |
| **Network** | `users/mesh/network/` | `{agents[], health[], latency[]}` |

### API Families

`CENTRAL_PLANNER` (coordination plan/status, anomaly alerts, KG query, drift check, safety stock), `SIMULATION` (digital twin, what-if).

### Data Shapes
```
alerts: [{ id, severity, message, status, timestamp }]
graph.nodes: [{ id, type: 'shopkeeper'|'transporter'|'wholesaler'|'warehouse'|'central-planner', label }]
graph.edges: [{ from, to, relationship }]
drift: { model, baselineAccuracy, currentAccuracy, driftScore, threshold }
```

---

## 5. Cross-cutting

### Design constraints

- **Mobile only** (iOS + Android via Expo Go); no web build
- **Blue gradient** (`['#F8F9FA', '#E9ECEF']`) as the default background
- **react-native-paper** for UI components
- **No real auth** in demo — 3-role picker at login. Mesh tab available from any role.
- **Mock data fallbacks** — every hook returns `DEFAULT_*` constants on API error (centralized at `App/src/demo/index.js`). A yellow `DemoChip` in the header indicates demo mode.

### API communication

- Mobile → Node.js Gateway (`:8080`) → either Express (`:3000`) for CRUD or Python FastAPI (`:8000`) for AI/ML
- Gateway enriches `/health` with `aiMl.status`
- All calls use the `apiClient` fetch wrapper and the endpoint catalog at `App/src/api/endpoints.js`
- 69 endpoints across 11 families; `ROLE_ENDPOINTS` maps each role to its allowed families

### Architecture

```
App/
  login/                        # 3-role picker
  users/
    shopkeepers/                # 7 screens
    transporters/               # 4 screens
    wholesalers/                # 5 screens
    mesh/                       # 4 sub-views (tabbed)
  src/
    api/                        # apiClient, endpoints, hooks
    components/                 # shared UI (LoadingScreen, ErrorScreen, DemoChip)
    demo/                       # centralized mock data
    theme/                      # design tokens + status helpers
    utils/                      # parsePrice, etc.
  __tests__/                    # 7 test suites, 41 tests
```
