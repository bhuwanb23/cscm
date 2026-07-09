const BackupSupplierFinder = require('../../../../agents/supplier/sub-agents/BackupSupplierFinder');

describe('BackupSupplierFinder', () => {
  let apiService;
  let finder;
  const supplierId = 'SUP-001';

  beforeEach(() => {
    apiService = {
      supplierBackup: jest.fn()
    };
    finder = new BackupSupplierFinder(supplierId, apiService);
  });

  describe('constructor', () => {
    it('should set name and parentId via super', () => {
      expect(finder.name).toBe('BackupSupplierFinder');
      expect(finder.parentId).toBe(`Supplier-${supplierId}`);
      expect(finder.apiService).toBe(apiService);
    });

    it('should set supplierId', () => {
      expect(finder.supplierId).toBe(supplierId);
    });
  });

  describe('findBackups', () => {
    const primaryId = 'SUP-100';
    const requirements = {
      product_category: 'electronics',
      min_quality: 0.8,
      max_lead_time: 20,
      region: 'APAC'
    };

    it('should return API result on success', async () => {
      const apiResult = {
        backups: [
          { supplier_id: 'BACKUP-A', score: 0.9, lead_time_days: 10, quality_score: 0.95, distance_km: 50 },
          { supplier_id: 'BACKUP-B', score: 0.75, lead_time_days: 15, quality_score: 0.85, distance_km: 200 }
        ],
        total_candidates: 12,
        model_version: 'v1.0'
      };
      apiService.supplierBackup.mockResolvedValue(apiResult);

      const result = await finder.findBackups(primaryId, requirements);

      expect(apiService.supplierBackup).toHaveBeenCalledWith({
        primary_supplier_id: primaryId,
        requirements: {
          product_category: 'electronics',
          min_quality: 0.8,
          max_lead_time: 20,
          region: 'APAC'
        }
      });
      expect(result).toEqual(apiResult);
    });

    it('should call fallback when API throws', async () => {
      apiService.supplierBackup.mockRejectedValue(new Error('API down'));

      const result = await finder.findBackups(primaryId, requirements);

      expect(result.model_version).toBe('fallback');
      expect(result.backups).toHaveLength(1);
      expect(result.backups[0]).toMatchObject({ supplier_id: 'BACKUP-001', score: 0.7 });
      expect(result.total_candidates).toBe(1);
    });

    it('should handle empty requirements object via fallback', async () => {
      apiService.supplierBackup.mockRejectedValue(new Error('API down'));

      const result = await finder.findBackups(primaryId, {});

      expect(apiService.supplierBackup).toHaveBeenCalledWith({
        primary_supplier_id: primaryId,
        requirements: {
          product_category: undefined,
          min_quality: undefined,
          max_lead_time: undefined,
          region: undefined
        }
      });
      expect(result.model_version).toBe('fallback');
    });
  });

  describe('rankByCriteria', () => {
    it('should sort candidates by score desc by default', () => {
      const candidates = [
        { supplier_id: 'A', score: 0.5, quality_score: 0.8, lead_time_days: 10, distance_km: 100 },
        { supplier_id: 'B', score: 0.9, quality_score: 0.7, lead_time_days: 20, distance_km: 200 },
        { supplier_id: 'C', score: 0.7, quality_score: 0.9, lead_time_days: 5, distance_km: 50 }
      ];

      const result = finder.rankByCriteria(candidates);

      expect(result[0].supplier_id).toBe('B');
      expect(result[2].supplier_id).toBe('A');
    });

    it('should return empty array for empty input', () => {
      expect(finder.rankByCriteria([])).toEqual([]);
      expect(finder.rankByCriteria(null)).toEqual([]);
      expect(finder.rankByCriteria(undefined)).toEqual([]);
    });

    it('should not mutate the input array', () => {
      const candidates = [
        { supplier_id: 'A', score: 0.5 },
        { supplier_id: 'B', score: 0.9 }
      ];
      const original = [...candidates];

      finder.rankByCriteria(candidates);

      expect(candidates).toEqual(original);
    });

    it('should apply custom criteria weights', () => {
      const candidates = [
        { supplier_id: 'A', score: 0.5, quality_score: 0.95, lead_time_days: 30 },
        { supplier_id: 'B', score: 0.9, quality_score: 0.5, lead_time_days: 5 }
      ];

      const result = finder.rankByCriteria(candidates, { score: 0.1, quality: 1.0, leadTime: 0.1 });

      expect(result[0].supplier_id).toBe('A');
    });
  });

  describe('_fallbackBackups', () => {
    it('should return expected fallback shape', () => {
      const result = finder._fallbackBackups('SUP-100', {});

      expect(result).toEqual({
        backups: [{ supplier_id: 'BACKUP-001', score: 0.7, lead_time_days: 14, quality_score: 0.8, distance_km: 100 }],
        total_candidates: 1,
        model_version: 'fallback'
      });
    });
  });
});
