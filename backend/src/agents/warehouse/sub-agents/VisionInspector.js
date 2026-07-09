const SubAgent = require('../../_base/SubAgent');

class VisionInspector extends SubAgent {
  constructor(warehouseId, apiService) {
    super('VisionInspector', `Warehouse-${warehouseId}`, apiService);
    this.warehouseId = warehouseId;
  }

  async inspectWarehouseImage(imageData, options = {}) {
    this.log('Inspecting warehouse image');

    if (!imageData) {
      this.warn('No image data provided for inspection');
      return this._fallbackInspect();
    }

    const data = {
      image: imageData,
      warehouse_id: this.warehouseId,
      ...options
    };

    try {
      const result = await this.apiService.visionAnalyze(data);
      return {
        detections: result.detections || [],
        inventory_estimate: result.inventory_estimate || {},
        quality_issues: result.quality_issues || [],
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('Vision inspection failed:', err.message);
      return this._fallbackInspect();
    }
  }

  async detectObjects(imageData, objectTypes = []) {
    this.log(`Detecting ${objectTypes.length} object types`);

    if (!imageData) {
      this.warn('No image data for object detection');
      return this._fallbackDetect();
    }

    const data = {
      image: imageData,
      target_objects: objectTypes
    };

    try {
      const result = await this.apiService.visionAnalyze(data);
      return {
        detections: result.detections || [],
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('Object detection failed:', err.message);
      return this._fallbackDetect();
    }
  }

  async assessQuality(imageData, criteria = {}) {
    this.log('Assessing image quality');

    if (!imageData) {
      this.warn('No image data for quality assessment');
      return this._fallbackQuality();
    }

    const data = {
      image: imageData,
      quality_criteria: criteria
    };

    try {
      const result = await this.apiService.visionAnalyze(data);
      return {
        score: result.score != null ? result.score : 0,
        issues: result.issues || result.quality_issues || [],
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('Quality assessment failed:', err.message);
      return this._fallbackQuality();
    }
  }

  _fallbackInspect() {
    return {
      detections: [],
      inventory_estimate: {},
      quality_issues: [],
      model_version: 'fallback'
    };
  }

  _fallbackDetect() {
    return {
      detections: [],
      model_version: 'fallback'
    };
  }

  _fallbackQuality() {
    return {
      score: 0.5,
      issues: [],
      model_version: 'fallback'
    };
  }
}

module.exports = VisionInspector;
