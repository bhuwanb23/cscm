const SubAgent = require('../../_base/SubAgent');

class AnomalyAlerter extends SubAgent {
  constructor(plannerId, apiService) {
    super('AnomalyAlerter', `CP-${plannerId}`, apiService);
    this.plannerId = plannerId;
  }

  async getAlert(alertId) {
    this.log(`Fetching anomaly alert ${alertId}`);

    if (!alertId) throw new Error('alertId is required');

    try {
      const result = await this.apiService.anomalyAlert(alertId);
      return result;
    } catch (err) {
      this.error('Failed to fetch anomaly alert:', err.message);
      return this._fallbackAlert(alertId);
    }
  }

  async listActiveAlerts(filters = {}) {
    this.log('Listing active alerts');

    const filterObj = { status: 'active', ...filters };

    if (this.apiService && typeof this.apiService.call === 'function') {
      try {
        const qs = new URLSearchParams(filterObj).toString();
        const result = await this.apiService.call(
          'get',
          `/api/v1/anomaly/alerts?${qs}`,
          null,
          { allowFallback: true, bypassCircuitBreaker: true }
        );
        if (result && Array.isArray(result.alerts)) {
          return {
            alerts: result.alerts,
            total: result.total !== undefined ? result.total : result.alerts.length,
            model_version: result.model_version || 'unknown',
            filters: filterObj
          };
        }
        return { ...this._fallbackList(), filters: filterObj };
      } catch (err) {
        this.error('Failed to list active alerts:', err.message);
        return { ...this._fallbackList(), filters: filterObj };
      }
    }

    return { ...this._fallbackList(), filters: filterObj };
  }

  async acknowledgeAlert(alertId, userId) {
    this.log(`Acknowledging alert ${alertId} by ${userId}`);

    if (!alertId) throw new Error('alertId is required');

    const ackPayload = {
      alert_id: alertId,
      acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString()
    };

    if (this.apiService && typeof this.apiService.call === 'function') {
      try {
        const result = await this.apiService.call(
          'post',
          `/api/v1/anomaly/alerts/${alertId}/acknowledge`,
          { user_id: userId },
          { allowFallback: true }
        );
        if (result) return { ...ackPayload, ...result };
        return ackPayload;
      } catch (err) {
        this.error('Failed to acknowledge alert:', err.message);
        return ackPayload;
      }
    }

    return ackPayload;
  }

  _fallbackAlert(alertId) {
    return {
      alert_id: alertId,
      severity: 'unknown',
      status: 'unknown',
      model_version: 'fallback'
    };
  }

  _fallbackList() {
    return {
      alerts: [],
      total: 0,
      model_version: 'fallback'
    };
  }
}

module.exports = AnomalyAlerter;
