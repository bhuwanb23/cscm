const logger = require('../utils/logger');

/**
 * Degradation Levels
 * Defines different levels of service degradation
 */
const DegradationLevel = {
  FULL: 'full',           // All services operational
  PARTIAL: 'partial',     // Some services degraded
  MINIMAL: 'minimal',     // Core services only
  CRITICAL: 'critical'     // Emergency mode
};

/**
 * Current Degradation State
 * Tracks the current degradation level and affected services
 */
const degradationState = {
  level: DegradationLevel.FULL,
  affectedServices: new Set(),
  timestamp: null,
  reason: null
};

/**
 * Service Dependencies
 * Defines which services depend on others
 */
const serviceDependencies = {
  backend: ['database', 'redis'],
  aiMl: [],
  gateway: ['backend', 'aiMl'],
  inventory: ['backend', 'aiMl'],
  orders: ['backend'],
  shipments: ['backend']
};

/**
 * Check Service Health
 * Determines if a service is healthy
 */
async function checkServiceHealth(serviceName) {
  try {
    // This would integrate with actual health check endpoints
    // For now, we'll simulate health checks
    logger.debug(`Checking health for service: ${serviceName}`);
    return true;
  } catch (error) {
    logger.error(`Health check failed for ${serviceName}:`, error);
    return false;
  }
}

/**
 * Determine Degradation Level
 * Analyzes service health to determine appropriate degradation level
 */
async function determineDegradationLevel() {
  const services = ['backend', 'aiMl', 'database', 'redis'];
  const healthStatus = {};
  
  for (const service of services) {
    healthStatus[service] = await checkServiceHealth(service);
  }
  
  // Count healthy services
  const healthyCount = Object.values(healthStatus).filter(Boolean).length;
  const totalServices = services.length;
  
  let level;
  if (healthyCount === totalServices) {
    level = DegradationLevel.FULL;
  } else if (healthyCount >= totalServices * 0.75) {
    level = DegradationLevel.PARTIAL;
  } else if (healthyCount >= totalServices * 0.5) {
    level = DegradationLevel.MINIMAL;
  } else {
    level = DegradationLevel.CRITICAL;
  }
  
  // Track affected services
  const affectedServices = services.filter(s => !healthStatus[s]);
  
  return { level, affectedServices, healthStatus };
}

/**
 * Set Degradation Level
 * Manually sets the degradation level
 */
function setDegradationLevel(level, reason = 'Manual intervention') {
  const previousLevel = degradationState.level;
  degradationState.level = level;
  degradationState.timestamp = new Date().toISOString();
  degradationState.reason = reason;
  
  logger.info(`Degradation level changed from ${previousLevel} to ${level}. Reason: ${reason}`);
  
  // Emit degradation event for monitoring
  emitDegradationEvent(level, previousLevel, reason);
}

/**
 * Get Degradation State
 * Returns current degradation state
 */
function getDegradationState() {
  return {
    level: degradationState.level,
    affectedServices: Array.from(degradationState.affectedServices),
    timestamp: degradationState.timestamp,
    reason: degradationState.reason
  };
}

/**
 * Is Service Degraded
 * Checks if a specific service is currently degraded
 */
function isServiceDegraded(serviceName) {
  return degradationState.affectedServices.has(serviceName);
}

/**
 * Mark Service as Degraded
 * Marks a service as degraded
 */
function markServiceDegraded(serviceName, reason) {
  degradationState.affectedServices.add(serviceName);
  logger.warn(`Service marked as degraded: ${serviceName}. Reason: ${reason}`);
  
  // Recalculate degradation level
  updateDegradationLevelBasedOnServices();
}

/**
 * Mark Service as Recovered
 * Marks a service as recovered
 */
function markServiceRecovered(serviceName) {
  degradationState.affectedServices.delete(serviceName);
  logger.info(`Service marked as recovered: ${serviceName}`);
  
  // Recalculate degradation level
  updateDegradationLevelBasedOnServices();
}

/**
 * Update Degradation Level Based on Services
 * Automatically updates degradation level based on affected services
 */
function updateDegradationLevelBasedOnServices() {
  const totalServices = Object.keys(serviceDependencies).length;
  const affectedCount = degradationState.affectedServices.size;
  
  let newLevel;
  if (affectedCount === 0) {
    newLevel = DegradationLevel.FULL;
  } else if (affectedCount <= totalServices * 0.25) {
    newLevel = DegradationLevel.PARTIAL;
  } else if (affectedCount <= totalServices * 0.5) {
    newLevel = DegradationLevel.MINIMAL;
  } else {
    newLevel = DegradationLevel.CRITICAL;
  }
  
  if (newLevel !== degradationState.level) {
    setDegradationLevel(newLevel, 'Automatic based on service health');
  }
}

/**
 * Should Feature Be Enabled
 * Determines if a feature should be enabled based on degradation level
 */
function shouldFeatureBeEnabled(feature, currentLevel = degradationState.level) {
  const featureRequirements = {
    'ai-ml-forecasting': [DegradationLevel.FULL, DegradationLevel.PARTIAL],
    'ai-ml-optimization': [DegradationLevel.FULL],
    'real-time-updates': [DegradationLevel.FULL, DegradationLevel.PARTIAL],
    'batch-processing': [DegradationLevel.FULL, DegradationLevel.PARTIAL, DegradationLevel.MINIMAL],
    'basic-crud': [DegradationLevel.FULL, DegradationLevel.PARTIAL, DegradationLevel.MINIMAL, DegradationLevel.CRITICAL],
    'authentication': [DegradationLevel.FULL, DegradationLevel.PARTIAL, DegradationLevel.MINIMAL, DegradationLevel.CRITICAL]
  };
  
  const allowedLevels = featureRequirements[feature] || [DegradationLevel.FULL];
  return allowedLevels.includes(currentLevel);
}

/**
 * Get Degraded Response
 * Returns a degraded response based on current degradation level
 */
function getDegradedResponse(operation, originalError = null) {
  const level = degradationState.level;
  
  switch (level) {
    case DegradationLevel.FULL:
      return {
        success: false,
        error: originalError?.message || 'Operation failed',
        degradation: false
      };
      
    case DegradationLevel.PARTIAL:
      return {
        success: true,
        data: getPartialFallback(operation),
        degradation: true,
        level: 'partial',
        message: 'Service partially degraded, using limited functionality'
      };
      
    case DegradationLevel.MINIMAL:
      return {
        success: true,
        data: getMinimalFallback(operation),
        degradation: true,
        level: 'minimal',
        message: 'Service minimally available, basic functionality only'
      };
      
    case DegradationLevel.CRITICAL:
      return {
        success: false,
        error: 'Service critically degraded, please try again later',
        degradation: true,
        level: 'critical',
        retryAfter: 60
      };
      
    default:
      return {
        success: false,
        error: 'Unknown degradation state',
        degradation: true
      };
  }
}

/**
 * Get Partial Fallback
 * Returns fallback data for partial degradation
 */
function getPartialFallback(operation) {
  const fallbacks = {
    'demand-forecast': { forecast: [100, 100, 100], source: 'cached' },
    'inventory-query': { items: [], cached: true },
    'order-create': { orderId: null, queued: true },
    'shipment-update': { status: 'pending', cached: true }
  };
  
  return fallbacks[operation] || { message: 'Limited functionality available' };
}

/**
 * Get Minimal Fallback
 * Returns fallback data for minimal degradation
 */
function getMinimalFallback(operation) {
  const fallbacks = {
    'demand-forecast': { forecast: [50, 50, 50], source: 'default' },
    'inventory-query': { items: [], cached: false },
    'order-create': { orderId: null, queued: false },
    'shipment-update': { status: 'unknown' }
  };
  
  return fallbacks[operation] || { message: 'Basic functionality only' };
}

/**
 * Emit Degradation Event
 * Emits degradation event for monitoring
 */
function emitDegradationEvent(newLevel, previousLevel, reason) {
  const event = {
    type: 'degradation_level_change',
    previousLevel,
    newLevel,
    reason,
    timestamp: new Date().toISOString(),
    affectedServices: Array.from(degradationState.affectedServices)
  };
  
  // Store event for monitoring
  if (!global.degradationEvents) {
    global.degradationEvents = [];
  }
  global.degradationEvents.push(event);
  
  // Keep only last 50 events
  if (global.degradationEvents.length > 50) {
    global.degradationEvents = global.degradationEvents.slice(-50);
  }
  
  logger.info('Degradation event emitted:', event);
}

/**
 * Get Degradation Events
 * Returns degradation event history
 */
function getDegradationEvents() {
  return global.degradationEvents || [];
}

/**
 * Auto-Recovery Check
 * Periodically checks service health and auto-recovers
 */
async function autoRecoveryCheck() {
  try {
    const { level, affectedServices, healthStatus } = await determineDegradationLevel();
    
    // Recover services that are now healthy
    for (const service of affectedServices) {
      if (healthStatus[service]) {
        markServiceRecovered(service);
      }
    }
    
    logger.info('Auto-recovery check completed', { level, healthStatus });
  } catch (error) {
    logger.error('Auto-recovery check failed:', error);
  }
}

/**
 * Start Auto-Recovery
 * Starts periodic auto-recovery checks
 */
let autoRecoveryInterval = null;

function startAutoRecovery(intervalMs = 30000) {
  if (autoRecoveryInterval) {
    logger.warn('Auto-recovery already running');
    return;
  }
  
  logger.info(`Starting auto-recovery with ${intervalMs}ms interval`);
  autoRecoveryInterval = setInterval(autoRecoveryCheck, intervalMs);
}

/**
 * Stop Auto-Recovery
 * Stops periodic auto-recovery checks
 */
function stopAutoRecovery() {
  if (autoRecoveryInterval) {
    clearInterval(autoRecoveryInterval);
    autoRecoveryInterval = null;
    logger.info('Auto-recovery stopped');
  }
}

module.exports = {
  DegradationLevel,
  setDegradationLevel,
  getDegradationState,
  isServiceDegraded,
  markServiceDegraded,
  markServiceRecovered,
  shouldFeatureBeEnabled,
  getDegradedResponse,
  getDegradationEvents,
  startAutoRecovery,
  stopAutoRecovery,
  determineDegradationLevel,
  serviceDependencies
};