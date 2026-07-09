const AnomalyAlerter = require('../../../../agents/central-planner/sub-agents/AnomalyAlerter');

describe('AnomalyAlerter', () => {
  let apiService;
  let alerter;
  const plannerId = '001';

  beforeEach(() => {
    apiService = {
      anomalyAlert: jest.fn(),
      call: jest.fn()
    };
    alerter = new AnomalyAlerter(plannerId, apiService);
  });

  describe('constructor', () => {
    it('should set name, parentId, and apiService', () => {
      expect(alerter.name).toBe('AnomalyAlerter');
      expect(alerter.parentId).toBe(`CP-${plannerId}`);
      expect(alerter.apiService).toBe(apiService);
      expect(alerter.plannerId).toBe(plannerId);
    });
  });

  describe('getAlert', () => {
    const alertId = 'ALERT-001';
    const apiResult = {
      alert_id: alertId,
      severity: 'high',
      status: 'open',
      affected_entity: 'STORE-1',
      detected_at: '2024-01-01T00:00:00Z',
      details: { reason: 'spike' },
      model_version: 'v1.2'
    };

    it('should return API result on success', async () => {
      apiService.anomalyAlert.mockResolvedValue(apiResult);

      const result = await alerter.getAlert(alertId);

      expect(apiService.anomalyAlert).toHaveBeenCalledWith(alertId);
      expect(result).toEqual(apiResult);
    });

    it('should call fallback when API throws', async () => {
      apiService.anomalyAlert.mockRejectedValue(new Error('API down'));

      const result = await alerter.getAlert(alertId);

      expect(result).toEqual({
        alert_id: alertId,
        severity: 'unknown',
        status: 'unknown',
        model_version: 'fallback'
      });
    });

    it('should throw when alertId is missing', async () => {
      await expect(alerter.getAlert(null)).rejects.toThrow('alertId is required');
      expect(apiService.anomalyAlert).not.toHaveBeenCalled();
    });
  });

  describe('listActiveAlerts', () => {
    it('should call apiService.call and return mapped result on success', async () => {
      const apiResult = {
        alerts: [{ alert_id: 'A-1' }, { alert_id: 'A-2' }],
        total: 2,
        model_version: 'v1'
      };
      apiService.call.mockResolvedValue(apiResult);

      const result = await alerter.listActiveAlerts({ severity: 'high' });

      expect(apiService.call).toHaveBeenCalled();
      const [method, url, body, opts] = apiService.call.mock.calls[0];
      expect(method).toBe('get');
      expect(url).toContain('/api/v1/anomaly/alerts');
      expect(url).toContain('status=active');
      expect(url).toContain('severity=high');
      expect(body).toBeNull();
      expect(opts.allowFallback).toBe(true);
      expect(result.alerts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.model_version).toBe('v1');
      expect(result.filters).toEqual({ status: 'active', severity: 'high' });
    });

    it('should default filters to {status: active} when no filters passed', async () => {
      apiService.call.mockResolvedValue({ alerts: [], total: 0, model_version: 'v1' });

      const result = await alerter.listActiveAlerts();

      const [, url] = apiService.call.mock.calls[0];
      expect(url).toContain('status=active');
      expect(result.filters).toEqual({ status: 'active' });
    });

    it('should return fallback when API throws', async () => {
      apiService.call.mockRejectedValue(new Error('API down'));

      const result = await alerter.listActiveAlerts({});

      expect(result.alerts).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.model_version).toBe('fallback');
    });

    it('should return fallback when apiService has no call method', async () => {
      const stubService = { anomalyAlert: jest.fn() };
      const isolated = new AnomalyAlerter(plannerId, stubService);

      const result = await isolated.listActiveAlerts({ severity: 'low' });

      expect(result.alerts).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.filters).toEqual({ status: 'active', severity: 'low' });
    });
  });

  describe('acknowledgeAlert', () => {
    const alertId = 'ALERT-XYZ';
    const userId = 'USER-1';

    it('should call apiService.call and merge with ack payload on success', async () => {
      apiService.call.mockResolvedValue({ extra_field: 'ok' });

      const result = await alerter.acknowledgeAlert(alertId, userId);

      const [method, url, body] = apiService.call.mock.calls[0];
      expect(method).toBe('post');
      expect(url).toBe(`/api/v1/anomaly/alerts/${alertId}/acknowledge`);
      expect(body).toEqual({ user_id: userId });
      expect(result.alert_id).toBe(alertId);
      expect(result.acknowledged).toBe(true);
      expect(result.acknowledged_by).toBe(userId);
      expect(result.extra_field).toBe('ok');
    });

    it('should return ack payload when API throws', async () => {
      apiService.call.mockRejectedValue(new Error('API down'));

      const result = await alerter.acknowledgeAlert(alertId, userId);

      expect(result.alert_id).toBe(alertId);
      expect(result.acknowledged).toBe(true);
      expect(result.acknowledged_by).toBe(userId);
      expect(typeof result.acknowledged_at).toBe('string');
    });

    it('should throw when alertId is missing', async () => {
      await expect(alerter.acknowledgeAlert(null, userId)).rejects.toThrow('alertId is required');
    });
  });

  describe('_fallbackAlert', () => {
    it('should return fallback with alert id', () => {
      const result = alerter._fallbackAlert('ALERT-X');
      expect(result).toEqual({
        alert_id: 'ALERT-X',
        severity: 'unknown',
        status: 'unknown',
        model_version: 'fallback'
      });
    });
  });

  describe('_fallbackList', () => {
    it('should return empty alerts fallback', () => {
      expect(alerter._fallbackList()).toEqual({
        alerts: [],
        total: 0,
        model_version: 'fallback'
      });
    });
  });
});
