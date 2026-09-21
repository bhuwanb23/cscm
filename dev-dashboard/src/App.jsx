import React from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import { useLive } from './state/LiveContext.jsx';
import { StatusPill } from './components/ui.jsx';

import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import Services from './pages/Services.jsx';
import Logs from './pages/Logs.jsx';
import Events from './pages/Events.jsx';
import Settings from './pages/Settings.jsx';

import DbTables from './pages/DbTables.jsx';
import DbTableDetail from './pages/DbTableDetail.jsx';
import DbQuery from './pages/DbQuery.jsx';
import DbBackups from './pages/DbBackups.jsx';
import DbMigrations from './pages/DbMigrations.jsx';

import Users from './pages/Users.jsx';
import Inventory from './pages/Inventory.jsx';
import Orders from './pages/Orders.jsx';
import Shipments from './pages/Shipments.jsx';
import StoreDetail from './pages/StoreDetail.jsx';

import Agents from './pages/Agents.jsx';
import AgentFamilies from './pages/AgentFamilies.jsx';
import KnowledgeGraph from './pages/KnowledgeGraph.jsx';
import Cache from './pages/Cache.jsx';
import FeatureStore from './pages/FeatureStore.jsx';

import AiOverview from './pages/AiOverview.jsx';
import AiPlayground from './pages/AiPlayground.jsx';
import AiDomainRouter from './pages/ai/AiDomainRouter.jsx';

import Simulation from './pages/Simulation.jsx';
import GatewayRouting from './pages/GatewayRouting.jsx';
import GatewayCircuits from './pages/GatewayCircuits.jsx';
import MobileScreens from './pages/MobileScreens.jsx';
import Docs from './pages/Docs.jsx';

const NAV = [
  {
    group: 'Monitor',
    items: [
      ['/', 'Overview'],
      ['/services', 'Services'],
      ['/logs', 'Logs'],
      ['/events', 'Event stream'],
    ],
  },
  {
    group: 'Database',
    items: [
      ['/db/tables', 'Tables'],
      ['/db/query', 'SQL console'],
      ['/db/backups', 'Backups'],
      ['/db/migrations', 'Migrations'],
    ],
  },
  {
    group: 'Business data',
    items: [
      ['/users', 'Users & roles'],
      ['/inventory', 'Inventory'],
      ['/orders', 'Orders'],
      ['/shipments', 'Shipments'],
    ],
  },
  {
    group: 'Agents (Node)',
    items: [
      ['/agents', 'Runtime control'],
      ['/agents/families', 'Families & sub-agents'],
      ['/knowledge-graph', 'Knowledge graph'],
      ['/cache', 'Cache'],
      ['/feature-store', 'Feature store'],
    ],
  },
  {
    group: 'AI/ML (Python)',
    items: [
      ['/ai', 'Model overview'],
      ['/ai/playground', 'API playground'],
      ['/ai/demand-forecast', 'Demand forecast'],
      ['/ai/demand-planning', 'Demand planning'],
      ['/ai/inventory-opt', 'Inventory optimization'],
      ['/ai/routing', 'Routing & logistics'],
      ['/ai/supplier-risk', 'Supplier risk'],
      ['/ai/customer', 'Customer demand'],
      ['/ai/anomaly', 'Anomaly detection'],
      ['/ai/nlp', 'NLP & LLM'],
      ['/ai/kg', 'Knowledge graph'],
      ['/ai/causal', 'Causal inference'],
      ['/ai/vision', 'Computer vision'],
      ['/ai/learning', 'Continual learning'],
      ['/ai/uncertainty', 'Uncertainty'],
      ['/ai/monitoring', 'Model monitoring'],
      ['/ai/digital-twin', 'Digital twin'],
      ['/ai/coordination', 'Multi-agent coordination'],
      ['/ai/explain', 'Explainability'],
    ],
  },
  {
    group: 'Platform',
    items: [
      ['/simulation', 'User simulation'],
      ['/gateway/routing', 'Gateway routing'],
      ['/gateway/circuits', 'Circuit breakers'],
      ['/mobile', 'Mobile app screens'],
      ['/settings', 'Settings'],
      ['/docs', 'Docs & links'],
    ],
  },
];

function Shell({ children }) {
  const { user, logout } = useAuth();
  const { status } = useLive();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">⚡ CSCM Control</div>
        {NAV.map((section) => (
          <div key={section.group}>
            <div className="group">{section.group}</div>
            {section.items.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>
      <main className="main">
        <div className="page-header">
          <div className="row" style={{ gap: 18 }}>
            <span><StatusPill status={status.backend?.status || 'unknown'} /> backend</span>
            <span><StatusPill status={status.gateway?.status || 'unknown'} /> gateway</span>
            <span><StatusPill status={status.aiMl?.status || 'unknown'} /> ai/ml</span>
          </div>
          <div className="row">
            <span className="muted" style={{ fontSize: 12 }}>
              {location.pathname} · {user?.username}
            </span>
            <button className="secondary" onClick={logout}>Log out</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { token } = useAuth();
  if (!token) return <Login />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/services" element={<Services />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/events" element={<Events />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/db/tables" element={<DbTables />} />
        <Route path="/db/tables/:table" element={<DbTableDetail />} />
        <Route path="/db/query" element={<DbQuery />} />
        <Route path="/db/backups" element={<DbBackups />} />
        <Route path="/db/migrations" element={<DbMigrations />} />

        <Route path="/users" element={<Users />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/shipments" element={<Shipments />} />
        <Route path="/stores/:storeId" element={<StoreDetail />} />

        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/families" element={<AgentFamilies />} />
        <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
        <Route path="/cache" element={<Cache />} />
        <Route path="/feature-store" element={<FeatureStore />} />

        <Route path="/ai" element={<AiOverview />} />
        <Route path="/ai/playground" element={<AiPlayground />} />
        <Route path="/ai/:key" element={<AiDomainRouter />} />

        <Route path="/simulation" element={<Simulation />} />
        <Route path="/gateway/routing" element={<GatewayRouting />} />
        <Route path="/gateway/circuits" element={<GatewayCircuits />} />
        <Route path="/mobile" element={<MobileScreens />} />
        <Route path="/docs" element={<Docs />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
