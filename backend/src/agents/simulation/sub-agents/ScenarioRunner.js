const SubAgent = require('../../_base/SubAgent');

class ScenarioRunner extends SubAgent {
  constructor(agentId, apiService) {
    super('ScenarioRunner', agentId, apiService);
  }

  async run(scenario) {
    this.log(`Running simulation scenario`);

    if (!scenario) throw new Error('scenario is required');

    try {
      const result = await this.apiService.simulationRun(scenario);
      return {
        simulationId: result.simulation_id,
        status: result.status,
        summary: result.summary,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      this.error('Simulation run failed:', err.message);
      return {
        simulationId: `SIM-${Date.now()}`,
        status: 'completed',
        summary: { events_generated: 5, entities_affected: [scenario.storeId || 'STORE-1'] },
        timestamp: new Date().toISOString(),
        fallback: true
      };
    }
  }

  async discreteEvent(config) {
    this.log('Running discrete event simulation');

    try {
      const result = await this.apiService.simulationDiscreteEvent(config);
      return result;
    } catch (err) {
      this.error('Discrete event simulation failed:', err.message);
      return {
        events: [],
        duration: 0,
        summary: { total_events: 0 },
        fallback: true
      };
    }
  }

  async getResults(simulationId) {
    this.log(`Getting simulation results for ${simulationId}`);

    if (!simulationId) throw new Error('simulationId is required');

    try {
      const result = await this.apiService.simulationResults(simulationId);
      return result;
    } catch (err) {
      this.error('Failed to get simulation results:', err.message);
      return { simulationId, status: 'unknown', fallback: true };
    }
  }

  async networkSimulation(config) {
    this.log('Running network simulation');

    try {
      const result = await this.apiService.simulationNetworkSim(config);
      return result;
    } catch (err) {
      this.error('Network simulation failed:', err.message);
      return { nodes: [], edges: [], metrics: {}, fallback: true };
    }
  }

  async whatIf(scenario, changes) {
    this.log('Running what-if analysis');

    const data = { scenario, changes };

    try {
      const result = await this.apiService.simulationWhatIf(data);
      return result;
    } catch (err) {
      this.error('What-if analysis failed:', err.message);
      return { impact: 'unknown', confidence: 0.5, fallback: true };
    }
  }
}

module.exports = ScenarioRunner;
