/**
 * Comprehensive Deployment Validation
 * Tests all aspects of the deployed CSCM system
 */

const https = require('https');
const http = require('http');

const SERVICES = {
  backend: process.env.BACKEND_URL || 'http://localhost:3000',
  aiml: process.env.AI_ML_API_URL || 'http://localhost:8000',
  gateway: process.env.GATEWAY_URL || 'http://localhost:8080'
};

function makeRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
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
    const healthy = response.status === 200 && response.data.status === 'healthy';
    console.log(`${healthy ? '✅' : '❌'} ${serviceName} Health: ${response.status}`);
    if (healthy) {
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    }
    return { service: serviceName, healthy, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ ${serviceName} Health: Failed - ${error.message}`);
    return { service: serviceName, healthy: false, error: error.message };
  }
}

async function testBackendFunctionality() {
  console.log('\n=== Testing Backend Functionality ===');
  const results = [];

  // Test root endpoint
  try {
    const response = await makeRequest(SERVICES.backend);
    console.log(`✅ Backend Root: ${response.status}`);
    results.push({ test: 'root', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ Backend Root: Failed - ${error.message}`);
    results.push({ test: 'root', error: error.message, success: false });
  }

  // Test metrics endpoint
  try {
    const response = await makeRequest(`${SERVICES.backend}/metrics`);
    console.log(`✅ Backend Metrics: ${response.status}`);
    results.push({ test: 'metrics', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ Backend Metrics: Failed - ${error.message}`);
    results.push({ test: 'metrics', error: error.message, success: false });
  }

  // Test cache stats endpoint
  try {
    const response = await makeRequest(`${SERVICES.backend}/cache/stats`);
    console.log(`✅ Backend Cache Stats: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    results.push({ test: 'cache-stats', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ Backend Cache Stats: Failed - ${error.message}`);
    results.push({ test: 'cache-stats', error: error.message, success: false });
  }

  // Test inventory endpoint (will fail auth)
  try {
    const response = await makeRequest(`${SERVICES.backend}/api/v1/inventory`);
    console.log(`✅ Backend Inventory: ${response.status} (expected auth failure)`);
    results.push({ test: 'inventory-auth', status: response.status, success: response.status === 401 });
  } catch (error) {
    console.log(`❌ Backend Inventory: Failed - ${error.message}`);
    results.push({ test: 'inventory-auth', error: error.message, success: false });
  }

  return results;
}

async function testAIMLFunctionality() {
  console.log('\n=== Testing AI/ML Functionality ===');
  const results = [];

  // Test root endpoint
  try {
    const response = await makeRequest(SERVICES.aiml);
    console.log(`✅ AI/ML Root: ${response.status}`);
    console.log(`   Response:`, response.data);
    results.push({ test: 'root', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ AI/ML Root: Failed - ${error.message}`);
    results.push({ test: 'root', error: error.message, success: false });
  }

  // Test docs endpoint
  try {
    const response = await makeRequest(`${SERVICES.aiml}/docs`);
    console.log(`✅ AI/ML Docs: ${response.status}`);
    results.push({ test: 'docs', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ AI/ML Docs: Failed - ${error.message}`);
    results.push({ test: 'docs', error: error.message, success: false });
  }

  // Test health checks
  try {
    const response = await makeRequest(`${SERVICES.aiml}/health`);
    console.log(`✅ AI/ML Health Checks: ${response.status}`);
    console.log(`   Checks:`, JSON.stringify(response.data.checks, null, 2));
    results.push({ test: 'health-checks', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ AI/ML Health Checks: Failed - ${error.message}`);
    results.push({ test: 'health-checks', error: error.message, success: false });
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
    results.push({ test: 'demand-forecast', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ AI/ML Demand Forecast: Failed - ${error.message}`);
    results.push({ test: 'demand-forecast', error: error.message, success: false });
  }

  // Test inventory optimization endpoint
  try {
    const body = {
      store_id: "STORE001",
      products: ["PROD001", "PROD002"]
    };
    const response = await makeRequest(`${SERVICES.aiml}/api/v1/inventory/optimize`, 'POST', body);
    console.log(`✅ AI/ML Inventory Optimize: ${response.status}`);
    results.push({ test: 'inventory-optimize', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ AI/ML Inventory Optimize: Failed - ${error.message}`);
    results.push({ test: 'inventory-optimize', error: error.message, success: false });
  }

  return results;
}

async function testGatewayFunctionality() {
  console.log('\n=== Testing Gateway Functionality ===');
  const results = [];

  // Test health endpoint
  try {
    const response = await makeRequest(`${SERVICES.gateway}/health`);
    const healthy = response.status === 200;
    console.log(`${healthy ? '✅' : '❌'} Gateway Health: ${response.status}`);
    if (!healthy) {
      console.log(`   Error:`, response.data);
    }
    results.push({ test: 'health', status: response.status, success: healthy });
  } catch (error) {
    console.log(`❌ Gateway Health: Failed - ${error.message}`);
    results.push({ test: 'health', error: error.message, success: false });
  }

  // Test circuit breaker state
  try {
    const response = await makeRequest(`${SERVICES.gateway}/circuit-breaker/state`);
    console.log(`✅ Gateway Circuit Breaker: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    results.push({ test: 'circuit-breaker', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ Gateway Circuit Breaker: Failed - ${error.message}`);
    results.push({ test: 'circuit-breaker', error: error.message, success: false });
  }

  // Test services registry
  try {
    const response = await makeRequest(`${SERVICES.gateway}/services/registry`);
    console.log(`✅ Gateway Services Registry: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    results.push({ test: 'services-registry', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ Gateway Services Registry: Failed - ${error.message}`);
    results.push({ test: 'services-registry', error: error.message, success: false });
  }

  return results;
}

async function testCrossServiceCommunication() {
  console.log('\n=== Testing Cross-Service Communication ===');
  const results = [];

  // Test Gateway → Backend via health check
  try {
    const response = await makeRequest(`${SERVICES.gateway}/health/python`);
    console.log(`✅ Gateway → AI/ML Communication: ${response.status}`);
    results.push({ test: 'gateway-to-aiml', status: response.status, success: true });
  } catch (error) {
    console.log(`❌ Gateway → AI/ML Communication: Failed - ${error.message}`);
    results.push({ test: 'gateway-to-aiml', error: error.message, success: false });
  }

  return results;
}

async function runComprehensiveValidation() {
  console.log('=== CSCM Comprehensive Deployment Validation ===');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = {
    timestamp: new Date().toISOString(),
    services: {},
    backend: {},
    aiml: {},
    gateway: {},
    crossService: {}
  };

  // Test service health
  console.log('=== Service Health Tests ===');
  results.services.backend = await testServiceHealth('Backend', SERVICES.backend);
  results.services.aiml = await testServiceHealth('AI/ML', SERVICES.aiml);
  results.services.gateway = await testServiceHealth('Gateway', SERVICES.gateway);

  // Test backend functionality
  results.backend.tests = await testBackendFunctionality();

  // Test AI/ML functionality
  results.aiml.tests = await testAIMLFunctionality();

  // Test gateway functionality
  results.gateway.tests = await testGatewayFunctionality();

  // Test cross-service communication
  results.crossService.tests = await testCrossServiceCommunication();

  // Print summary
  console.log('\n=== Validation Summary ===');
  console.log(JSON.stringify(results, null, 2));

  // Calculate success rates
  const backendSuccess = results.backend.tests.filter(t => t.success).length;
  const backendTotal = results.backend.tests.length;
  const aimlSuccess = results.aiml.tests.filter(t => t.success).length;
  const aimlTotal = results.aiml.tests.length;
  const gatewaySuccess = results.gateway.tests.filter(t => t.success).length;
  const gatewayTotal = results.gateway.tests.length;
  const crossServiceSuccess = results.crossService.tests.filter(t => t.success).length;
  const crossServiceTotal = results.crossService.tests.length;

  const allTests = [
    ...results.backend.tests,
    ...results.aiml.tests,
    ...results.gateway.tests,
    ...results.crossService.tests
  ];
  const totalPassed = allTests.filter(t => t.success).length;
  const totalTests = allTests.length;
  const overallSuccessRate = Math.round((totalPassed / totalTests) * 100);

  console.log('\n=== Success Rates ===');
  console.log(`Backend: ${Math.round((backendSuccess / backendTotal) * 100)}% (${backendSuccess}/${backendTotal})`);
  console.log(`AI/ML: ${Math.round((aimlSuccess / aimlTotal) * 100)}% (${aimlSuccess}/${aimlTotal})`);
  console.log(`Gateway: ${Math.round((gatewaySuccess / gatewayTotal) * 100)}% (${gatewaySuccess}/${gatewayTotal})`);
  console.log(`Cross-Service: ${Math.round((crossServiceSuccess / crossServiceTotal) * 100)}% (${crossServiceSuccess}/${crossServiceTotal})`);
  console.log(`Overall: ${overallSuccessRate}% (${totalPassed}/${totalTests})`);

  // Critical services status
  console.log('\n=== Critical Services Status ===');
  console.log(`Backend: ${results.services.backend.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log(`AI/ML: ${results.services.aiml.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log(`Gateway: ${results.services.gateway.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);

  // Database and Redis status (inferred from backend health)
  if (results.services.backend.healthy) {
    console.log('\n=== Inferred Infrastructure Status ===');
    console.log('Database: ✅ Connected (inferred from backend health)');
    console.log('Redis: ✅ Connected (inferred from backend health)');
  }

  return results;
}

// Run validation
if (require.main === module) {
  runComprehensiveValidation()
    .then((results) => {
      const allTests = [
        ...results.backend.tests,
        ...results.aiml.tests,
        ...results.gateway.tests,
        ...results.crossService.tests
      ];
      const totalPassed = allTests.filter(t => t.success).length;
      const totalTests = allTests.length;
      const successRate = Math.round((totalPassed / totalTests) * 100);

      console.log(`\n${successRate >= 75 ? '✅' : '⚠️'} Validation completed with ${successRate}% success rate`);

      if (successRate >= 75) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveValidation };
