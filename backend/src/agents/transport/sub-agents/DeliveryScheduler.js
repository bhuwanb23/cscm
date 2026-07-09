const SubAgent = require('../../_base/SubAgent');

class DeliveryScheduler extends SubAgent {
  constructor(transportId, apiService) {
    super('DeliveryScheduler', `Transport-${transportId}`, apiService);
    this.transportId = transportId;
  }

  async schedule(deliveries, timeWindows, vehicles) {
    this.log(`Scheduling ${deliveries.length} deliveries`);

    if (!deliveries || deliveries.length === 0) throw new Error('deliveries are required');

    const data = { deliveries, time_windows: timeWindows, vehicles, transport_id: this.transportId };

    try {
      const result = await this.apiService.routingOptimization(data);
      return result.routes || this._fallbackSchedule(deliveries);
    } catch (err) {
      this.error('Scheduling failed:', err.message);
      return this._fallbackSchedule(deliveries);
    }
  }

  track(deliveryId, trackingData) {
    this.log(`Tracking delivery ${deliveryId}`);

    if (!deliveryId) throw new Error('deliveryId is required');
    if (!trackingData) throw new Error('trackingData is required');

    return {
      deliveryId,
      ...trackingData,
      lastUpdated: new Date().toISOString()
    };
  }

  shouldSendNotification(trackingData) {
    if (!trackingData) return false;
    const significantEvents = ['delayed', 'arrived', 'departed', 'exception'];
    return significantEvents.includes(trackingData.event);
  }

  sendNotification(delivery, notificationType, details) {
    this.log(`Sending ${notificationType} notification for delivery ${delivery.deliveryId || delivery}`);
    return { delivery, notificationType, details, sent: true, timestamp: new Date().toISOString() };
  }

  handleException(deliveryId, exceptionType, details) {
    this.log(`Handling exception ${exceptionType} for delivery ${deliveryId}`);
    return { deliveryId, exceptionType, details, resolved: false, timestamp: new Date().toISOString() };
  }

  _fallbackSchedule(deliveries) {
    return deliveries.map(d => ({
      deliveryId: d.id || d.deliveryId,
      scheduledTime: new Date(Date.now() + Math.random() * 86400000).toISOString(),
      status: 'scheduled'
    }));
  }
}

module.exports = DeliveryScheduler;
