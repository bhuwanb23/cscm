jest.mock('axios');
const axios = require('axios');
const BaseApiService = require('../../services/BaseApiService');

let service;
let mockClient;

beforeEach(() => {
  mockClient = jest.fn();
  mockClient.get = jest.fn();
  axios.create.mockReturnValue(mockClient);
  service = new BaseApiService({ baseUrl: 'http://test:9999', cacheTtlMs: 5000, maxCircuitFailures: 3, circuitCooldownMs: 10000 });
});

describe('constructor', () => {
  test('uses defaults when no options provided', () => {
    const s = new BaseApiService();
    expect(s.baseUrl).toBeTruthy();
    expect(s.timeout).toBe(30000);
    expect(s.maxRetries).toBe(3);
  });

  test('accepts custom options', () => {
    const s = new BaseApiService({ baseUrl: 'http://custom', timeout: 5000, maxRetries: 5 });
    expect(s.baseUrl).toBe('http://custom');
    expect(s.timeout).toBe(5000);
    expect(s.maxRetries).toBe(5);
  });
});

describe('_shouldRetry', () => {
  test('retries on network error', () => {
    expect(service._shouldRetry({ response: null }, 0)).toBe(true);
  });

  test('retries on 5xx', () => {
    expect(service._shouldRetry({ response: { status: 500 } }, 1)).toBe(true);
    expect(service._shouldRetry({ response: { status: 503 } }, 2)).toBe(true);
  });

  test('retries on 429', () => {
    expect(service._shouldRetry({ response: { status: 429 } }, 0)).toBe(true);
  });

  test('stops retrying after maxRetries', () => {
    expect(service._shouldRetry({ response: null }, 3)).toBe(false);
    expect(service._shouldRetry({ response: { status: 500 } }, 3)).toBe(false);
  });
});

describe('_cacheKey', () => {
  test('generates unique keys', () => {
    const key1 = service._cacheKey('get', '/path', { a: 1 });
    const key2 = service._cacheKey('get', '/path', { a: 2 });
    expect(key1).not.toBe(key2);
  });
});

describe('_buildClient', () => {
  test('creates axios instance with auth token', () => {
    const s = new BaseApiService({ baseUrl: 'http://x', authToken: 'tok' });
    s._buildClient();
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer tok' })
    }));
  });
});

describe('cache', () => {
  test('stores and retrieves cached value', () => {
    service._setCache('k', 'v');
    expect(service._getCached('k')).toBe('v');
  });

  test('returns null for expired cache', () => {
    service._setCache('k', 'v', -1000);
    expect(service._getCached('k')).toBeNull();
  });

  test('clearCache empties the cache', () => {
    service._setCache('k', 'v');
    service.clearCache();
    expect(service._getCached('k')).toBeNull();
  });
});

describe('circuit breaker', () => {
  test('starts closed', () => {
    expect(service._circuitBreaker.isOpen).toBe(false);
  });

  test('opens after maxFailures', () => {
    for (let i = 0; i < 3; i++) service._recordFailure();
    expect(service._circuitBreaker.isOpen).toBe(true);
    expect(service._isCircuitOpen()).toBe(true);
  });

  test('resets on success', () => {
    service._circuitBreaker.failCount = 2;
    service._recordSuccess();
    expect(service._circuitBreaker.failCount).toBe(0);
  });
});

describe('call()', () => {
  test('successful GET returns data', async () => {
    mockClient.mockResolvedValue({ status: 200, data: { ok: true } });
    const result = await service.call('get', '/test');
    expect(result).toEqual({ ok: true });
  });

  test('successful POST returns data', async () => {
    mockClient.mockResolvedValue({ status: 201, data: { id: 1 } });
    const result = await service.call('post', '/items', { name: 'x' });
    expect(result).toEqual({ id: 1 });
  });

  test('caches GET results', async () => {
    mockClient.mockResolvedValue({ status: 200, data: { val: 1 } });
    await service.call('get', '/cached');
    await service.call('get', '/cached');
    expect(mockClient).toHaveBeenCalledTimes(1);
  });

  test('does not cache POST results', async () => {
    mockClient.mockResolvedValue({ status: 200, data: { val: 1 } });
    await service.call('post', '/no-cache', { x: 1 });
    await service.call('post', '/no-cache', { x: 1 });
    expect(mockClient).toHaveBeenCalledTimes(2);
  });

  test('bypasses cache when allowCache=false', async () => {
    mockClient.mockResolvedValue({ status: 200, data: { val: 1 } });
    await service.call('get', '/no-cache', null, { allowCache: false });
    await service.call('get', '/no-cache', null, { allowCache: false });
    expect(mockClient).toHaveBeenCalledTimes(2);
  });

  test('retries on failure then succeeds', async () => {
    mockClient
      .mockRejectedValueOnce(new Error('net error'))
      .mockResolvedValueOnce({ status: 200, data: { ok: true } });
    const result = await service.call('get', '/retry');
    expect(result).toEqual({ ok: true });
  });

  test('throws after exhausting retries', async () => {
    mockClient.mockRejectedValue(new Error('persistent'));
    await expect(service.call('get', '/die')).rejects.toThrow('persistent');
  });

  test('throws when circuit breaker is open', async () => {
    service._circuitBreaker.isOpen = true;
    service._circuitBreaker.failCount = 3;
    service._circuitBreaker.lastFailureTime = Date.now();
    await expect(service.call('get', '/blocked')).rejects.toThrow('Circuit breaker open');
  });

  test('serves stale cache when request fails', async () => {
    mockClient.mockResolvedValueOnce({ status: 200, data: { val: 'stale' } });
    await service.call('get', '/stale');
    mockClient.mockRejectedValue(new Error('down'));
    const result = await service.call('get', '/stale');
    expect(result).toEqual({ val: 'stale' });
  });
});

describe('healthCheck', () => {
  test('returns true when healthy', async () => {
    mockClient.get.mockResolvedValue({ status: 200 });
    const result = await service.healthCheck();
    expect(result).toBe(true);
  });

  test('returns false on error', async () => {
    mockClient.get.mockRejectedValue(new Error('down'));
    const result = await service.healthCheck();
    expect(result).toBe(false);
  });
});
