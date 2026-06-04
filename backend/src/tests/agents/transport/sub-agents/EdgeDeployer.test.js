const EdgeDeployer = require('../../../../agents/transport/sub-agents/EdgeDeployer');

const mockApiService = {
  edgeDeploy: jest.fn(),
  edgeUndeploy: jest.fn(),
};

describe('EdgeDeployer', () => {
  let deployer;

  beforeEach(() => {
    jest.clearAllMocks();
    deployer = new EdgeDeployer(99, mockApiService);
  });

  describe('constructor', () => {
    it('should set name, parentId, apiService via super', () => {
      expect(deployer.name).toBe('EdgeDeployer');
      expect(deployer.parentId).toBe('Transport-99');
      expect(deployer.apiService).toBe(mockApiService);
    });

    it('should set transportId', () => {
      expect(deployer.transportId).toBe(99);
    });
  });

  describe('deployRouteModel', () => {
    it('should return mapped result on success', async () => {
      const apiResult = {
        deployment_id: 'DEP-123',
        status: 'deployed',
        endpoint_url: 'https://edge.example.com/v1',
        model_version: 'v4'
      };
      mockApiService.edgeDeploy.mockResolvedValue(apiResult);

      const modelConfig = { name: 'route-opt', version: 'v4' };
      const result = await deployer.deployRouteModel(modelConfig);

      expect(mockApiService.edgeDeploy).toHaveBeenCalledWith({
        model: modelConfig,
        target: 'edge'
      });
      expect(result).toEqual({
        deployment_id: 'DEP-123',
        status: 'deployed',
        endpoint_url: 'https://edge.example.com/v1',
        model_version: 'v4'
      });
    });

    it('should fallback when apiService.edgeDeploy rejects', async () => {
      mockApiService.edgeDeploy.mockRejectedValue(new Error('Deploy API down'));

      const result = await deployer.deployRouteModel({ name: 'route-opt' });

      expect(result).toEqual({
        deployment_id: 'DEP-fallback',
        status: 'deployed',
        endpoint_url: 'edge://local',
        model_version: 'fallback'
      });
    });

    it('should throw if modelConfig is missing', async () => {
      await expect(deployer.deployRouteModel(null)).rejects.toThrow('modelConfig is required');
    });
  });

  describe('undeployRouteModel', () => {
    it('should return mapped result on success', async () => {
      const apiResult = {
        deployment_id: 'DEP-123',
        status: 'removed',
        model_version: 'v4'
      };
      mockApiService.edgeUndeploy.mockResolvedValue(apiResult);

      const result = await deployer.undeployRouteModel('DEP-123');

      expect(mockApiService.edgeUndeploy).toHaveBeenCalledWith({
        deployment_id: 'DEP-123',
        action: 'undeploy'
      });
      expect(result).toEqual({
        deployment_id: 'DEP-123',
        status: 'removed',
        model_version: 'v4'
      });
    });

    it('should use passed id when result.deployment_id is missing', async () => {
      mockApiService.edgeUndeploy.mockResolvedValue({
        status: 'removed',
        model_version: 'v2'
      });

      const result = await deployer.undeployRouteModel('DEP-XYZ');
      expect(result.deployment_id).toBe('DEP-XYZ');
      expect(result.status).toBe('removed');
    });

    it('should default status to removed when missing from result', async () => {
      mockApiService.edgeUndeploy.mockResolvedValue({
        deployment_id: 'DEP-1',
        model_version: 'v1'
      });

      const result = await deployer.undeployRouteModel('DEP-1');
      expect(result.status).toBe('removed');
    });

    it('should fallback when apiService.edgeUndeploy rejects', async () => {
      mockApiService.edgeUndeploy.mockRejectedValue(new Error('Undeploy API down'));

      const result = await deployer.undeployRouteModel('DEP-001');

      expect(result).toEqual({
        deployment_id: 'DEP-001',
        status: 'removed',
        model_version: 'fallback'
      });
    });

    it('should throw if deploymentId is missing', async () => {
      await expect(deployer.undeployRouteModel(null)).rejects.toThrow('deploymentId is required');
    });
  });

  describe('listDeployments', () => {
    it('should return static empty list with timestamp', () => {
      const result = deployer.listDeployments();
      expect(result.deployments).toEqual([]);
      expect(result.total).toBe(0);
      expect(result).toHaveProperty('note');
      expect(result).toHaveProperty('timestamp');
    });

    it('should not call apiService', () => {
      deployer.listDeployments();
      expect(mockApiService.edgeDeploy).not.toHaveBeenCalled();
      expect(mockApiService.edgeUndeploy).not.toHaveBeenCalled();
    });
  });
});
