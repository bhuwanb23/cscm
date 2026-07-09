const SubAgent = require('../../_base/SubAgent');

class SegmentManager extends SubAgent {
  constructor(agentId, apiService) {
    super('SegmentManager', agentId, apiService);
  }

  async segment(customers) {
    this.log(`Segmenting ${customers.length} customers`);

    if (!customers || customers.length === 0) throw new Error('customers is required');

    const data = { customers };

    try {
      const result = await this.apiService.naturalLanguageProcessing(data);
      return result.segments || this._fallbackSegmentation(customers);
    } catch (err) {
      this.error('Segmentation failed:', err.message);
      return this._fallbackSegmentation(customers);
    }
  }

  async compareSegments(segmentA, segmentB) {
    this.log('Comparing segments');

    try {
      const result = await this.apiService.segmentSimilarity({ segment_a: segmentA, segment_b: segmentB });
      return result;
    } catch (err) {
      this.error('Segment comparison failed:', err.message);
      return { similarity: 0.5, shared_characteristics: [], fallback: true };
    }
  }

  async analyzePromotionalImpact(promotionData) {
    this.log('Analyzing promotional impact');

    try {
      const result = await this.apiService.causalInference(promotionData);
      return result;
    } catch (err) {
      this.error('Promotional impact analysis failed:', err.message);
      return {
        impact: 0,
        confidence: 0,
        segments_affected: [],
        fallback: true
      };
    }
  }

  _fallbackSegmentation(customers) {
    const segments = {};
    for (const c of customers) {
      const spending = c.totalSpending || c.spending || 0;
      let segment;
      if (spending > 1000) segment = 'premium';
      else if (spending > 500) segment = 'standard';
      else segment = 'budget';

      if (!segments[segment]) segments[segment] = [];
      segments[segment].push(c.id || c.customerId);
    }
    return segments;
  }
}

module.exports = SegmentManager;
