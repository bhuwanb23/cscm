import { apiGet, apiPost, request } from '../../../src/api/apiClient';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('request', () => {
  it('builds URL from path', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'healthy' }),
      headers: { get: () => 'application/json' },
    });
    const result = await request('GET', '/health');
    expect(result.ok).toBe(true);
    expect(result.data.status).toBe('healthy');
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toMatch(/\/health$/);
  });

  it('adds query params', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      headers: { get: () => 'application/json' },
    });
    await request('GET', '/test', { params: { limit: '10', offset: '0' } });
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('limit=10');
    expect(callUrl).toContain('offset=0');
  });

  it('sends JSON body for POST', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      headers: { get: () => 'application/json' },
    });
    await request('POST', '/test', { body: { key: 'value' } });
    const callOptions = mockFetch.mock.calls[0][1];
    expect(callOptions.method).toBe('POST');
    expect(JSON.parse(callOptions.body)).toEqual({ key: 'value' });
  });

  it('returns error response for non-ok status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'boom' }),
      headers: { get: () => 'application/json' },
    });
    const result = await request('GET', '/fail');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });

  it('returns network error when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network request failed'));
    const result = await request('GET', '/fail');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.message).toContain('Network request failed');
  });

  it('returns timeout error on abort with timeout message', async () => {
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    mockFetch.mockRejectedValue(abortErr);
    const result = await request('GET', '/slow', { timeoutMs: 1 });
    expect(result.ok).toBe(false);
    expect(result.isTimeout).toBe(true);
  });
});

describe('apiGet', () => {
  it('sends GET request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      headers: { get: () => 'application/json' },
    });
    const result = await apiGet('/test');
    expect(result.ok).toBe(true);
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });
});

describe('apiPost', () => {
  it('sends POST request with body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      headers: { get: () => 'application/json' },
    });
    const result = await apiPost('/test', { body: { a: 1 } });
    expect(result.ok).toBe(true);
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).a).toBe(1);
  });
});
