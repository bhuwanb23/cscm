const SupplierCalibrator = require('../../../../agents/supplier/sub-agents/SupplierCalibrator');

describe('SupplierCalibrator', () => {
  let apiService;
  let calibrator;
  const supplierId = 'SUP-001';

  beforeEach(() => {
    apiService = {
      supplierCalibrate: jest.fn()
    };
    calibrator = new SupplierCalibrator(supplierId, apiService);
  });

  describe('constructor', () => {
    it('should set name and parentId via super', () => {
      expect(calibrator.name).toBe('SupplierCalibrator');
      expect(calibrator.parentId).toBe(`Supplier-${supplierId}`);
      expect(calibrator.apiService).toBe(apiService);
    });

    it('should set supplierId', () => {
      expect(calibrator.supplierId).toBe(supplierId);
    });

    it('should inherit state from SubAgent', () => {
      expect(calibrator.state).toBeDefined();
    });
  });

  describe('calibrate', () => {
    const historicalAssessments = [
      { id: 'A1', score: 30, label: 'low' },
      { id: 'A2', score: 65, label: 'medium' }
    ];
    const groundTruth = [
      { id: 'A1', actual: 'low' },
      { id: 'A2', actual: 'high' }
    ];

    it('should return API result on success', async () => {
      const apiResult = {
        calibration_score: 0.82,
        threshold_adjustments: { low: 28, medium: 58, high: 78 },
        model_version: 'v2.1'
      };
      apiService.supplierCalibrate.mockResolvedValue(apiResult);

      const result = await calibrator.calibrate(historicalAssessments, groundTruth);

      expect(apiService.supplierCalibrate).toHaveBeenCalledWith({
        assessments: historicalAssessments,
        ground_truth: groundTruth
      });
      expect(result).toEqual(apiResult);
    });

    it('should call fallback when API throws', async () => {
      apiService.supplierCalibrate.mockRejectedValue(new Error('API down'));

      const result = await calibrator.calibrate(historicalAssessments, groundTruth);

      expect(result).toHaveProperty('calibration_score', 0.5);
      expect(result).toHaveProperty('threshold_adjustments');
      expect(result).toHaveProperty('model_version', 'fallback');
    });

    it('should handle empty historicalAssessments via fallback', async () => {
      apiService.supplierCalibrate.mockRejectedValue(new Error('API down'));

      const result = await calibrator.calibrate([], groundTruth);

      expect(result.model_version).toBe('fallback');
      expect(result.threshold_adjustments).toEqual({ low: 30, medium: 60, high: 80 });
    });
  });

  describe('getCalibrationStatus', () => {
    it('should return API result on success', async () => {
      const apiResult = { last_calibrated: '2024-03-01T00:00:00Z', sample_size: 500, drift_detected: false };
      apiService.supplierCalibrate.mockResolvedValue(apiResult);

      const result = await calibrator.getCalibrationStatus();

      expect(apiService.supplierCalibrate).toHaveBeenCalledWith({ action: 'get_status' });
      expect(result).toEqual(apiResult);
    });

    it('should fallback when API throws', async () => {
      apiService.supplierCalibrate.mockRejectedValue(new Error('API down'));

      const result = await calibrator.getCalibrationStatus();

      expect(result).toEqual({
        last_calibrated: null,
        sample_size: 0,
        drift_detected: false,
        model_version: 'fallback'
      });
    });
  });

  describe('_fallbackCalibrate', () => {
    it('should return expected fallback shape', () => {
      const result = calibrator._fallbackCalibrate();

      expect(result).toEqual({
        calibration_score: 0.5,
        threshold_adjustments: { low: 30, medium: 60, high: 80 },
        model_version: 'fallback'
      });
    });
  });

  describe('_fallbackStatus', () => {
    it('should return expected fallback status shape', () => {
      const result = calibrator._fallbackStatus();

      expect(result).toEqual({
        last_calibrated: null,
        sample_size: 0,
        drift_detected: false,
        model_version: 'fallback'
      });
    });
  });
});
