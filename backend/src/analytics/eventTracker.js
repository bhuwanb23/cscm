/**
 * Event Tracking System
 * Tracks business events for analytics and business intelligence
 */

const logger = require('../utils/logger');

class EventTracker {
  constructor() {
    this.events = [];
    this.maxEvents = 10000;
    this.enabled = process.env.ANALYTICS_ENABLED !== 'false';
  }

  /**
   * Track an event
   */
  track(eventType, eventData = {}) {
    if (!this.enabled) return;

    const event = {
      id: this.generateId(),
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
      userId: eventData.userId || null,
      sessionId: eventData.sessionId || null
    };

    this.events.push(event);

    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    logger.debug('Event tracked', { type: eventType, eventId: event.id });

    return event;
  }

  /**
   * Track user action
   */
  trackUserAction(userId, action, details = {}) {
    return this.track('user_action', {
      userId,
      action,
      ...details
    });
  }

  /**
   * Track API request
   */
  trackApiRequest(endpoint, method, statusCode, duration) {
    return this.track('api_request', {
      endpoint,
      method,
      statusCode,
      duration
    });
  }

  /**
   * Track business event
   */
  trackBusinessEvent(eventType, details = {}) {
    return this.track('business_event', {
      eventType,
      ...details
    });
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType, limit = 100) {
    return this.events
      .filter(event => event.type === eventType)
      .slice(-limit);
  }

  /**
   * Get events by user
   */
  getEventsByUser(userId, limit = 100) {
    return this.events
      .filter(event => event.userId === userId)
      .slice(-limit);
  }

  /**
   * Get events by time range
   */
  getEventsByTimeRange(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    return this.events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }

  /**
   * Get event statistics
   */
  getStatistics() {
    const stats = {
      totalEvents: this.events.length,
      byType: {},
      byHour: {},
      last24Hours: 0
    };

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    this.events.forEach(event => {
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

      // Count by hour
      const hour = new Date(event.timestamp).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;

      // Count last 24 hours
      const eventTime = new Date(event.timestamp).getTime();
      if (eventTime >= dayAgo) {
        stats.last24Hours++;
      }
    });

    return stats;
  }

  /**
   * Clear events
   */
  clearEvents() {
    this.events = [];
    logger.info('Events cleared');
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
const eventTracker = new EventTracker();

module.exports = eventTracker;
