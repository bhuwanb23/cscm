/**
 * Deployment Validation Script
 * Tests all deployed services end-to-end
 */

const https = require('https');
const http = require('http');

const SERVICES = {
  backend: 'https://cscm-backend.onrender.com',
  aiml: 'https://cscm-aiml.onrender.com',
  gateway: 'https://cscm-gateway.onrender.com'
};

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testServiceHealth(serviceName, url) {
  try {
    console.log(`Testing ${serviceName} health...`);
    const response = await makeRequest(`${url}/health`);
    console.log(`✅ ${serviceName} Health: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    return { service: serviceName, health: 'healthy', status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ ${serviceName} Health: Failed - ${error.message}`);
    return { service: serviceName, health: 'failed', error: error.message };
  }
}

async function testBackendEndpoints() {
  console.log('\n=== Testing Backend Endpoints ===');
  const results = [];

  // Test root endpoint
  try {
    const response = await makeRequest(SERVICES.backend);
    console.log(`✅ Backend Root: ${response.status}`);
    results.push({ endpoint: 'root', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ Backend Root: Failed - ${error.message}`);
    results.push({ endpoint: 'root', error: error.message, success: false });
  }

  // Test metrics endpoint
  try {
    const response = await makeRequest(`${SERVICES.backend}/metrics`);
    console.log(`✅ Backend Metrics: ${response.status}`);
    results.push({ endpoint: 'metrics', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ Backend Metrics: Failed - ${error.message}`);
    results.push({ endpoint: 'metrics', error: error.message, success: false });
  }

  // Test inventory endpoint (will likely fail auth)
  try {
    const response = await makeRequest(`${SERVICES.backend}/api/v1/inventory`);
    console.log(`✅ Backend Inventory: ${response.status} (expected auth failure)`);
    results.push({ endpoint: 'inventory', status: response.status, success: response.status === 401 });
  } catch (error) {
    console.log(`❌ Backend Inventory: Failed - ${error.message}`);
    results.push({ endpoint: 'inventory', error: error.message, success: false });
  }

  return results;
}

async function testAIMLEndpoints() {
  console.log('\n=== Testing AI/ML Endpoints ===');
  const results = [];

  // Test root endpoint
  try {
    const response = await makeRequest(SERVICES.aiml);
    console.log(`✅ AI/ML Root: ${response.status}`);
    results.push({ endpoint: 'root', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ AI/ML Root: Failed - ${error.message}`);
    results.push({ endpoint: 'root', error: error.message, success: false });
  }

  // Test docs endpoint
  try {
    const response = await makeRequest(`${SERVICES.aiml}/docs`);
    console.log(`✅ AI/ML Docs: ${response.status}`);
    results.push({ endpoint: 'docs', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ AI/ML Docs: Failed - ${error.message}`);
    results.push({ endpoint: 'docs', error: error.message, success: false });
  }

  // Test demand forecast endpoint
  try {
    const body = {
      product_id: "PROD001",
      store_id: "STORE001",
      forecast_horizon: 7
    };
    const response = await makeRequest(`${SERVICES.aiml}/api/v1/demand/forecast`, 'POST', body);
    console.log(`✅ AI/ML Demand Forecast: ${response.status}`);
    results.push({ endpoint: 'demand-forecast', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ AI/ML Demand Forecast: Failed - ${error.message}`);
    results.push({ endpoint: 'demand-forecast', error: error.message, success: false });
  }

  return results;
}

async function testGatewayEndpoints() {
  console.log('\n=== Testing Gateway Endpoints ===');
  const results = [];

  // Test health endpoint
  try {
    const response = await makeRequest(`${SERVICES.gateway}/health`);
    console.log(`✅ Gateway Health: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    results.push({ endpoint: 'health', status: response.status, success: response.status === 200 });
  } catch (error) {
    console.log(`❌ Gateway Health: Failed - ${error.message}`);
    results.push({ endpoint: 'health', error: error.message, success: false });
  }

  // Test services registry
  try {
    const response = await makeRequest(`${SERVICES.gateway}/services/registry`);
    console.log(`✅ Gateway Services Registry: ${response.status}`);
    results.push({ endpoint: 'services-registry', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ Gateway Services Registry: Failed - ${error.message}`);
    results.push({ endpoint: 'services-registry', error: error.message, success: false });
  }

  return results;
}

async function runValidation() {
  console.log('=== CSCM Deployment Validation ===\n');

  const results = {
    timestamp: new Date().toISOString(),
    services: {},
    backend: {},
    aiml: {},
    gateway: {}
  };

  // Test service health
  results.services.backend = await testServiceHealth('Backend', SERVICES.backend);
  results.services.aiml = await testServiceHealth('AI/ML', SERVICES.aiml);
  results.services.gateway = await testServiceHealth('Gateway', SERVICES.gateway);

  // Test backend endpoints
  results.backend.endpoints = await testBackendEndpoints();

  // Test AI/ML endpoints
  results.aiml.endpoints = await testAIMLEndpoints();

  // Test gateway endpoints
  results.gateway.endpoints = await testGatewayEndpoints();

  // Print summary
  console.log('\n=== Validation Summary ===');
  console.log(JSON.stringify(results, null, 2));

  // Calculate success rate
  const allTests = [
    ...results.backend.endpoints,
    ...results.aiml.endpoints,
    ...results.gateway.endpoints
  ];
  const passed = allTests.filter(t => t.success).length;
  const total = allTests.length;
  const successRate = Math.round((passed / total) * 100);

  console.log(`\nSuccess Rate: ${successRate}% (${passed}/${total} tests passed)`);

  return results;
}

// Run validation
if (require.main === module) {
  runValidation()
    .then(() => {
      console.log('\n✅ Validation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { runValidation };
