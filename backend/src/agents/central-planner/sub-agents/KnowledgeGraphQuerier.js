const SubAgent = require('../../_base/SubAgent');

class KnowledgeGraphQuerier extends SubAgent {
  constructor(plannerId, apiService) {
    super('KnowledgeGraphQuerier', `CP-${plannerId}`, apiService);
    this.plannerId = plannerId;
  }

  async query(querySpec) {
    this.log('Running knowledge graph query');

    if (!querySpec) throw new Error('querySpec is required');

    try {
      const result = await this.apiService.kgQuery({ query: querySpec });
      return {
        entities: result.entities || [],
        relationships: result.relationships || [],
        paths: result.paths || [],
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('Knowledge graph query failed:', err.message);
      return this._fallbackQuery();
    }
  }

  async findRelated(entityId, entityType, depth = 2) {
    this.log(`Finding entities related to ${entityType}:${entityId} (depth=${depth})`);

    if (!entityId) throw new Error('entityId is required');
    if (!entityType) throw new Error('entityType is required');

    try {
      const result = await this.apiService.kgQuery({
        entity_id: entityId,
        entity_type: entityType,
        depth
      });
      const related = result.related || result.entities || [];
      return {
        related,
        total: result.total !== undefined ? result.total : related.length,
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('findRelated failed:', err.message);
      return this._fallbackRelated();
    }
  }

  async getSupplierGraph(supplierId) {
    this.log(`Fetching supplier graph for ${supplierId}`);

    if (!supplierId) throw new Error('supplierId is required');

    try {
      const result = await this.apiService.kgQuery({
        query_type: 'supplier_graph',
        supplier_id: supplierId
      });
      return {
        entities: result.entities || [],
        relationships: result.relationships || [],
        paths: result.paths || [],
        model_version: result.model_version || 'unknown'
      };
    } catch (err) {
      this.error('getSupplierGraph failed:', err.message);
      return this._fallbackQuery();
    }
  }

  _fallbackQuery() {
    return {
      entities: [],
      relationships: [],
      paths: [],
      model_version: 'fallback'
    };
  }

  _fallbackRelated() {
    return {
      related: [],
      total: 0,
      model_version: 'fallback'
    };
  }
}

module.exports = KnowledgeGraphQuerier;
