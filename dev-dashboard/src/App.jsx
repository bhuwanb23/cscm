import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import { useLive } from './state/LiveContext.jsx';
import { useToast } from './state/ToastContext.jsx';
import { StatusPill } from './components/ui.jsx';
import { LiveClock } from './components/motion.jsx';

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

function ServiceHealth({ status }) {
  const services = [
    ['Backend', status.backend?.status],
    ['Gateway', status.gateway?.status],
    ['AI/ML', status.aiMl?.status],
  ];
  return (
    <div className="side-footer" aria-label="Service health">
      {services.map(([name, s]) => (
        <div className="svc" key={name}>
          <span>{name}</span>
          <StatusPill status={s || 'unknown'} />
        </div>
      ))}
    </div>
  );
}

/** Fires a toast whenever a service health status flips (skips the first snapshot). */
function useHealthAlerts(status) {
  const toast = useToast();
  const prev = useRef(null);

  useEffect(() => {
    if (!status || typeof status !== 'object') return;
    const snapshot = {
      Backend: status.backend?.status,
      Gateway: status.gateway?.status,
      'AI/ML': status.aiMl?.status,
    };
    if (prev.current) {
      for (const [name, s] of Object.entries(snapshot)) {
        const before = prev.current[name];
        if (before && before !== s) {
          if (s === 'healthy') toast.success(`${name} recovered`, `Status changed ${before} → ${s}.`);
          else if (s === 'unknown') toast.warn(`${name} status unknown`, `Status changed ${before} → ${s}.`);
          else toast.error(`${name} degraded`, `Status changed ${before} → ${s}.`);
        }
      }
    }
    prev.current = snapshot;
    // toast identity is stable (memoized in the provider)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
}

function Shell({ children }) {
  const { user, logout } = useAuth();
  const { status } = useLive();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  useHealthAlerts(status);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // Close on Escape when the drawer is open.
  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const currentGroup = NAV.find((g) => g.items.some(([to]) => to === location.pathname))?.group;

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden="true" />
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}
      <aside className={`sidebar${navOpen ? ' open' : ''}`}>
        <div className="brand">
          <span className="logo" aria-hidden="true">⚡</span>
          CSCM Control
        </div>
        <nav aria-label="Main navigation" style={{ display: 'contents' }}>
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
        </nav>
        <ServiceHealth status={status} />
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="crumbs">
            <button
              className="secondary sm menu-btn"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={navOpen}
            >
              ☰
            </button>
            {currentGroup && <span>{currentGroup}</span>}
            {currentGroup && <span aria-hidden="true">·</span>}
            <span className="path">{location.pathname}</span>
          </div>
          <div className="side">
            <LiveClock />
            <span className="muted" style={{ fontSize: 12 }}>signed in as {user?.username}</span>
            <button className="secondary sm" onClick={logout}>Log out</button>
          </div>
        </div>
        <div key={location.pathname} className="page-enter">
          {children}
        </div>
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
