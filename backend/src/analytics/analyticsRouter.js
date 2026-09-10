/**
 * Analytics API Router
 * Provides endpoints for analytics and business intelligence
 */

const express = require('express');
const router = express.Router();
const eventTracker = require('./eventTracker');
const metricsCollector = require('./metricsCollector');

/**
 * Get event statistics
 */
router.get('/events/stats', (req, res) => {
  try {
    const stats = eventTracker.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get events by type
 */
router.get('/events/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const events = eventTracker.getEventsByType(type, limit);
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get events by user
 */
router.get('/events/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const events = eventTracker.getEventsByUser(userId, limit);
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get events by time range
 */
router.get('/events/time', (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'startTime and endTime are required'
      });
    }
    
    const events = eventTracker.getEventsByTimeRange(startTime, endTime);
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Track custom event
 */
router.post('/events/track', (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required'
      });
    }
    
    const event = eventTracker.track(type, data || {});
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get current metrics
 */
router.get('/metrics/current', (req, res) => {
  try {
    const metrics = metricsCollector.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get metrics history
 */
router.get('/metrics/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = metricsCollector.getHistory(limit);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get metrics trend
 */
router.get('/metrics/trend/:metricName', (req, res) => {
  try {
    const { metricName } = req.params;
    const hours = parseInt(req.query.hours) || 24;
    const trend = metricsCollector.getTrend(metricName, hours);
    
    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get KPIs
 */
router.get('/kpi', (req, res) => {
  try {
    const kpis = metricsCollector.getKPIs();
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update metrics (internal use)
 */
router.post('/metrics/update', (req, res) => {
  try {
    const { category, metrics } = req.body;
    
    switch (category) {
      case 'users':
        metricsCollector.updateUserMetrics(metrics);
        break;
      case 'orders':
        metricsCollector.updateOrderMetrics(metrics);
        break;
      case 'inventory':
        metricsCollector.updateInventoryMetrics(metrics);
        break;
      case 'shipments':
        metricsCollector.updateShipmentMetrics(metrics);
        break;
      case 'performance':
        metricsCollector.updatePerformanceMetrics(metrics);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid category'
        });
    }
    
    res.json({
      success: true,
      message: 'Metrics updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
