const logger = require('../utils/logger');

/**
 * Fallback Response Handlers
 * Provides fallback responses when services are unavailable
 */

/**
 * AI/ML Service Fallback Responses
 * Returns cached or default responses when AI/ML service is down
 */
const aiMlFallbacks = {
  /**
   * Demand Forecast Fallback
   * Returns simple linear forecast based on historical average
   */
  demandForecast: async (request) => {
    logger.info('Using demand forecast fallback');
    // Simple fallback: return last 7 days of historical average
    const fallbackForecast = {
      sku_id: request.sku_id,
      store_id: request.store_id,
      forecast_dates: generateFutureDates(request.forecast_horizon),
      forecast_values: Array(request.forecast_horizon).fill(100), // Default to 100 units
      confidence_intervals: request.include_confidence_intervals 
        ? generateConfidenceIntervals(100, request.forecast_horizon)
        : null,
      model_version: 'fallback-v1.0',
      timestamp: new Date().toISOString(),
      fallback: true
    };
    return fallbackForecast;
  },

  /**
   * Inventory Optimization Fallback
   * Returns simple reorder point logic
   */
  inventoryOptimization: async (request) => {
    logger.info('Using inventory optimization fallback');
    // Simple fallback: reorder when stock < min_level
    const recommendations = request.products.map(product => {
      const needsReorder = product.current_stock < (product.min_stock_level || 20);
      return {
        product_id: product.product_id,
        action: needsReorder ? 'reorder' : 'hold',
        recommended_quantity: needsReorder ? product.max_stock_level : product.current_stock,
        fallback: true
      };
    });
    return { recommendations };
  },

  /**
   * Routing Optimization Fallback
   * Returns simple distance-based routing
   */
  routingOptimization: async (request) => {
    logger.info('Using routing optimization fallback');
    // Simple fallback: route to nearest destination first
    const routes = request.destinations.map((dest, index) => ({
      route_id: `ROUTE-${index}`,
      origin: request.origin,
      destination: dest.location,
      estimated_time: Math.floor(Math.random() * 120) + 30, // Random 30-150 minutes
      vehicle_id: request.fleet[index % request.fleet.length].vehicle_id,
      status: 'planned',
      fallback: true
    }));
    return { routes };
  }
};

/**
 * Database Fallback Responses
 * Returns cached or default responses when database is down
 */
const databaseFallbacks = {
  /**
   * Inventory Query Fallback
   * Returns empty inventory or cached data
   */
  getInventory: async (storeId) => {
    logger.info('Using database inventory fallback');
    return {
      success: true,
      data: [],
      fallback: true,
      message: 'Database unavailable, returning empty results'
    };
  },

  /**
   * Order Query Fallback
   * Returns empty order list
   */
  getOrders: async (storeId) => {
    logger.info('Using database orders fallback');
    return {
      success: true,
      data: [],
      fallback: true,
      message: 'Database unavailable, returning empty results'
    };
  },

  /**
   * Shipment Query Fallback
   * Returns empty shipment list
   */
  getShipments: async (status) => {
    logger.info('Using database shipments fallback');
    return {
      success: true,
      data: [],
      fallback: true,
      message: 'Database unavailable, returning empty results'
    };
  }
};

/**
 * Redis Fallback Responses
 * Returns in-memory alternatives when Redis is down
 */
const redisFallbacks = {
  /**
   * Message Publishing Fallback
   * Logs message instead of publishing to Redis
   */
  publishMessage: async (channel, message) => {
    logger.info(`Redis fallback - logging message to ${channel}:`, message);
    return {
      success: true,
      fallback: true,
      method: 'log',
      message: 'Redis unavailable, message logged instead'
    };
  },

  /**
   * Message Subscription Fallback
   * Returns empty subscription
   */
  subscribeMessage: async (channel) => {
    logger.info(`Redis fallback - unable to subscribe to ${channel}`);
    return {
      success: false,
      fallback: true,
      message: 'Redis unavailable, subscription failed'
    };
  }
};

/**
 * Helper Functions
 */

/**
 * Generate future dates for forecast fallback
 */
function generateFutureDates(horizon) {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= horizon; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    dates.push(futureDate.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Generate confidence intervals for fallback
 */
function generateConfidenceIntervals(meanValue, horizon) {
  const margin = 10; // Fixed margin for fallback
  const intervals = [];
  for (let i = 0; i < horizon; i++) {
    intervals.push({
      lower: Math.round(meanValue - margin),
      upper: Math.round(meanValue + margin)
    });
  }
  return intervals;
}

/**
 * Get Fallback Response
 * Generic function to get appropriate fallback response
 */
function getFallbackResponse(service, operation, fallbackData) {
  try {
    if (service === 'ai-ml' && aiMlFallbacks[operation]) {
      return aiMlFallbacks[operation](fallbackData);
    }
    if (service === 'database' && databaseFallbacks[operation]) {
      return databaseFallbacks[operation](fallbackData);
    }
    if (service === 'redis' && redisFallbacks[operation]) {
      return redisFallbacks[operation](fallbackData);
    }
    
    // Generic fallback
    return {
      success: false,
      error: `Service ${service} unavailable for operation ${operation}`,
      fallback: true,
      data: null
    };
  } catch (error) {
    logger.error('Fallback handler error:', error);
    return {
      success: false,
      error: 'Fallback failed',
      fallback: true,
      data: null
    };
  }
}

/**
 * Cache Management for Fallback Data
 * Simple in-memory cache for fallback responses
 */
const fallbackCache = new Map();

/**
 * Cache Fallback Response
 * Stores fallback response for future use
 */
function cacheFallbackResponse(key, response, ttl = 300000) {
  fallbackCache.set(key, {
    data: response,
    timestamp: Date.now(),
    ttl: ttl
  });
}

/**
 * Get Cached Fallback Response
 * Retrieves cached fallback response if available and not expired
 */
function getCachedFallbackResponse(key) {
  const cached = fallbackCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    fallbackCache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Clear Fallback Cache
 * Clears all cached fallback responses
 */
function clearFallbackCache() {
  fallbackCache.clear();
  logger.info('Fallback cache cleared');
}

/**
 * Fallback Configuration
 * Allows runtime configuration of fallback behavior
 */
const fallbackConfig = {
  enabled: true,
  cacheEnabled: true,
  defaultTTL: 300000, // 5 minutes
  logFallbacks: true
};

/**
 * Configure Fallback Behavior
 */
function configureFallback(options) {
  Object.assign(fallbackConfig, options);
  logger.info('Fallback configuration updated:', fallbackConfig);
}

module.exports = {
  aiMlFallbacks,
  databaseFallbacks,
  redisFallbacks,
  getFallbackResponse,
  cacheFallbackResponse,
  getCachedFallbackResponse,
  clearFallbackCache,
  configureFallback,
  fallbackConfig
};