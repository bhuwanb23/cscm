/**
 * Page smoke tests.
 *
 * Every console route is mounted and asserted not to throw. This exists
 * because `vite build` does not catch a missing import: the identifier is
 * resolved when the module executes, so the production build exited 0 while
 * the market calendar page crashed on every visit with
 * "dayMonthShort is not defined".
 *
 * The console already wraps routes in an ErrorBoundary, so a crash does not
 * take the app down - it silently swaps in a failure card. That is good
 * resilience and bad feedback: the page is broken and the build is green.
 * These tests restore the missing signal.
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '../App.jsx';
import { AuthProvider } from '../state/AuthContext.jsx';
import { ToastProvider } from '../state/ToastContext.jsx';
import { ConfirmProvider } from '../state/ConfirmContext.jsx';
import { LiveProvider } from '../state/LiveContext.jsx';

/** Stub the API layer so pages mount without a running control server. */
function stubFetch() {
  global.fetch = vi.fn(async (url) => {
    const u = String(url);
    const body = { success: true, data: {} };
    if (u.includes('/api/metrics/calendar/today')) {
      body.data = {
        today: { date: '2026-10-04', status: 'trading', isTradingDay: true, label: 'Trading day', reason: null, exact: true },
        nextTradingDay: { date: '2026-10-05', status: 'trading', isTradingDay: true, label: 'Trading day', reason: null, exact: true },
      };
    } else if (u.includes('/api/metrics/calendar')) {
      body.data = {
        window: { from: '2026-10-01', to: '2026-10-31' },
        days: Array.from({ length: 31 }, (_, i) => ({
          date: `2026-10-${String(i + 1).padStart(2, '0')}`,
          status: 'trading',
          isTradingDay: true,
          label: 'Trading day',
          reason: null,
          exact: true,
        })),
        summary: { total: 31, trading: 31, closed: 0, label: '31 trading days' },
        coverage: { year: 2026, exact: true, exactYears: [2026] },
      };
    } else if (u.includes('/api/metrics/summary')) {
      body.data = {
        window: { from: '2026-10-01', to: '2026-10-31' },
        market: { tradingDays: 31, totalDays: 31, closedDays: 0, label: '31 trading days', closures: [] },
        volume: { gmv: 1200000, orders: 140, unitsSold: 900, basketItems: 320, activeStores: 8, gmvPerTradingDay: 38709.68, ordersPerTradingDay: 4.52, aov: 8571.43, unitsPerOrder: 6.43 },
        fulfilment: { statusMix: { delivered: 120, pending: 20 }, wholesaleOrders: 35, wholesaleShareBps: 2500, wholesaleSharePct: 25 },
        inventory: { lines: 240, stockValue: 5400000, stockedOut: 3, belowReorder: 12, stockoutRateBps: 125, stockoutRatePct: 1.25, belowReorderRateBps: 500, belowReorderRatePct: 5, turns: 1.4, turnsAreExact: false },
        delivery: { shipments: 130, delivered: 120, late: 6, onTimeRateBps: 9500, onTimeRatePct: 95, avgTransitHours: 41.5, statusMix: { delivered: 120 } },
        concentration: { topStore: { storeId: 'STORE001', amount: 300000, shareBps: 2500, sharePct: 25 }, storeRank: [{ storeId: 'STORE001', amount: 300000, shareBps: 2500, sharePct: 25 }], topSku: { productId: 'SKU001', units: 220 }, skuRank: [{ productId: 'SKU001', units: 220 }] },
        series: {
          dailyGmv: [{ date: '2026-10-01', gmv: 40000, isTradingDay: true, marketStatus: 'trading', marketLabel: 'Trading day', marketReason: null }],
          dailyOrders: [{ date: '2026-10-01', orders: 5, isTradingDay: true, marketStatus: 'trading', marketLabel: 'Trading day', marketReason: null }],
        },
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/**
 * Renders a route inside the same provider stack main.jsx uses. App reads its
 * token from sessionStorage via AuthProvider and renders <Login/> without one,
 * so a session must be seeded or every route would only ever test the login
 * screen.
 */
function renderRoute(path) {
  sessionStorage.setItem('cp_token', 'test-token');
  sessionStorage.setItem('cp_user', JSON.stringify({ username: 'tester' }));

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <LiveProvider>
              <App />
            </LiveProvider>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function boundaryCaught(container) {
  return /This page failed to render/i.test(container.textContent || '');
}

describe('dashboard routes mount without crashing', () => {
  const routes = [
    ['/', 'Overview'],
    ['/business', 'Business'],
    ['/market-calendar', 'Market calendar'],
    ['/revenue', 'Revenue'],
    ['/orders', 'Orders'],
    ['/inventory', 'Inventory'],
    ['/shipments', 'Shipments'],
    ['/users', 'Users'],
    ['/services', 'Services'],
    ['/logs', 'Logs'],
    ['/events', 'Events'],
    ['/settings', 'Settings'],
    ['/db/tables', 'Tables'],
    ['/simulation', 'User simulation'],
  ];

  it.each(routes)('%s renders without hitting the error boundary', async (path) => {
    stubFetch();
    const { container } = renderRoute(path);

    // Let the mount effects settle so async fetches can reject or resolve.
    await new Promise((r) => setTimeout(r, 0));

    expect(boundaryCaught(container)).toBe(false);
  });
});

describe('market calendar page', () => {
  it('shows the market status KPIs', async () => {
    stubFetch();
    const { container } = renderRoute('/market-calendar');
    await new Promise((r) => setTimeout(r, 0));

    expect(screen.getByRole('heading', { level: 1, name: /market calendar/i })).toBeTruthy();
    expect(container.textContent).toMatch(/Trading days this month/i);
    expect(boundaryCaught(container)).toBe(false);
  });

  it('warns when the year has no confirmed festival dates', async () => {
    // The silent-degradation case: dates still render, but they are derived.
    global.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/api/metrics/calendar/today')) {
        return { ok: true, json: async () => ({ success: true, data: { today: { status: 'trading', isTradingDay: true, label: 'Trading day', reason: null, exact: true }, nextTradingDay: null } }) };
      }
      if (u.includes('/api/metrics/calendar')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              days: [{ date: '2026-10-04', status: 'trading', isTradingDay: true, label: 'Trading day', reason: null, exact: true }],
              summary: { total: 1, trading: 1, closed: 0, label: '1 trading day' },
              coverage: { year: 2027, exact: false, exactYears: [2026] },
            },
          }),
        };
      }
      return { ok: true, json: async () => ({ success: true, data: {} }) };
    });

    const { container } = renderRoute('/market-calendar');
    await new Promise((r) => setTimeout(r, 0));

    expect(container.textContent).toMatch(/approximate/i);
    expect(container.textContent).toMatch(/2027/);
  });
});

describe('business page', () => {
  it('renders KPIs and the market notice', async () => {
    stubFetch();
    const { container } = renderRoute('/business');
    await new Promise((r) => setTimeout(r, 0));

    expect(screen.getByRole('heading', { level: 1, name: /^business$/i })).toBeTruthy();
    expect(container.textContent).toMatch(/GMV/i);
    expect(boundaryCaught(container)).toBe(false);
  });

  it('marks approximate inventory turns with a tilde', async () => {
    stubFetch();
    const { container } = renderRoute('/business');
    await new Promise((r) => setTimeout(r, 0));

    // turnsAreExact is false in the fixture, so the figure must be qualified
    // rather than presented as a true turnover number.
    expect(container.textContent).toMatch(/1\.4~/);
  });
});
