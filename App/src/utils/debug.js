/**
 * Debug Utilities for React Native Mobile App
 * Provides debugging capabilities for development
 */

import { Platform } from 'react-native';

class DebugLogger {
  constructor() {
    this.enabled = __DEV__;
    this.logs = [];
    this.maxLogs = 100;
  }

  /**
   * Log debug message
   */
  log(message, data = {}) {
    if (this.enabled) {
      const timestamp = new Date().toISOString();
      const logEntry = { timestamp, message, data, level: 'log' };
      this.logs.push(logEntry);
      
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      
      console.log(`[DEBUG] ${message}`, data);
    }
  }

  /**
   * Log warning
   */
  warn(message, data = {}) {
    if (this.enabled) {
      const timestamp = new Date().toISOString();
      const logEntry = { timestamp, message, data, level: 'warn' };
      this.logs.push(logEntry);
      
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      
      console.warn(`[DEBUG] ${message}`, data);
    }
  }

  /**
   * Log error
   */
  error(message, error = {}) {
    if (this.enabled) {
      const timestamp = new Date().toISOString();
      const logEntry = { timestamp, message, error, level: 'error' };
      this.logs.push(logEntry);
      
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      
      console.error(`[DEBUG] ${message}`, error);
    }
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get system info
   */
  getSystemInfo() {
    return {
      platform: Platform.OS,
      enabled: this.enabled,
      logCount: this.logs.length,
      maxLogs: this.maxLogs
    };
  }
}

/**
 * Performance measurement utility
 */
class PerformanceMonitor {
  constructor() {
    this.measurements = new Map();
  }

  /**
   * Start measuring
   */
  start(label) {
    this.measurements.set(label, {
      startTime: Date.now(),
      endTime: null,
      duration: null
    });
  }

  /**
   * Stop measuring
   */
  stop(label) {
    const measurement = this.measurements.get(label);
    if (measurement) {
      measurement.endTime = Date.now();
      measurement.duration = measurement.endTime - measurement.startTime;
      
      if (__DEV__) {
        console.log(`[PERF] ${label}: ${measurement.duration}ms`);
      }
      
      return measurement.duration;
    }
    return null;
  }

  /**
   * Get measurement
   */
  getMeasurement(label) {
    return this.measurements.get(label);
  }

  /**
   * Clear measurements
   */
  clear() {
    this.measurements.clear();
  }
}

/**
 * Network request logger
 */
class NetworkLogger {
  constructor() {
    this.requests = [];
    this.maxRequests = 50;
  }

  /**
   * Log request
   */
  logRequest(config) {
    if (__DEV__) {
      const timestamp = new Date().toISOString();
      const requestEntry = {
        timestamp,
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data
      };
      
      this.requests.push(requestEntry);
      
      if (this.requests.length > this.maxRequests) {
        this.requests.shift();
      }
      
      console.log(`[NETWORK] ${config.method} ${config.url}`);
    }
  }

  /**
   * Log response
   */
  logResponse(config, response) {
    if (__DEV__) {
      const timestamp = new Date().toISOString();
      const duration = response.config.timestamp 
        ? timestamp - new Date(response.config.timestamp).toISOString()
        : null;
      
      const responseEntry = {
        timestamp,
        method: config.method,
        url: config.url,
        status: response.status,
        duration,
        data: response.data
      };
      
      console.log(`[NETWORK] ${config.method} ${config.url} - ${response.status} (${duration}ms)`);
    }
  }

  /**
   * Log error
   */
  logError(config, error) {
    if (__DEV__) {
      console.error(`[NETWORK ERROR] ${config.method} ${config.url}`, error);
    }
  }

  /**
   * Get all requests
   */
  getRequests() {
    return this.requests;
  }

  /**
   * Clear requests
   */
  clear() {
    this.requests = [];
  }
}

// Create instances
const debugLogger = new DebugLogger();
const performanceMonitor = new PerformanceMonitor();
const networkLogger = new NetworkLogger();

export {
  debugLogger,
  performanceMonitor,
  networkLogger
};
