const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class BaseApiService {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || config.aiMl.apiUrl;
    this.timeout = options.timeout || config.aiMl.timeout;
    this.healthTimeout = options.healthTimeout || 5000;
    this.maxRetries = options.maxRetries || 3;
    this.authToken = options.authToken || config.aiMl.apiKey;

    this._circuitBreaker = {
      failCount: 0,
      maxFailures: options.maxCircuitFailures || 5,
      cooldownMs: options.circuitCooldownMs || 30000,
      lastFailureTime: 0,
      isOpen: false,
    };

    this._cache = new Map();
    this._defaultCacheTtlMs = options.cacheTtlMs || 60000;
  }

  _buildClient(timeout) {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return axios.create({
      baseURL: this.baseUrl,
      timeout: timeout || this.timeout,
      headers,
    });
  }

  _cacheKey(method, path, data) {
    return `${method}:${path}:${JSON.stringify(data || {})}`;
  }

  _getCached(key) {
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this._cache.delete(key);
      return null;
    }
    return entry.value;
  }

  _setCache(key, value, ttlMs) {
    this._cache.set(key, { value, expiry: Date.now() + (ttlMs || this._defaultCacheTtlMs) });
  }

  _isCircuitOpen() {
    const cb = this._circuitBreaker;
    if (!cb.isOpen) return false;
    if (Date.now() - cb.lastFailureTime >= cb.cooldownMs) {
      cb.isOpen = false;
      cb.failCount = 0;
      return false;
    }
    return true;
  }

  _recordFailure() {
    const cb = this._circuitBreaker;
    cb.failCount++;
    cb.lastFailureTime = Date.now();
    if (cb.failCount >= cb.maxFailures) {
      cb.isOpen = true;
      logger.warn(`[BaseApiService] Circuit breaker opened after ${cb.failCount} failures`);
    }
  }

  _recordSuccess() {
    this._circuitBreaker.failCount = 0;
  }

  _shouldRetry(error, attempt) {
    if (attempt >= this.maxRetries) return false;
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 || status === 429;
  }

  _logRequest(method, path, data) {
    const truncated = data ? JSON.stringify(data).slice(0, 200) : '';
    logger.info(`[BaseApiService] --> ${method} ${path} ${truncated}`);
  }

  _logResponse(method, path, status, durationMs, data) {
    const truncated = data ? JSON.stringify(data).slice(0, 200) : '';
    logger.info(`[BaseApiService] <-- ${method} ${path} ${status} ${durationMs}ms ${truncated}`);
  }

  async _request(method, path, data, attempt = 0) {
    const client = this._buildClient();
    const config = { method, url: path };
    if (data) config.data = data;

    const start = Date.now();
    try {
      const response = await client(config);
      const duration = Date.now() - start;
      this._logResponse(method, path, response.status, duration, response.data);
      return response.data;
    } catch (error) {
      const duration = Date.now() - start;
      const status = error.response ? error.response.status : 'NETWORK';
      this._logResponse(method, path, status, duration, null);

      if (this._shouldRetry(error, attempt)) {
        const delay = Math.min(200 * Math.pow(2, attempt), 2000);
        logger.warn(`[BaseApiService] Retry ${attempt + 1}/${this.maxRetries} after ${delay}ms: ${method} ${path} (${status})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._request(method, path, data, attempt + 1);
      }
      throw error;
    }
  }

  _getFallback(method, path, data) {
    return null;
  }

  async call(method, path, data = null, options = {}) {
    const allowFallback = options.allowFallback !== false;
    const allowCache = options.allowCache !== false;
    const bypassCircuitBreaker = options.bypassCircuitBreaker || false;

    const key = this._cacheKey(method, path, data);

    if (allowCache && method === 'get') {
      const cached = this._getCached(key);
      if (cached) return cached;
    }

    if (!bypassCircuitBreaker && this._isCircuitOpen()) {
      logger.warn(`[BaseApiService] Circuit breaker open for ${method} ${path}, using fallback`);
      const fallback = this._getFallback(method, path, data);
      if (fallback) return fallback;
      throw new Error(`Circuit breaker open for ${method} ${path}`);
    }

    this._logRequest(method, path, data);

    try {
      const result = await this._request(method, path, data);
      this._recordSuccess();

      if (allowCache) {
        this._setCache(key, result);
      }

      return result;
    } catch (error) {
      this._recordFailure();
      logger.error(`[BaseApiService] ${method} ${path} failed: ${error.message}`);

      if (allowCache) {
        const cached = this._getCached(key);
        if (cached) {
          logger.warn(`[BaseApiService] Serving stale cache for ${method} ${path}`);
          return cached;
        }
      }

      if (allowFallback) {
        const fallback = this._getFallback(method, path, data);
        if (fallback) {
          logger.warn(`[BaseApiService] Using fallback for ${method} ${path}`);
          return fallback;
        }
      }

      throw error;
    }
  }

  async healthCheck() {
    try {
      const client = this._buildClient(this.healthTimeout);
      const response = await client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  clearCache() {
    this._cache.clear();
  }
}

module.exports = BaseApiService;
