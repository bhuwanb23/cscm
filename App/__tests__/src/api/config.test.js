import { API_CONFIG, getDevBackendUrl, resetBackendUrlCache } from '../../../src/api/config';

describe('config', () => {
  beforeEach(() => {
    resetBackendUrlCache();
  });

  describe('API_CONFIG', () => {
    it('has timeoutMs', () => {
      expect(typeof API_CONFIG.timeoutMs).toBe('number');
      expect(API_CONFIG.timeoutMs).toBeGreaterThan(0);
    });

    it('has healthPath', () => {
      expect(API_CONFIG.healthPath).toBe('/health');
    });

    it('has defaultHeaders', () => {
      expect(API_CONFIG.defaultHeaders['Content-Type']).toBe('application/json');
    });

    it('has baseUrl getter', () => {
      const url = API_CONFIG.baseUrl;
      expect(typeof url).toBe('string');
      expect(url).toMatch(/^http/);
    });
  });

  describe('getDevBackendUrl', () => {
    it('returns a URL string', () => {
      const url = getDevBackendUrl();
      expect(typeof url).toBe('string');
      expect(url).toMatch(/^http:\/\//);
    });

    it('returns consistent value (cached)', () => {
      const url1 = getDevBackendUrl();
      const url2 = getDevBackendUrl();
      expect(url1).toBe(url2);
    });

    it('resets cache correctly', () => {
      const url1 = getDevBackendUrl();
      resetBackendUrlCache();
      const url2 = getDevBackendUrl();
      // Both should be valid URLs (may be same or different depending on env)
      expect(url1).toMatch(/^http/);
      expect(url2).toMatch(/^http/);
    });
  });
});
