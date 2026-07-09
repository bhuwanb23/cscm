const SubAgent = require('../../_base/SubAgent');

class DeliveryCoordinator extends SubAgent {
  constructor(agentId, apiService) {
    super('DeliveryCoordinator', agentId, apiService);
  }

  async createPlan(assignments, transporters) {
    this.log('Creating coordination plan');

    const data = {
      assignments,
      transporters
    };

    try {
      const result = await this.apiService.coordinationPlan(data);
      return result;
    } catch (err) {
      this.error('Coordination plan failed:', err.message);
      return this._fallbackPlan(assignments, transporters);
    }
  }

  async getStatus(planId) {
    this.log(`Getting coordination status for plan ${planId}`);

    if (!planId) throw new Error('planId is required');

    try {
      const result = await this.apiService.coordinationStatus(planId);
      return result;
    } catch (err) {
      this.error('Failed to get coordination status:', err.message);
      return { planId, status: 'unknown', timestamp: new Date().toISOString() };
    }
  }

  assignTransporter(storeId, transporters, urgency) {
    this.log(`Assigning transporter for store ${storeId}, urgency: ${urgency}`);

    if (!transporters || transporters.length === 0) return null;

    const available = transporters.filter(t => t.status === 'available');

    if (available.length === 0) return null;

    if (urgency === 'high') {
      return available.reduce((best, t) =>
        (!best || (t.priorityScore || 0) > (best.priorityScore || 0)) ? t : best
      );
    }

    return available[0];
  }

  _fallbackPlan(assignments, transporters) {
    const planId = `PLAN-${Date.now()}`;
    return {
      planId,
      status: 'created',
      steps: (assignments || []).map(a => ({
        storeId: a.storeId || a,
        transporterId: transporters && transporters.length > 0 ? transporters[0].id : 'TRANSPORT-1',
        status: 'pending'
      })),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = DeliveryCoordinator;
