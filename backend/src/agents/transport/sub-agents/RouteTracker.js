const SubAgent = require('../../_base/SubAgent');

class RouteTracker extends SubAgent {
  constructor(transportId, apiService) {
    super('RouteTracker', `Transport-${transportId}`, apiService);
    this.transportId = transportId;
  }

  async trackRoute(routeId) {
    this.log(`Tracking route ${routeId}`);

    if (!routeId) throw new Error('routeId is required');

    try {
      const result = await this.apiService.routeStatus(routeId);
      return {
        route_id: result.route_id || routeId,
        status: result.status,
        current_location: result.current_location,
        eta_minutes: result.eta_minutes,
        progress_pct: result.progress_pct,
        model_version: result.model_version
      };
    } catch (err) {
      this.error('Route tracking failed:', err.message);
      return this._fallbackTrack(routeId);
    }
  }

  async trackBatch(routeIds) {
    this.log(`Batch tracking ${routeIds && routeIds.length} routes`);

    if (!routeIds || routeIds.length === 0) {
      return { routes: [], total_tracked: 0, failed: [] };
    }

    const routes = [];
    const failed = [];

    for (const id of routeIds) {
      try {
        const r = await this.trackRoute(id);
        if (r.status === 'unknown' && r.model_version === 'fallback') {
          failed.push(id);
        } else {
          routes.push(r);
        }
      } catch (err) {
        this.error('Batch route tracking failed for', id, err.message);
        failed.push(id);
      }
    }

    return { routes, total_tracked: routes.length, failed };
  }

  _fallbackTrack(routeId) {
    return {
      route_id: routeId,
      status: 'unknown',
      current_location: null,
      eta_minutes: null,
      progress_pct: 0,
      model_version: 'fallback'
    };
  }
}

module.exports = RouteTracker;
