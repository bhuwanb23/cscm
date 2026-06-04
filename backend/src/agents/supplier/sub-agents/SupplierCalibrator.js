const SubAgent = require('../../_base/SubAgent');

class SupplierCalibrator extends SubAgent {
  constructor(supplierId, apiService) {
    super('SupplierCalibrator', `Supplier-${supplierId}`, apiService);
    this.supplierId = supplierId;
  }

  async calibrate(historicalAssessments, groundTruth) {
    this.log('Calibrating supplier risk model');

    const data = {
      assessments: historicalAssessments,
      ground_truth: groundTruth
    };

    try {
      const result = await this.apiService.supplierCalibrate(data);
      this.log(`Calibration score: ${result.calibration_score}, model: ${result.model_version}`);
      return result;
    } catch (err) {
      this.error('Calibration failed:', err.message);
      return this._fallbackCalibrate();
    }
  }

  async getCalibrationStatus() {
    this.log('Fetching calibration status');

    try {
      const result = await this.apiService.supplierCalibrate({ action: 'get_status' });
      return result;
    } catch (err) {
      this.error('Calibration status fetch failed:', err.message);
      return this._fallbackStatus();
    }
  }

  _fallbackCalibrate() {
    return {
      calibration_score: 0.5,
      threshold_adjustments: { low: 30, medium: 60, high: 80 },
      model_version: 'fallback'
    };
  }

  _fallbackStatus() {
    return {
      last_calibrated: null,
      sample_size: 0,
      drift_detected: false,
      model_version: 'fallback'
    };
  }
}

module.exports = SupplierCalibrator;
