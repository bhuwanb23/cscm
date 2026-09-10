/**
 * API Client for E2E Tests
 * HTTP client for making API requests to gateway, backend, and AI/ML services
 */

const config = require('./test-config');

class ApiClient {
  constructor() {
    this.gatewayUrl = config.services.gateway;
    this.backendUrl = config.services.backend;
    this.aiMlUrl = config.services.aiMl;
    this.timeout = config.timeouts.request;
    this.retryConfig = config.retry;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request(method, url, options = {}) {
    const {
      body = null,
      headers = {},
      queryParams = {},
      timeout = this.timeout,
      retries = this.retryConfig.maxAttempts
    } = options;

    // Add query parameters
    let fullUrl = url;
    if (Object.keys(queryParams).length > 0) {
      const queryString = new URLSearchParams(queryParams).toString();
      fullUrl = `${url}?${queryString}`;
    }

    // Prepare request options
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    // Retry logic
    let lastError;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(fullUrl, requestOptions);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return {
          success: true,
          data,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        lastError = error;
        
        if (attempt < retries - 1) {
          const delay = this.retryConfig.delay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * GET request
   */
  async get(url, options = {}) {
    return this.request('GET', url, options);
  }

  /**
   * POST request
   */
  async post(url, body, options = {}) {
    return this.request('POST', url, { ...options, body });
  }

  /**
   * PUT request
   */
  async put(url, body, options = {}) {
    return this.request('PUT', url, { ...options, body });
  }

  /**
   * PATCH request
   */
  async patch(url, body, options = {}) {
    return this.request('PATCH', url, { ...options, body });
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.request('DELETE', url, options);
  }

  /**
   * Gateway API calls
   */
  async gatewayGet(path, options = {}) {
    return this.get(`${this.gatewayUrl}${path}`, options);
  }

  async gatewayPost(path, body, options = {}) {
    return this.post(`${this.gatewayUrl}${path}`, body, options);
  }

  async gatewayPut(path, body, options = {}) {
    return this.put(`${this.gatewayUrl}${path}`, body, options);
  }

  async gatewayPatch(path, body, options = {}) {
    return this.patch(`${this.gatewayUrl}${path}`, body, options);
  }

  async gatewayDelete(path, options = {}) {
    return this.delete(`${this.gatewayUrl}${path}`, options);
  }

  /**
   * Backend API calls (direct)
   */
  async backendGet(path, options = {}) {
    return this.get(`${this.backendUrl}${path}`, options);
  }

  async backendPost(path, body, options = {}) {
    return this.post(`${this.backendUrl}${path}`, body, options);
  }

  async backendPut(path, body, options = {}) {
    return this.put(`${this.backendUrl}${path}`, body, options);
  }

  async backendPatch(path, body, options = {}) {
    return this.patch(`${this.backendUrl}${path}`, body, options);
  }

  async backendDelete(path, options = {}) {
    return this.delete(`${this.backendUrl}${path}`, options);
  }

  /**
   * AI/ML API calls
   */
  async aiMlGet(path, options = {}) {
    return this.get(`${this.aiMlUrl}${path}`, options);
  }

  async aiMlPost(path, body, options = {}) {
    return this.post(`${this.aiMlUrl}${path}`, body, options);
  }

  /**
   * Health check for services
   */
  async checkGatewayHealth() {
    try {
      const response = await this.gatewayGet('/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  async checkBackendHealth() {
    try {
      const response = await this.backendGet('/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  async checkAiMlHealth() {
    try {
      const response = await this.aiMlGet('/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  async checkAllServices() {
    const gateway = await this.checkGatewayHealth();
    const backend = await this.checkBackendHealth();
    const aiMl = await this.checkAiMlHealth();

    return {
      gateway,
      backend,
      aiMl,
      allHealthy: gateway && backend && aiMl
    };
  }

  /**
   * Utility function to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for service to be healthy
   */
  async waitForService(healthCheck, timeout = config.timeouts.serviceStartup) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await healthCheck()) {
        return true;
      }
      await this.sleep(1000);
    }
    
    throw new Error('Service did not become healthy within timeout');
  }

  /**
   * Wait for all services to be healthy
   */
  async waitForAllServices() {
    console.log('Waiting for all services to be healthy...');
    
    await Promise.all([
      this.waitForService(() => this.checkGatewayHealth()),
      this.waitForService(() => this.checkBackendHealth()),
      this.waitForService(() => this.checkAiMlHealth())
    ]);
    
    console.log('All services are healthy');
  }
}

module.exports = ApiClient;
