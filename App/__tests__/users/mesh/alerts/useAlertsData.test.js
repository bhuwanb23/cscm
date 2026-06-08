import React from 'react';
import { renderHook, act, cleanup } from '@testing-library/react-native';
import { useAlertsData } from '../../../../users/mesh/alerts/hooks/useAlertsData';

jest.mock('../../../../src/api/apiClient');

const mockApiGet = require('../../../../src/api/apiClient').apiGet;
const mockApiPost = require('../../../../src/api/apiClient').apiPost;

function flushPromises() {
  return new Promise((r) => setImmediate(r));
}

beforeEach(() => {
  mockApiGet.mockReset();
  mockApiPost.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('useAlertsData', () => {
  it('returns default alerts when API fails', async () => {
    mockApiGet.mockResolvedValue({ ok: false, status: 502, data: null });
    const { result } = await renderHook(() => useAlertsData());
    await act(() => flushPromises());
    expect(result.current.loading).toBe(false);
    expect(Array.isArray(result.current.alerts)).toBe(true);
    expect(result.current.alerts.length).toBeGreaterThan(0);
    expect(result.current.counts.all).toBeGreaterThan(0);
  });

  it('uses API data when available', async () => {
    const fixture = {
      alerts: [
        { alert_id: 'ALT-001', severity: 'critical', title: 'Stockout risk', source: 'store-001' },
        { alert_id: 'ALT-002', severity: 'low', title: 'Low stock', source: 'store-002', acknowledged: true },
      ],
    };
    mockApiGet.mockResolvedValue({ ok: true, status: 200, data: fixture });
    const { result } = await renderHook(() => useAlertsData());
    await act(() => flushPromises());
    expect(result.current.counts.all).toBe(2);
    expect(result.current.counts.critical).toBe(1);
    expect(result.current.counts.unacknowledged).toBe(1);
  });

  it('filters by severity', async () => {
    const fixture = {
      alerts: [
        { alert_id: 'A1', severity: 'critical' },
        { alert_id: 'A2', severity: 'high' },
        { alert_id: 'A3', severity: 'low' },
      ],
    };
    mockApiGet.mockResolvedValue({ ok: true, status: 200, data: fixture });
    const { result } = await renderHook(() => useAlertsData());
    await act(() => flushPromises());
    await act(() => result.current.setActiveFilter('critical'));
    result.current.alerts.forEach((a) => {
      expect(a.severity).toBe('critical');
    });
  });

  it('filters unacknowledged', async () => {
    const fixture = {
      alerts: [
        { alert_id: 'A1', severity: 'critical', acknowledged: false },
        { alert_id: 'A2', severity: 'high', acknowledged: true },
      ],
    };
    mockApiGet.mockResolvedValue({ ok: true, status: 200, data: fixture });
    const { result } = await renderHook(() => useAlertsData());
    await act(() => flushPromises());
    await act(() => result.current.setActiveFilter('unacknowledged'));
    expect(result.current.alerts.length).toBe(1);
    expect(result.current.alerts[0].id).toBe('A1');
  });
});
