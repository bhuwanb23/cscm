/**
 * Analytics for User Simulation
 * Calculates metrics and generates reports for hackathon validation
 */

class SimulationAnalytics {
  constructor(auditLog) {
    this.auditLog = auditLog;
  }

  /**
   * Calculate daily active users
   */
  getDailyActiveUsers() {
    const logs = this.auditLog.getLogs();
    const usersByDay = {};

    logs.forEach(log => {
      const date = log.timestamp.split('T')[0];
      if (!usersByDay[date]) {
        usersByDay[date] = new Set();
      }
      usersByDay[date].add(log.user_id);
    });

    const result = {};
    Object.keys(usersByDay).forEach(date => {
      result[date] = usersByDay[date].size;
    });

    return result;
  }

  /**
   * Calculate orders created per day
   */
  getOrdersPerDay() {
    const logs = this.auditLog.getLogsByAction('create_order');
    const ordersByDay = {};

    logs.forEach(log => {
      const date = log.timestamp.split('T')[0];
      if (!ordersByDay[date]) {
        ordersByDay[date] = 0;
      }
      ordersByDay[date]++;
    });

    return ordersByDay;
  }

  /**
   * Calculate shipments delivered per day
   */
  getShipmentsPerDay() {
    const logs = this.auditLog.getLogsByAction('update_shipment_status');
    const shipmentsByDay = {};

    logs.forEach(log => {
      const date = log.timestamp.split('T')[0];
      if (!shipmentsByDay[date]) {
        shipmentsByDay[date] = 0;
      }
      shipmentsByDay[date]++;
    });

    return shipmentsByDay;
  }

  /**
   * Calculate API calls per endpoint
   */
  getApiCallsPerEndpoint() {
    const stats = this.auditLog.getStatistics();
    return stats.byEndpoint;
  }

  /**
   * Calculate forecast requests
   */
  getForecastRequests() {
    const logs = this.auditLog.getLogsByAction('get_forecast');
    return logs.length;
  }

  /**
   * Calculate system uptime (simulation run time)
   */
  getSystemUptime() {
    const logs = this.auditLog.getLogs();
    if (logs.length === 0) return 0;

    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const startTime = new Date(firstLog.timestamp).getTime();
    const endTime = new Date(lastLog.timestamp).getTime();
    
    return Math.floor((endTime - startTime) / 1000); // seconds
  }

  /**
   * Calculate average response time (mock)
   */
  getAverageResponseTime() {
    // In a real implementation, this would track actual response times
    // For simulation, we'll return a reasonable estimate
    return Math.random() * 200 + 100; // 100-300ms
  }

  /**
   * Generate comprehensive metrics report
   */
  generateReport() {
    const stats = this.auditLog.getStatistics();

    return {
      summary: {
        totalActions: stats.total,
        successRate: this.auditLog.getSuccessRate() + '%',
        successCount: stats.success,
        failedCount: stats.failed
      },
      dailyActiveUsers: this.getDailyActiveUsers(),
      ordersPerDay: this.getOrdersPerDay(),
      shipmentsPerDay: this.getShipmentsPerDay(),
      apiCallsPerEndpoint: this.getApiCallsPerEndpoint(),
      forecastRequests: this.getForecastRequests(),
      systemUptime: this.getSystemUptime(),
      averageResponseTime: this.getAverageResponseTime(),
      roleDistribution: stats.byRole,
      actionDistribution: stats.byAction
    };
  }

  /**
   * Generate dashboard data
   */
  getDashboardData() {
    const report = this.generateReport();
    const logs = this.auditLog.getLogs();

    return {
      metrics: report.summary,
      charts: {
        dailyActivity: Object.keys(report.dailyActiveUsers).map(date => ({
          date,
          users: report.dailyActiveUsers[date],
          orders: report.ordersPerDay[date] || 0,
          shipments: report.shipmentsPerDay[date] || 0
        })),
        roleDistribution: Object.keys(report.roleDistribution).map(role => ({
          role,
          count: report.roleDistribution[role]
        })),
        actionDistribution: Object.keys(report.actionDistribution).map(action => ({
          action,
          count: report.actionDistribution[action]
        })),
        endpointUsage: Object.keys(report.apiCallsPerEndpoint).map(endpoint => ({
          endpoint,
          count: report.apiCallsPerEndpoint[endpoint]
        }))
      },
      recentActivity: logs.slice(-10).reverse(),
      health: {
        systemUptime: report.systemUptime,
        averageResponseTime: report.averageResponseTime,
        forecastRequests: report.forecastRequests
      }
    };
  }
}

module.exports = SimulationAnalytics;
