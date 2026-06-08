import React from 'react';
import { renderHook, act, cleanup } from '@testing-library/react-native';
import { useDashboardData } from '../../../../users/shopkeepers/dashboard/hooks/useDashboardData';

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

describe('useDashboardData (shopkeeper)', () => {
  it('returns default data when API fails', async () => {
    mockApiGet.mockResolvedValue({ ok: false, status: 502, data: null });
    mockApiPost.mockResolvedValue({ ok: false, status: 502, data: null });
    const { result } = await renderHook(() => useDashboardData());
    await act(() => flushPromises());
    expect(result.current.loading).toBe(false);
    expect(result.current.stockLevels).toBeDefined();
    expect(result.current.shipments).toBeDefined();
    expect(result.current.alerts).toBeDefined();
  });

  it('uses API data when available', async () => {
    const inventoryFixture = {
      items: [
        { sku_id: 'SKU-001', product_name: 'Widget', quantity: 50, reorder_point: 20 },
        { sku_id: 'SKU-002', product_name: 'Gadget', quantity: 5, reorder_point: 15 },
      ],
    };
    const shipmentsFixture = [{ shipment_id: 'SHP-001', status: 'in_transit' }];
    const alertsFixture = { alerts: [{ alert_id: 'ALT-001', severity: 'high' }] };

    mockApiGet
      .mockResolvedValueOnce({ ok: true, status: 200, data: inventoryFixture })
      .mockResolvedValueOnce({ ok: true, status: 200, data: shipmentsFixture })
      .mockResolvedValueOnce({ ok: true, status: 200, data: alertsFixture });

    const { result } = await renderHook(() => useDashboardData());
    await act(() => flushPromises());
    expect(result.current.loading).toBe(false);
    expect(result.current.stockLevels.good).toBe(1);
    expect(result.current.stockLevels.low).toBe(1);
    expect(result.current.shipments.length).toBe(1);
  });

  it('provides refetch function', async () => {
    mockApiGet.mockResolvedValue({ ok: false, status: 502, data: null });
    mockApiPost.mockResolvedValue({ ok: false, status: 502, data: null });
    const { result } = await renderHook(() => useDashboardData());
    await act(() => flushPromises());
    expect(typeof result.current.refetch).toBe('function');
  });
});
