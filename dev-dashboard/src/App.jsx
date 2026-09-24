import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import { useLive } from './state/LiveContext.jsx';
import { useToast } from './state/ToastContext.jsx';
import { StatusPill, ScrollTopButton } from './components/ui.jsx';
import { LiveClock } from './components/motion.jsx';
import { Icon, BrandMark } from './components/icons.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import { NAV } from './lib/nav.js';

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

function ServiceHealth({ status, mini }) {
  const services = [
    ['Backend', status.backend?.status],
    ['Gateway', status.gateway?.status],
    ['AI/ML', status.aiMl?.status],
  ];

  if (mini) {
    return (
      <div className="side-footer" aria-label="Service health">
        {services.map(([name, s]) => (
          <span key={name} className="svc-mini" title={`${name}: ${s || 'unknown'}`}>
            <StatusPill status={s || 'unknown'} mini />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div aria-label="Service health">
      {services.map(([name, s]) => (
        <div className="event-row" key={name} style={{ paddingLeft: 6 }}>
          <span className="muted" style={{ fontSize: 12.5 }}>{name}</span>
          <span style={{ marginLeft: 'auto' }}>
            <StatusPill status={s || 'unknown'} mini />
          </span>
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useHealthAlerts(status);

  // Ctrl/Cmd+K toggles the command palette.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const currentGroup = NAV.find((g) => g.items.some(([to]) => to === location.pathname))?.group;

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden="true" />
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        <NavLink to="/" className="brand" aria-label="CSCM Control home">
          <BrandMark size={30} />
        </NavLink>
        <div className="rail-sep" aria-hidden="true" />

        <nav aria-label="Primary" style={{ display: 'contents' }}>
          {NAV.map((section) => {
            const [topPath, topLabel, topIcon] = section.items[0];
            const active = section.items.some(([to]) => to === location.pathname);
            return (
              <NavLink
                key={section.group}
                to={topPath}
                end={topPath === '/'}
                className={`rail-item${active ? ' active' : ''}`}
                data-tip={section.group}
                aria-label={section.group}
              >
                <Icon name={topIcon} size={19} />
              </NavLink>
            );
          })}
        </nav>

        <ServiceHealth status={status} mini />

        {/* Expanded flyout with the full nav tree (hover / focus / mobile drawer) */}
        <div className="side-full">
          <div className="brand-row">
            <BrandMark size={26} />
            <div>
              CSCM Control
              <span className="muted">Supply-chain operations</span>
            </div>
          </div>
          <button
            className="palette-trigger"
            style={{ width: '100%', marginBottom: 10 }}
            onClick={() => setPaletteOpen(true)}
          >
            <Icon name="search" size={14} />
            Search…
            <span className="kbd">Ctrl K</span>
          </button>
          {NAV.map((section) => (
            <div key={section.group}>
              <div className="group">{section.group}</div>
              {section.items.map(([to, label, icon]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon name={icon} size={15} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="group">Services</div>
          <ServiceHealth status={status} />
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <button
            className="secondary sm menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Icon name="menu" size={15} />
          </button>
          <div className="crumbs">
            {currentGroup && <span>{currentGroup}</span>}
            {currentGroup && <span aria-hidden="true">·</span>}
            <span className="path">{location.pathname}</span>
          </div>
          <button
            className="palette-trigger"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette (Ctrl+K)"
          >
            <Icon name="search" size={14} />
            <span className="palette-hint">Search or jump to…</span>
            <span className="kbd">Ctrl K</span>
          </button>
          <div className="side">
            <LiveClock />
            <span className="who">signed in as {user?.username}</span>
            <button className="ghost sm" onClick={logout} aria-label="Log out">
              <Icon name="logOut" size={15} />
            </button>
          </div>
        </div>

        <div className="main-body">
          <div key={location.pathname} className="page-enter">
            {children}
          </div>
        </div>
        <ScrollTopButton />
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
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
