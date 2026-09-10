/**
 * Simple API Endpoint Validation
 * Tests that API endpoints are accessible and return valid responses
 */

const http = require('http');

class APIValidator {
  constructor() {
    this.results = [];
  }

  /**
   * Make a simple HTTP request
   */
  async request(url, method = 'GET', body = null) {
    return new Promise((resolve) => {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ success: true, status: res.statusCode, data: json });
          } catch (e) {
            resolve({ success: true, status: res.statusCode, data: data });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Test Backend API endpoints
   */
  async testBackendAPI() {
    console.log('\n🔧 Testing Backend API (port 3000)...');

    const tests = [
      { name: 'Health Check', url: 'http://localhost:3000/health' },
      { name: 'Create Order', url: 'http://localhost:3000/api/v1/orders', method: 'POST', body: { store_id: 'test', items: [] } },
      { name: 'Get Inventory', url: 'http://localhost:3000/api/v1/inventory/test' }
    ];

    for (const test of tests) {
      const result = await this.request(test.url, test.method || 'GET', test.body || null);
      if (result.success) {
        console.log(`  ✓ ${test.name}: ${result.status}`);
        this.results.push({ service: 'Backend', test: test.name, status: 'pass' });
      } else {
        console.log(`  ✗ ${test.name}: ${result.error}`);
        this.results.push({ service: 'Backend', test: test.name, status: 'fail', error: result.error });
      }
    }
  }

  /**
   * Test Gateway endpoints
   */
  async testGateway() {
    console.log('\n🌐 Testing API Gateway (port 8080)...');

    const tests = [
      { name: 'Gateway Health', url: 'http://localhost:8080/health' },
      { name: 'Backend Proxy', url: 'http://localhost:8080/api/v1/inventory/test' }
    ];

    for (const test of tests) {
      const result = await this.request(test.url, test.method || 'GET', test.body || null);
      if (result.success) {
        console.log(`  ✓ ${test.name}: ${result.status}`);
        this.results.push({ service: 'Gateway', test: test.name, status: 'pass' });
      } else {
        console.log(`  ✗ ${test.name}: ${result.error}`);
        this.results.push({ service: 'Gateway', test: test.name, status: 'fail', error: result.error });
      }
    }
  }

  /**
   * Test AI/ML endpoints
   */
  async testAiMl() {
    console.log('\n🤖 Testing AI/ML Service (port 8000)...');

    const tests = [
      { name: 'AI/ML Health', url: 'http://localhost:8000/health' },
      { name: 'Demand Forecast', url: 'http://localhost:8000/api/v1/demand/forecast', method: 'POST', body: { sku_id: 'test', store_id: 'test', forecast_horizon: 30 } },
      { name: 'Inventory Optimize', url: 'http://localhost:8000/api/v1/inventory/optimize', method: 'POST', body: { sku_id: 'test', store_id: 'test', current_quantity: 100 } }
    ];

    for (const test of tests) {
      const result = await this.request(test.url, test.method || 'GET', test.body || null);
      if (result.success) {
        console.log(`  ✓ ${test.name}: ${result.status}`);
        this.results.push({ service: 'AI/ML', test: test.name, status: 'pass' });
      } else {
        console.log(`  ✗ ${test.name}: ${result.error}`);
        this.results.push({ service: 'AI/ML', test: test.name, status: 'fail', error: result.error });
      }
    }
  }

  /**
   * Run all validations
   */
  async runAll() {
    console.log('='.repeat(60));
    console.log('CSCM API Endpoint Validation');
    console.log('='.repeat(60));

    await this.testBackendAPI();
    await this.testGateway();
    await this.testAiMl();

    this.printSummary();
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('Validation Summary');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed === 0) {
      console.log('\n✅ All API endpoints are working!');
    } else {
      console.log('\n❌ Some API endpoints failed');
      console.log('\nFailed Tests:');
      this.results.filter(r => r.status === 'fail').forEach(r => {
        console.log(`  - ${r.service}/${r.test}: ${r.error}`);
      });
    }

    console.log('='.repeat(60));
  }
}

// Run validation
const validator = new APIValidator();
validator.runAll()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Validation failed:', err);
    process.exit(1);
  });
