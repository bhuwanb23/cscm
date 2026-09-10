/**
 * Metrics Collector
 * Collects and aggregates business metrics
 */

const logger = require('../utils/logger');

class MetricsCollector {
  constructor() {
    this.metrics = {
      users: {
        total: 0,
        active: 0,
        new: 0
      },
      orders: {
        total: 0,
        completed: 0,
        pending: 0,
        revenue: 0
      },
      inventory: {
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0
      },
      shipments: {
        total: 0,
        inTransit: 0,
        delivered: 0,
        delayed: 0
      },
      performance: {
        avgResponseTime: 0,
        errorRate: 0,
        uptime: 100
      }
    };
    
    this.history = [];
    this.maxHistory = 1000;
  }

  /**
   * Update user metrics
   */
  updateUserMetrics(metrics) {
    this.metrics.users = {
      ...this.metrics.users,
      ...metrics
    };
    this.recordSnapshot();
  }

  /**
   * Update order metrics
   */
  updateOrderMetrics(metrics) {
    this.metrics.orders = {
      ...this.metrics.orders,
      ...metrics
    };
    this.recordSnapshot();
  }

  /**
   * Update inventory metrics
   */
  updateInventoryMetrics(metrics) {
    this.metrics.inventory = {
      ...this.metrics.inventory,
      ...metrics
    };
    this.recordSnapshot();
  }

  /**
   * Update shipment metrics
   */
  updateShipmentMetrics(metrics) {
    this.metrics.shipments = {
      ...this.metrics.shipments,
      ...metrics
    };
    this.recordSnapshot();
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics) {
    this.metrics.performance = {
      ...this.metrics.performance,
      ...metrics
    };
    this.recordSnapshot();
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get metrics history
   */
  getHistory(limit = 100) {
    return this.history.slice(-limit);
  }

  /**
   * Get metrics trend
   */
  getTrend(metricName, hours = 24) {
    const now = Date.now();
    const startTime = now - hours * 60 * 60 * 1000;

    const relevantSnapshots = this.history.filter(snapshot => {
      const snapshotTime = new Date(snapshot.timestamp).getTime();
      return snapshotTime >= startTime;
    });

    const values = relevantSnapshots.map(snapshot => {
      const keys = metricName.split('.');
      let value = snapshot;
      for (const key of keys) {
        value = value?.[key];
      }
      return value;
    }).filter(v => v !== undefined);

    if (values.length === 0) {
      return null;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      current: values[values.length - 1],
      average: avg,
      min,
      max,
      trend: values.length > 1 
        ? values[values.length - 1] > values[0] ? 'up' : 'down'
        : 'stable'
    };
  }

  /**
   * Get KPIs
   */
  getKPIs() {
    return {
      totalRevenue: this.metrics.orders.revenue,
      orderCompletionRate: this.metrics.orders.total > 0
        ? (this.metrics.orders.completed / this.metrics.orders.total) * 100
        : 0,
      inventoryHealth: this.metrics.inventory.totalItems > 0
        ? 100 - ((this.metrics.inventory.lowStock + this.metrics.inventory.outOfStock) / this.metrics.inventory.totalItems) * 100
        : 0,
      shipmentDeliveryRate: this.metrics.shipments.total > 0
        ? (this.metrics.shipments.delivered / this.metrics.shipments.total) * 100
        : 0,
      systemUptime: this.metrics.performance.uptime,
      avgResponseTime: this.metrics.performance.avgResponseTime
    };
  }

  /**
   * Record snapshot for history
   */
  recordSnapshot() {
    const snapshot = {
      timestamp: new Date().toISOString(),
      metrics: JSON.parse(JSON.stringify(this.metrics))
    };

    this.history.push(snapshot);

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
    logger.info('Metrics history cleared');
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      users: { total: 0, active: 0, new: 0 },
      orders: { total: 0, completed: 0, pending: 0, revenue: 0 },
      inventory: { totalItems: 0, lowStock: 0, outOfStock: 0 },
      shipments: { total: 0, inTransit: 0, delivered: 0, delayed: 0 },
      performance: { avgResponseTime: 0, errorRate: 0, uptime: 100 }
    };
    logger.info('Metrics reset');
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

module.exports = metricsCollector;
