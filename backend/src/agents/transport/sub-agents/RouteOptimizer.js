const SubAgent = require('../../_base/SubAgent');

class RouteOptimizer extends SubAgent {
  constructor(transportId, apiService) {
    super('RouteOptimizer', `Transport-${transportId}`, apiService);
    this.transportId = transportId;
  }

  async optimize(deliveries, vehicles) {
    this.log(`Optimizing route for ${deliveries.length} deliveries, ${vehicles.length} vehicles`);

    if (!deliveries || deliveries.length === 0) throw new Error('deliveries are required');
    if (!vehicles || vehicles.length === 0) throw new Error('vehicles are required');

    const data = { deliveries, vehicles, transport_id: this.transportId };

    try {
      const result = await this.apiService.routingOptimization(data);
      return result.routes || [];
    } catch (err) {
      this.error('Route optimization failed:', err.message);
      return this._fallbackRoutes(deliveries, vehicles);
    }
  }

  async predictETA(routeData) {
    this.log('Predicting ETA');

    try {
      const result = await this.apiService.routingEta(routeData);
      return result;
    } catch (err) {
      this.error('ETA prediction failed:', err.message);
      return null;
    }
  }

  async predictTravelTime(origin, destination) {
    this.log('Predicting travel time');

    try {
      const result = await this.apiService.travelTime({ origin, destination });
      return result;
    } catch (err) {
      this.error('Travel time prediction failed:', err.message);
      return { estimated_minutes: this._haversineDistance(origin, destination) / 40 * 60 };
    }
  }

  _fallbackRoutes(deliveries, vehicles) {
    const perVehicle = Math.ceil(deliveries.length / vehicles.length);
    return vehicles.map((v, i) => ({
      vehicleId: v.id,
      deliveries: deliveries.slice(i * perVehicle, (i + 1) * perVehicle),
      total_distance_km: 0
    }));
  }

  _haversineDistance(point1, point2) {
    if (!point1 || !point2) return 0;
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

module.exports = RouteOptimizer;
