import React from 'react';
import { renderHook, act, cleanup } from '@testing-library/react-native';
import { useTasksData } from '../../../../users/transporters/tasks/hooks/useTasksData';

jest.mock('../../../../src/api/apiClient');

const mockApiGet = require('../../../../src/api/apiClient').apiGet;

function flushPromises() {
  return new Promise((r) => setImmediate(r));
}

beforeEach(() => {
  mockApiGet.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('useTasksData', () => {
  it('returns default tasks when API fails', async () => {
    mockApiGet.mockResolvedValue({ ok: false, status: 502, data: null });
    const { result } = await renderHook(() => useTasksData());
    await act(() => flushPromises());
    expect(result.current.loading).toBe(false);
    expect(Array.isArray(result.current.tasks)).toBe(true);
    expect(result.current.tasks.length).toBeGreaterThan(0);
  });

  it('merges in_transit and delivered shipments', async () => {
    const inTransit = [{ shipment_id: 'S1', status: 'in_transit', origin: 'WH-A', destination: 'Store-B' }];
    const delivered = [{ shipment_id: 'S2', status: 'delivered', delivered_at: '2026-06-01', recipient: 'John' }];

    mockApiGet
      .mockResolvedValueOnce({ ok: true, status: 200, data: inTransit })
      .mockResolvedValueOnce({ ok: true, status: 200, data: delivered });

    const { result } = await renderHook(() => useTasksData());
    await act(() => flushPromises());
    expect(result.current.counts.all).toBe(2);
    expect(result.current.counts.inProgress).toBe(1);
    expect(result.current.counts.completed).toBe(1);
  });

  it('computes counts correctly', async () => {
    const inTransit = [
      { shipment_id: 'S1', status: 'in_transit' },
      { shipment_id: 'S2', status: 'out_for_delivery' },
    ];
    const delivered = [
      { shipment_id: 'S3', status: 'delivered' },
    ];

    mockApiGet
      .mockResolvedValueOnce({ ok: true, status: 200, data: inTransit })
      .mockResolvedValueOnce({ ok: true, status: 200, data: delivered });

    const { result } = await renderHook(() => useTasksData());
    await act(() => flushPromises());
    expect(result.current.counts.all).toBe(3);
    expect(result.current.counts.inProgress).toBe(2);
    expect(result.current.counts.completed).toBe(1);
  });

  it('filters by search query', async () => {
    mockApiGet
      .mockResolvedValueOnce({ ok: false, status: 502 })
      .mockResolvedValueOnce({ ok: false, status: 502 });

    const { result } = await renderHook(() => useTasksData());
    await act(() => flushPromises());
    await act(() => result.current.setSearchQuery('NONEXISTENT-TASK-XXX'));
    expect(result.current.searchQuery).toBe('NONEXISTENT-TASK-XXX');
    expect(result.current.tasks.length).toBe(0);
  });

  it('filters by status', async () => {
    mockApiGet
      .mockResolvedValueOnce({ ok: false, status: 502 })
      .mockResolvedValueOnce({ ok: false, status: 502 });

    const { result } = await renderHook(() => useTasksData());
    await act(() => flushPromises());
    await act(() => result.current.setActiveFilter('completed'));
    expect(result.current.activeFilter).toBe('completed');
    result.current.tasks.forEach((t) => {
      expect(t.status).toBe('completed');
    });
  });
});
