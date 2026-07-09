const SubAgent = require('../../_base/SubAgent');

class BackupSupplierFinder extends SubAgent {
  constructor(supplierId, apiService) {
    super('BackupSupplierFinder', `Supplier-${supplierId}`, apiService);
    this.supplierId = supplierId;
  }

  async findBackups(primarySupplierId, requirements) {
    this.log(`Finding backup suppliers for ${primarySupplierId}`);

    const data = {
      primary_supplier_id: primarySupplierId,
      requirements: {
        product_category: requirements.product_category,
        min_quality: requirements.min_quality,
        max_lead_time: requirements.max_lead_time,
        region: requirements.region
      }
    };

    try {
      const result = await this.apiService.supplierBackup(data);
      this.log(`Found ${result.backups.length} of ${result.total_candidates} candidates`);
      return result;
    } catch (err) {
      this.error('Backup supplier search failed:', err.message);
      return this._fallbackBackups(primarySupplierId, requirements);
    }
  }

  rankByCriteria(candidates, criteria) {
    if (!Array.isArray(candidates) || candidates.length === 0) return [];

    const weights = {
      score: 2.0,
      quality: 0.3,
      leadTime: 0.1,
      distance: 0.05,
      ...(criteria || {})
    };

    const normalizeLeadTime = (days) => {
      if (!days || days <= 0) return 0;
      return Math.max(0, 1 - days / 60);
    };

    const normalizeDistance = (km) => {
      if (km == null) return 0;
      return Math.max(0, 1 - km / 5000);
    };

    return [...candidates].sort((a, b) => {
      const aScore = (a.score || 0) * weights.score
        + (a.quality_score || 0) * weights.quality
        + normalizeLeadTime(a.lead_time_days) * weights.leadTime
        + normalizeDistance(a.distance_km) * weights.distance;
      const bScore = (b.score || 0) * weights.score
        + (b.quality_score || 0) * weights.quality
        + normalizeLeadTime(b.lead_time_days) * weights.leadTime
        + normalizeDistance(b.distance_km) * weights.distance;
      return bScore - aScore;
    });
  }

  _fallbackBackups(primaryId, requirements) {
    return {
      backups: [{
        supplier_id: `BACKUP-001`,
        score: 0.7,
        lead_time_days: 14,
        quality_score: 0.8,
        distance_km: 100
      }],
      total_candidates: 1,
      model_version: 'fallback'
    };
  }
}

module.exports = BackupSupplierFinder;
