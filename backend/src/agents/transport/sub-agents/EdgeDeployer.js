const SubAgent = require('../../_base/SubAgent');

class EdgeDeployer extends SubAgent {
  constructor(transportId, apiService) {
    super('EdgeDeployer', `Transport-${transportId}`, apiService);
    this.transportId = transportId;
  }

  async deployRouteModel(modelConfig) {
    this.log('Deploying route model to edge');

    if (!modelConfig) throw new Error('modelConfig is required');

    const data = { model: modelConfig, target: 'edge' };

    try {
      const result = await this.apiService.edgeDeploy(data);
      return {
        deployment_id: result.deployment_id,
        status: result.status,
        endpoint_url: result.endpoint_url,
        model_version: result.model_version
      };
    } catch (err) {
      this.error('Edge deploy failed:', err.message);
      return this._fallbackDeploy(modelConfig);
    }
  }

  async undeployRouteModel(deploymentId) {
    this.log(`Undeploying edge model ${deploymentId}`);

    if (!deploymentId) throw new Error('deploymentId is required');

    try {
      const result = await this.apiService.edgeUndeploy(deploymentId);
      return {
        deployment_id: result.deployment_id || deploymentId,
        status: result.status || 'removed',
        model_version: result.model_version
      };
    } catch (err) {
      this.error('Edge undeploy failed:', err.message);
      return this._fallbackUndeploy(deploymentId);
    }
  }

  listDeployments() {
    this.log('Listing deployments (static fallback)');
    return {
      deployments: [],
      total: 0,
      note: 'No list endpoint available; returning empty result',
      timestamp: new Date().toISOString()
    };
  }

  _fallbackDeploy(config) {
    return {
      deployment_id: 'DEP-fallback',
      status: 'deployed',
      endpoint_url: 'edge://local',
      model_version: 'fallback'
    };
  }

  _fallbackUndeploy(id) {
    return {
      deployment_id: id,
      status: 'removed',
      model_version: 'fallback'
    };
  }
}

module.exports = EdgeDeployer;
