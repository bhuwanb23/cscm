/**
 * Knowledge Graph Structure
 * 
 * This module provides a simple graph structure for representing relationships
 * between entities in the supply chain.
 */

const { Graph } = require('@datastructures-js/graph');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class KnowledgeGraph {
  constructor(options = {}) {
    this.graph = new Graph();
    this.entityMetadata = new Map();
    this.relationshipMetadata = new Map();
    this._persistPath = options.persistPath || path.join(__dirname, '..', '..', 'data', 'knowledge-graph.json');
    this._persistTimer = null;
    this._persistDelay = options.persistDelay || 2000;
    this._disabled = options.disableAutoPersist || process.env.NODE_ENV === 'test';
  }

  /**
   * Add an entity (node) to the graph
   * @param {string} entityId - Unique identifier for the entity
   * @param {string} entityType - Type of entity (e.g., 'sku', 'store', 'supplier')
   * @param {Object} metadata - Additional metadata about the entity
   */
  addEntity(entityId, entityType, metadata = {}) {
    try {
      if (!entityId) {
        throw new Error('Entity ID is required');
      }

      if (!entityType) {
        throw new Error('Entity type is required');
      }

      // Add vertex to graph
      this.graph.addVertex(entityId);
      
      // Store entity metadata
      this.entityMetadata.set(entityId, {
        id: entityId,
        type: entityType,
        ...metadata,
        createdAt: new Date().toISOString()
      });

      this._schedulePersist();
      logger.debug(`Added entity to knowledge graph: ${entityId} (${entityType})`);
    } catch (error) {
      logger.error(`Failed to add entity ${entityId}:`, error.message);
      throw error;
    }
  }

  /**
   * Add a relationship (edge) between two entities
   * @param {string} fromEntityId - Source entity ID
   * @param {string} toEntityId - Target entity ID
   * @param {string} relationshipType - Type of relationship
   * @param {Object} metadata - Additional metadata about the relationship
   */
  addRelationship(fromEntityId, toEntityId, relationshipType, metadata = {}) {
    try {
      if (!fromEntityId || !toEntityId) {
        throw new Error('Both fromEntityId and toEntityId are required');
      }

      if (!relationshipType) {
        throw new Error('Relationship type is required');
      }

      // Check if entities exist
      if (!this.graph.hasVertex(fromEntityId)) {
        throw new Error(`Source entity ${fromEntityId} does not exist`);
      }

      if (!this.graph.hasVertex(toEntityId)) {
        throw new Error(`Target entity ${toEntityId} does not exist`);
      }

      // Use a simple numeric weight (we'll store detailed metadata separately)
      const weight = 1;
      
      // Add edge to graph with numeric weight
      this.graph.addEdge(fromEntityId, toEntityId, weight);
      
      // Store relationship metadata
      const relationshipKey = `${fromEntityId}-${toEntityId}`;
      this.relationshipMetadata.set(relationshipKey, {
        type: relationshipType,
        ...metadata
      });
      
      this._schedulePersist();
      logger.debug(`Added relationship to knowledge graph: ${fromEntityId} -> ${toEntityId} (${relationshipType})`);
    } catch (error) {
      logger.error(`Failed to add relationship from ${fromEntityId} to ${toEntityId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get an entity from the graph
   * @param {string} entityId - Entity ID
   * @returns {Object|null} Entity data or null if not found
   */
  getEntity(entityId) {
    try {
      if (!entityId) {
        throw new Error('Entity ID is required');
      }

      if (!this.graph.hasVertex(entityId)) {
        return null;
      }

      return this.entityMetadata.get(entityId) || { id: entityId };
    } catch (error) {
      logger.error(`Failed to get entity ${entityId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get neighbors of an entity
   * @param {string} entityId - Entity ID
   * @returns {Array} Array of neighboring entities
   */
  getNeighbors(entityId) {
    try {
      if (!entityId) {
        throw new Error('Entity ID is required');
      }

      if (!this.graph.hasVertex(entityId)) {
        return [];
      }

      const neighbors = this.graph.getConnectedVertices(entityId);
      return neighbors.map(neighborId => this.getEntity(neighborId));
    } catch (error) {
      logger.error(`Failed to get neighbors of entity ${entityId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get relationships of an entity
   * @param {string} entityId - Entity ID
   * @returns {Array} Array of relationships
   */
  getRelationships(entityId) {
    try {
      if (!entityId) {
        throw new Error('Entity ID is required');
      }

      if (!this.graph.hasVertex(entityId)) {
        return [];
      }

      // Get connected edges
      const connectedEdges = this.graph.getConnectedEdges(entityId);
      
      // Format relationships
      const relationships = [];
      
      // Convert object to array of relationships
      for (const [dest, weight] of Object.entries(connectedEdges)) {
        const relationshipKey = `${entityId}-${dest}`;
        const relationshipMetadata = this.relationshipMetadata.get(relationshipKey) || {};
        
        // Extract type and metadata separately
        const { type, ...metadataWithoutType } = relationshipMetadata;
        
        relationships.push({
          from: entityId,
          to: dest,
          type: type || 'unknown',
          metadata: metadataWithoutType,
          direction: 'outgoing'
        });
      }
      
      return relationships;
    } catch (error) {
      logger.error(`Failed to get relationships of entity ${entityId}:`, error.message);
      throw error;
    }
  }

  /**
   * Find shortest path between two entities
   * @param {string} fromEntityId - Source entity ID
   * @param {string} toEntityId - Target entity ID
   * @returns {Array|null} Array of entity IDs in the path or null if no path exists
   */
  findShortestPath(fromEntityId, toEntityId) {
    try {
      if (!fromEntityId || !toEntityId) {
        throw new Error('Both fromEntityId and toEntityId are required');
      }

      if (!this.graph.hasVertex(fromEntityId)) {
        throw new Error(`Source entity ${fromEntityId} does not exist`);
      }

      if (!this.graph.hasVertex(toEntityId)) {
        throw new Error(`Target entity ${toEntityId} does not exist`);
      }

      // Use BFS to find shortest path
      const queue = [[fromEntityId]];
      const visited = new Set([fromEntityId]);

      while (queue.length > 0) {
        const path = queue.shift();
        const currentNode = path[path.length - 1];

        if (currentNode === toEntityId) {
          return path;
        }

        const neighbors = this.graph.getConnectedVertices(currentNode);
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            const newPath = [...path, neighbor];
            queue.push(newPath);
          }
        }
      }

      return null; // No path found
    } catch (error) {
      logger.error(`Failed to find shortest path from ${fromEntityId} to ${toEntityId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all entities of a specific type
   * @param {string} entityType - Entity type to filter by
   * @returns {Array} Array of entities of the specified type
   */
  getEntitiesByType(entityType) {
    try {
      if (!entityType) {
        throw new Error('Entity type is required');
      }

      const entities = [];
      for (const [entityId, metadata] of this.entityMetadata.entries()) {
        if (metadata.type === entityType) {
          entities.push(metadata);
        }
      }

      return entities;
    } catch (error) {
      logger.error(`Failed to get entities by type ${entityType}:`, error.message);
      throw error;
    }
  }

  /**
   * Remove an entity from the graph
   * @param {string} entityId - Entity ID to remove
   */
  removeEntity(entityId) {
    try {
      if (!entityId) {
        throw new Error('Entity ID is required');
      }

      if (!this.graph.hasVertex(entityId)) {
        logger.debug(`Entity ${entityId} not found in graph`);
        return;
      }

      // Remove entity from graph
      this.graph.removeVertex(entityId);
      
      // Remove entity metadata
      this.entityMetadata.delete(entityId);

      this._schedulePersist();
      logger.debug(`Removed entity from knowledge graph: ${entityId}`);
    } catch (error) {
      logger.error(`Failed to remove entity ${entityId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get graph statistics
   * @returns {Object} Graph statistics
   */
  getStats() {
    return {
      nodeCount: this.graph.getVerticesCount(),
      edgeCount: this.graph.getEdgesCount(),
      entityTypes: this._getEntityTypes()
    };
  }

  /**
   * Get entity types distribution
   * @private
   * @returns {Object} Entity types distribution
   */
  _getEntityTypes() {
    const types = {};
    for (const metadata of this.entityMetadata.values()) {
      const type = metadata.type;
      types[type] = (types[type] || 0) + 1;
    }
    return types;
  }

  /**
   * Clear the graph
   */
  clear() {
    this.graph.clear();
    this.entityMetadata.clear();
    this.relationshipMetadata.clear();
    this._schedulePersist();
    logger.info('Knowledge graph cleared');
  }

  _schedulePersist() {
    if (this._disabled) return;
    if (this._persistTimer) clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => this._doPersist(), this._persistDelay);
  }

  _doPersist() {
    try {
      const dir = path.dirname(this._persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = this.toJSON();
      fs.writeFileSync(this._persistPath, JSON.stringify(data, null, 2));
      logger.debug(`Knowledge graph persisted to ${this._persistPath}`);
    } catch (error) {
      logger.error(`Failed to persist knowledge graph: ${error.message}`);
    }
  }

  _load() {
    if (this._disabled) return;
    try {
      if (fs.existsSync(this._persistPath)) {
        const raw = fs.readFileSync(this._persistPath, 'utf-8');
        const data = JSON.parse(raw);
        this.fromJSON(data);
        logger.info(`Knowledge graph loaded from ${this._persistPath}`);
      }
    } catch (error) {
      logger.error(`Failed to load knowledge graph: ${error.message}`);
    }
  }

  /**
   * Serialize the graph to JSON
   * @returns {Object} Serialized graph data
   */
  toJSON() {
    const nodes = [];
    const edges = [];
    const addedEdges = new Set(); // Track already added edges to avoid duplicates

    // Serialize nodes
    for (const entityId of this.entityMetadata.keys()) {
      nodes.push({
        id: entityId,
        ...this.entityMetadata.get(entityId)
      });
    }

    // Serialize edges
    // We need to iterate through all vertices and their connected edges
    for (const entityId of this.entityMetadata.keys()) {
      const relationships = this.getRelationships(entityId);
      relationships.forEach(rel => {
        // Create a unique identifier for this edge to avoid duplicates
        const edgeId = `${rel.from}-${rel.to}`;
        const reverseEdgeId = `${rel.to}-${rel.from}`;
        
        // Only add each edge once
        if (rel.from === entityId && !addedEdges.has(edgeId) && !addedEdges.has(reverseEdgeId)) {
          addedEdges.add(edgeId);
          edges.push({
            from: rel.from,
            to: rel.to,
            type: rel.type,
            metadata: rel.metadata
          });
        }
      });
    }

    return { nodes, edges };
  }

  /**
   * Load graph from JSON
   * @param {Object} data - Serialized graph data
   */
  fromJSON(data) {
    this.clear();

    // Load nodes
    if (data.nodes) {
      for (const node of data.nodes) {
        const { id, type, ...metadata } = node;
        this.addEntity(id, type, metadata);
      }
    }

    // Load edges
    if (data.edges) {
      for (const edge of data.edges) {
        this.addRelationship(edge.from, edge.to, edge.type, edge.metadata);
      }
    }
  }
}

// Export singleton instance (loads persisted graph from disk on startup)
const instance = new KnowledgeGraph();
instance._load();
// Clear any persist timer that was set during _load() via addEntity/addRelationship
if (instance._persistTimer) {
  clearTimeout(instance._persistTimer);
  instance._persistTimer = null;
}
module.exports = instance;