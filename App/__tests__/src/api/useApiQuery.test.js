import React from 'react';
import { renderHook, act, cleanup } from '@testing-library/react-native';
import { useApiQuery } from '../../../src/api/useApiQuery';

jest.mock('../../../src/api/apiClient');

const mockApiGet = require('../../../src/api/apiClient').apiGet;

function flushPromises() {
  return new Promise((r) => setImmediate(r));
}

beforeEach(() => {
  mockApiGet.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('useApiQuery', () => {
  it('starts with loading=false when enabled and API resolves', async () => {
    mockApiGet.mockResolvedValue({ ok: true, status: 200, data: [] });
    const { result } = await renderHook(() =>
      useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' } })
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns data on success', async () => {
    const fixture = [{ shipment_id: 'SHP-001', status: 'in_transit' }];
    mockApiGet.mockResolvedValue({ ok: true, status: 200, data: fixture });
    const { result } = await renderHook(() =>
      useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' } })
    );
    await act(() => flushPromises());
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(fixture);
    expect(result.current.error).toBeNull();
  });

  it('returns error on API failure', async () => {
    mockApiGet.mockResolvedValue({ ok: false, status: 500, data: null });
    const { result } = await renderHook(() =>
      useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' } })
    );
    await act(() => flushPromises());
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('stays loading=false when disabled', async () => {
    const { result } = await renderHook(() =>
      useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' }, enabled: false })
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('refetch re-fires the API call', async () => {
    const fixture = [{ id: 1 }];
    mockApiGet.mockResolvedValue({ ok: true, status: 200, data: fixture });
    const { result } = await renderHook(() =>
      useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'delivered' } })
    );
    await act(() => flushPromises());
    expect(result.current.data).toEqual(fixture);
    mockApiGet.mockClear();
    const fixture2 = [{ id: 2 }];
    mockApiGet.mockResolvedValue({ ok: true, status: 200, data: fixture2 });
    await act(() => result.current.refetch());
    expect(result.current.data).toEqual(fixture2);
  });

  it('calls onSuccess callback when data arrives', async () => {
    const onSuccess = jest.fn();
    mockApiGet.mockResolvedValue({ ok: true, status: 200, data: [{ id: 1 }] });
    await renderHook(() =>
      useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' }, onSuccess })
    );
    await act(() => flushPromises());
    expect(onSuccess).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('calls onError on failure', async () => {
    const onError = jest.fn();
    mockApiGet.mockResolvedValue({ ok: false, status: 404, data: null });
    await renderHook(() =>
      useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' }, onError })
    );
    await act(() => flushPromises());
    expect(onError).toHaveBeenCalled();
  });
});
