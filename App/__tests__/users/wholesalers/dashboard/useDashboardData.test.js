import React from 'react';
import { renderHook, act, cleanup } from '@testing-library/react-native';
import { useDashboardData } from '../../../../users/wholesalers/dashboard/hooks/useDashboardData';

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

describe('useDashboardData (wholesaler)', () => {
  it('returns default data when API fails', async () => {
    mockApiGet.mockResolvedValue({ ok: false, status: 502, data: null });
    mockApiPost.mockResolvedValue({ ok: false, status: 502, data: null });
    const { result } = await renderHook(() => useDashboardData());
    await act(() => flushPromises());
    expect(result.current.loading).toBe(false);
    expect(result.current.stats).toBeDefined();
    expect(result.current.recentOrders).toBeDefined();
    expect(result.current.topRetailers).toBeDefined();
  });

  it('returns API data when available', async () => {
    const ordersFixture = [{ order_id: 'ORD-001', status: 'pending', total_amount: 1500 }];
    const inventoryFixture = { items: [{ sku_id: 'SKU-001', quantity: 100 }] };
    const recommendationsFixture = { recommended: ['SUP-001'] };

    mockApiGet
      .mockResolvedValueOnce({ ok: true, status: 200, data: ordersFixture })
      .mockResolvedValueOnce({ ok: true, status: 200, data: inventoryFixture });
    mockApiPost
      .mockResolvedValueOnce({ ok: true, status: 200, data: recommendationsFixture });

    const { result } = await renderHook(() => useDashboardData());
    await act(() => flushPromises());
    expect(result.current.loading).toBe(false);
    expect(result.current.stats).toBeDefined();
  });

  it('provides refetch function', async () => {
    mockApiGet.mockResolvedValue({ ok: false, status: 502, data: null });
    mockApiPost.mockResolvedValue({ ok: false, status: 502, data: null });
    const { result } = await renderHook(() => useDashboardData());
    await act(() => flushPromises());
    expect(typeof result.current.refetch).toBe('function');
  });
});
