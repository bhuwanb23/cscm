/**
 * Service Discovery Module for Gateway
 * Provides service registration, health checking, and load balancing
 */

const logger = require('../utils/logger');

// Service registry — URLs are environment-driven so the same image works
// locally and on Render (AI_ML_API_URL / BACKEND_URL point at real services).
const serviceRegistry = {
  backend: {
    name: 'Backend API',
    instances: [
      {
        id: 'backend-1',
        url: process.env.BACKEND_URL || 'http://localhost:3000',
        health: 'unknown',
        lastCheck: null,
        weight: 100
      }
    ]
  },
  aiMl: {
    name: 'AI/ML Service',
    instances: [
      {
        id: 'ai-ml-1',
        url: process.env.AI_ML_API_URL || 'http://localhost:8000',
        health: 'unknown',
        lastCheck: null,
        weight: 100
      }
    ]
  }
};

/**
 * Get service URL by name
 */
function getServiceUrl(serviceName) {
  const service = serviceRegistry[serviceName];
  if (!service || !service.instances || service.instances.length === 0) {
    logger.error(`Service ${serviceName} not found in registry`);
    return null;
  }

  // Select healthy instance using weighted round-robin
  const healthyInstances = service.instances.filter(
    instance => instance.health === 'healthy'
  );

  if (healthyInstances.length === 0) {
    logger.warn(`No healthy instances for ${serviceName}, using all instances`);
    // Fall back to first instance
    return service.instances[0].url;
  }

  // Simple weighted selection (could be enhanced with proper load balancing)
  const totalWeight = healthyInstances.reduce((sum, instance) => sum + instance.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const instance of healthyInstances) {
    random -= instance.weight;
    if (random <= 0) {
      return instance.url;
    }
  }

  return healthyInstances[0].url;
}

/**
 * Register service instance
 */
function registerService(serviceName, instance) {
  const service = serviceRegistry[serviceName];
  if (!service) {
    logger.error(`Service ${serviceName} not found in registry`);
    return false;
  }

  const existingIndex = service.instances.findIndex(
    inst => inst.id === instance.id
  );

  if (existingIndex >= 0) {
    service.instances[existingIndex] = instance;
    logger.info(`Updated service instance ${instance.id} for ${serviceName}`);
  } else {
    service.instances.push(instance);
    logger.info(`Registered new service instance ${instance.id} for ${serviceName}`);
  }

  return true;
}

/**
 * Unregister service instance
 */
function unregisterService(serviceName, instanceId) {
  const service = serviceRegistry[serviceName];
  if (!service) {
    logger.error(`Service ${serviceName} not found in registry`);
    return false;
  }

  const index = service.instances.findIndex(inst => inst.id === instanceId);
  if (index >= 0) {
    service.instances.splice(index, 1);
    logger.info(`Unregistered service instance ${instanceId} for ${serviceName}`);
    return true;
  }

  return false;
}

/**
 * Health check service instance
 */
async function healthCheckInstance(serviceName, instanceId) {
  const service = serviceRegistry[serviceName];
  if (!service) {
    return false;
  }

  const instance = service.instances.find(inst => inst.id === instanceId);
  if (!instance) {
    return false;
  }

  try {
    // Use the module matching the target scheme — http.get cannot speak TLS,
    // so HTTPS services (e.g. Render) would always be reported unreachable.
    const http = require('http');
    const https = require('https');
    const url = new URL(instance.url);
    const transport = url.protocol === 'https:' ? https : http;

    const result = await new Promise((resolve) => {
      const clientReq = transport.get(`${url.protocol}//${url.host}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve(res.statusCode === 200 ? 'healthy' : 'unhealthy');
        });
      });
      clientReq.on('error', () => resolve('unreachable'));
      clientReq.setTimeout(3000, () => {
        clientReq.destroy();
        resolve('timeout');
      });
    });

    instance.health = result;
    instance.lastCheck = new Date().toISOString();
    
    logger.debug(`Health check for ${instanceId}: ${result}`);
    return result === 'healthy';
  } catch (error) {
    instance.health = 'unhealthy';
    instance.lastCheck = new Date().toISOString();
    logger.error(`Health check failed for ${instanceId}:`, error.message);
    return false;
  }
}

/**
 * Health check all instances of a service
 */
async function healthCheckService(serviceName) {
  const service = serviceRegistry[serviceName];
  if (!service) {
    return false;
  }

  const healthCheckPromises = service.instances.map(instance =>
    healthCheckInstance(serviceName, instance.id)
  );

  const results = await Promise.all(healthCheckPromises);
  const healthyCount = results.filter(result => result).length;
  
  logger.info(`Health check for ${serviceName}: ${healthyCount}/${service.instances.length} instances healthy`);
  
  return healthyCount > 0;
}

/**
 * Health check all services
 */
async function healthCheckAllServices() {
  const results = {};
  
  for (const serviceName of Object.keys(serviceRegistry)) {
    results[serviceName] = await healthCheckService(serviceName);
  }
  
  return results;
}

/**
 * Get service registry state
 */
function getServiceRegistryState() {
  return serviceRegistry;
}

/**
 * Get service instance by ID
 */
function getServiceInstance(serviceName, instanceId) {
  const service = serviceRegistry[serviceName];
  if (!service) {
    return null;
  }

  return service.instances.find(inst => inst.id === instanceId) || null;
}

/**
 * Update service weight
 */
function updateServiceWeight(serviceName, instanceId, weight) {
  const instance = getServiceInstance(serviceName, instanceId);
  if (instance) {
    instance.weight = weight;
    logger.info(`Updated weight for ${instanceId} to ${weight}`);
    return true;
  }
  return false;
}

/**
 * Start periodic health checks
 */
function startHealthChecks(intervalMs = 30000) {
  logger.info(`Starting periodic health checks every ${intervalMs}ms`);
  
  setInterval(async () => {
    await healthCheckAllServices();
  }, intervalMs);
}

/**
 * Get service metrics
 */
function getServiceMetrics() {
  const metrics = {};

  for (const [serviceName, service] of Object.entries(serviceRegistry)) {
    metrics[serviceName] = {
      totalInstances: service.instances.length,
      healthyInstances: service.instances.filter(i => i.health === 'healthy').length,
      unhealthyInstances: service.instances.filter(i => i.health !== 'healthy').length,
      instances: service.instances.map(instance => ({
        id: instance.id,
        health: instance.health,
        lastCheck: instance.lastCheck,
        weight: instance.weight
      }))
    };
  }

  return metrics;
}

module.exports = {
  getServiceUrl,
  registerService,
  unregisterService,
  healthCheckInstance,
  healthCheckService,
  healthCheckAllServices,
  getServiceRegistryState,
  getServiceInstance,
  updateServiceWeight,
  startHealthChecks,
  getServiceMetrics
};
