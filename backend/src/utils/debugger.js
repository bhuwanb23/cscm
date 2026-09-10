/**
 * Debugger Utilities
 * Comprehensive debugging utilities for development
 */

const logger = require('./logger');

/**
 * Debug class for structured debugging
 */
class Debugger {
  constructor(context) {
    this.context = context;
    this.enabled = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
  }

  /**
   * Log debug message
   */
  log(message, data = {}) {
    if (this.enabled) {
      logger.debug(`[${this.context}] ${message}`, data);
    }
  }

  /**
   * Log error with stack trace
   */
  error(message, error = {}) {
    logger.error(`[${this.context}] ${message}`, {
      message: error.message,
      stack: error.stack,
      ...error
    });
  }

  /**
   * Log warning
   */
  warn(message, data = {}) {
    logger.warn(`[${this.context}] ${message}`, data);
  }

  /**
   * Log info
   */
  info(message, data = {}) {
    logger.info(`[${this.context}] ${message}`, data);
  }

  /**
   * Time execution of a function
   */
  async time(label, fn) {
    if (!this.enabled) {
      return await fn();
    }

    const startTime = Date.now();
    this.log(`Starting: ${label}`);

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.log(`Completed: ${label}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Failed: ${label}`, error);
      this.log(`Duration: ${duration}ms`);
      throw error;
    }
  }

  /**
   * Measure memory usage
   */
  measureMemory(label) {
    if (!this.enabled) return;

    const memory = process.memoryUsage();
    this.log(`Memory: ${label}`, {
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memory.external / 1024 / 1024)}MB`
    });
  }

  /**
   * Inspect object properties
   */
  inspect(label, obj, maxDepth = 2) {
    if (!this.enabled) return;

    const inspected = JSON.stringify(obj, null, 2);
    this.log(`Inspect: ${label}`, {
      value: inspected.substring(0, 500),
      length: inspected.length
    });
  }

  /**
   * Trace function execution
   */
  trace(label, fn) {
    if (!this.enabled) {
      return fn;
    }

    return (...args) => {
      this.log(`Trace: ${label} called`, { args });
      const startTime = Date.now();

      try {
        const result = fn(...args);
        const duration = Date.now() - startTime;
        this.log(`Trace: ${label} completed`, { duration: `${duration}ms` });
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.error(`Trace: ${label} failed`, error);
        this.log(`Duration: ${duration}ms`);
        throw error;
      }
    };
  }
}

/**
 * Create a debugger instance
 */
function createDebugger(context) {
  return new Debugger(context);
}

/**
 * Global debugger for quick debugging
 */
const debug = createDebugger('GLOBAL');

module.exports = {
  Debugger,
  createDebugger,
  debug
};
