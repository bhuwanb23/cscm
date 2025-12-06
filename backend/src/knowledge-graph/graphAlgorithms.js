/**
 * Graph Algorithms
 * 
 * This module provides basic graph algorithms for relationship analysis
 * in the knowledge graph.
 */

const knowledgeGraph = require('./graphStructure');
const logger = require('../utils/logger');

class GraphAlgorithms {
  /**
   * Find all connected components in the graph
   * @returns {Array} Array of connected components
   */
  static findConnectedComponents() {
    try {
      const visited = new Set();
      const components = [];
      
      // Get all nodes from entityMetadata since that's our source of truth
      const nodes = Array.from(knowledgeGraph.entityMetadata.keys());
      
      for (const node of nodes) {
        if (!visited.has(node)) {
          const component = [];
          const queue = [node];
          visited.add(node);
          
          // BFS to find all nodes in this component
          while (queue.length > 0) {
            const currentNode = queue.shift();
            component.push(currentNode);
            
            // Check neighbors
            const neighbors = knowledgeGraph.graph.getConnectedVertices(currentNode);
            for (const neighbor of neighbors) {
              if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
              }
            }
          }
          
          components.push(component);
        }
      }
      
      logger.debug(`Found ${components.length} connected components`);
      return components;
    } catch (error) {
      logger.error('Failed to find connected components:', error.message);
      throw error;
    }
  }

  /**
   * Calculate centrality measures for entities
   * @returns {Object} Centrality measures for each entity
   */
  static calculateCentrality() {
    try {
      const centrality = {};
      
      // Get all nodes from entityMetadata
      const nodes = Array.from(knowledgeGraph.entityMetadata.keys());
      
      // Calculate degree centrality (we'll approximate with number of relationships)
      for (const node of nodes) {
        const relationships = knowledgeGraph.getRelationships(node);
        const degree = relationships.length;
        
        // For simplicity, we'll consider all connections as both in and out
        centrality[node] = {
          degree: degree,
          inDegree: Math.floor(degree / 2),
          outDegree: Math.ceil(degree / 2)
        };
      }
      
      // Normalize centrality scores
      const maxDegree = Math.max(...Object.values(centrality).map(c => c.degree));
      if (maxDegree > 0) {
        for (const node in centrality) {
          centrality[node].normalizedDegree = centrality[node].degree / maxDegree;
        }
      }
      
      logger.debug('Calculated centrality measures');
      return centrality;
    } catch (error) {
      logger.error('Failed to calculate centrality:', error.message);
      throw error;
    }
  }

  /**
   * Find the most central entities
   * @param {number} limit - Number of top entities to return
   * @returns {Array} Array of most central entities
   */
  static findMostCentralEntities(limit = 10) {
    try {
      const centrality = this.calculateCentrality();
      const entities = Object.keys(centrality);
      
      // Sort by degree centrality
      entities.sort((a, b) => centrality[b].degree - centrality[a].degree);
      
      // Return top entities with their metadata
      const topEntities = entities.slice(0, limit).map(entityId => {
        const entity = knowledgeGraph.getEntity(entityId);
        return {
          ...entity,
          centrality: centrality[entityId]
        };
      });
      
      logger.debug(`Found ${topEntities.length} most central entities`);
      return topEntities;
    } catch (error) {
      logger.error('Failed to find most central entities:', error.message);
      throw error;
    }
  }

  /**
   * Find entities with no connections (isolated nodes)
   * @returns {Array} Array of isolated entities
   */
  static findIsolatedEntities() {
    try {
      const isolated = [];
      
      // Get all nodes from entityMetadata
      const nodes = Array.from(knowledgeGraph.entityMetadata.keys());
      
      for (const node of nodes) {
        const relationships = knowledgeGraph.getRelationships(node);
        if (relationships.length === 0) {
          const entity = knowledgeGraph.getEntity(node);
          isolated.push(entity);
        }
      }
      
      logger.debug(`Found ${isolated.length} isolated entities`);
      return isolated;
    } catch (error) {
      logger.error('Failed to find isolated entities:', error.message);
      throw error;
    }
  }

  /**
   * Find entities that act as bridges between different parts of the graph
   * @returns {Array} Array of bridge entities
   */
  static findBridgeEntities() {
    try {
      const bridges = [];
      const centrality = this.calculateCentrality();
      
      // Entities with high betweenness (approximated by high degree in our simplified approach)
      // and that connect different types of entities are likely bridges
      const entities = Object.keys(centrality);
      
      for (const entityId of entities) {
        const entity = knowledgeGraph.getEntity(entityId);
        const relationships = knowledgeGraph.getRelationships(entityId);
        
        // Count connections to different entity types
        const connectedTypes = new Set();
        relationships.forEach(rel => {
          const connectedEntity = knowledgeGraph.getEntity(rel.to);
          if (connectedEntity) {
            connectedTypes.add(connectedEntity.type);
          }
        });
        
        // If entity connects more than 2 different types and has high centrality, it's a bridge
        if (connectedTypes.size > 1 && centrality[entityId].degree > 1) {
          bridges.push({
            ...entity,
            bridgeScore: connectedTypes.size * centrality[entityId].degree,
            connectedTypes: Array.from(connectedTypes)
          });
        }
      }
      
      // Sort by bridge score
      bridges.sort((a, b) => b.bridgeScore - a.bridgeScore);
      
      logger.debug(`Found ${bridges.length} bridge entities`);
      return bridges;
    } catch (error) {
      logger.error('Failed to find bridge entities:', error.message);
      throw error;
    }
  }

  /**
   * Analyze supply chain clusters
   * @returns {Array} Array of supply chain clusters
   */
  static analyzeSupplyChainClusters() {
    try {
      const components = this.findConnectedComponents();
      const clusters = [];
      
      for (const component of components) {
        const cluster = {
          size: component.length,
          entities: [],
          entityTypes: {},
          relationships: 0
        };
        
        // Collect entity information
        for (const entityId of component) {
          const entity = knowledgeGraph.getEntity(entityId);
          cluster.entities.push(entity);
          
          // Count entity types
          const type = entity.type;
          cluster.entityTypes[type] = (cluster.entityTypes[type] || 0) + 1;
        }
        
        // Count relationships within cluster
        for (const entityId of component) {
          const relationships = knowledgeGraph.getRelationships(entityId);
          relationships.forEach(rel => {
            // Only count relationships within the same cluster
            if (component.includes(rel.to)) {
              cluster.relationships++;
            }
          });
        }
        
        clusters.push(cluster);
      }
      
      // Sort by size
      clusters.sort((a, b) => b.size - a.size);
      
      logger.debug(`Analyzed ${clusters.length} supply chain clusters`);
      return clusters;
    } catch (error) {
      logger.error('Failed to analyze supply chain clusters:', error.message);
      throw error;
    }
  }

  /**
   * Find critical supply chain paths
   * @param {string} sourceType - Source entity type
   * @param {string} targetType - Target entity type
   * @returns {Array} Array of critical paths
   */
  static findCriticalPaths(sourceType, targetType) {
    try {
      const sourceEntities = knowledgeGraph.getEntitiesByType(sourceType);
      const targetEntities = knowledgeGraph.getEntitiesByType(targetType);
      const paths = [];
      
      // Find paths between all source and target entities
      for (const source of sourceEntities) {
        for (const target of targetEntities) {
          const path = knowledgeGraph.findShortestPath(source.id, target.id);
          if (path) {
            paths.push({
              source: source,
              target: target,
              path: path,
              length: path.length - 1 // Number of edges
            });
          }
        }
      }
      
      // Sort by path length (shorter paths first)
      paths.sort((a, b) => a.length - b.length);
      
      logger.debug(`Found ${paths.length} critical paths from ${sourceType} to ${targetType}`);
      return paths;
    } catch (error) {
      logger.error(`Failed to find critical paths from ${sourceType} to ${targetType}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate supply chain network summary
   * @returns {Object} Network summary
   */
  static generateNetworkSummary() {
    try {
      const stats = knowledgeGraph.getStats();
      const centrality = this.calculateCentrality();
      const components = this.findConnectedComponents();
      const isolated = this.findIsolatedEntities();
      const bridges = this.findBridgeEntities();
      const clusters = this.analyzeSupplyChainClusters();
      
      const summary = {
        basicStats: stats,
        networkMetrics: {
          connectedComponents: components.length,
          isolatedEntities: isolated.length,
          averageClustering: this._calculateAverageClustering(),
          density: this._calculateGraphDensity()
        },
        keyEntities: {
          mostCentral: this.findMostCentralEntities(5),
          bridges: bridges.slice(0, 5)
        },
        supplyChainInsights: {
          clusters: clusters.length,
          largestClusterSize: clusters.length > 0 ? clusters[0].size : 0
        }
      };
      
      logger.debug('Generated network summary');
      return summary;
    } catch (error) {
      logger.error('Failed to generate network summary:', error.message);
      throw error;
    }
  }

  /**
   * Calculate average clustering coefficient
   * @private
   * @returns {number} Average clustering coefficient
   */
  static _calculateAverageClustering() {
    try {
      // Simplified calculation - in a real implementation, this would be more complex
      const nodes = Array.from(knowledgeGraph.entityMetadata.keys());
      if (nodes.length === 0) return 0;
      
      // For our purposes, we'll approximate with the ratio of actual edges to possible edges
      const actualEdges = knowledgeGraph.graph.getEdgesCount();
      const possibleEdges = nodes.length * (nodes.length - 1);
      
      return possibleEdges > 0 ? actualEdges / possibleEdges : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate graph density
   * @private
   * @returns {number} Graph density
   */
  static _calculateGraphDensity() {
    try {
      const nodes = knowledgeGraph.graph.getVerticesCount();
      const edges = knowledgeGraph.graph.getEdgesCount();
      
      if (nodes <= 1) return 0;
      
      // For directed graph: density = edges / (nodes * (nodes - 1))
      return edges / (nodes * (nodes - 1));
    } catch (error) {
      return 0;
    }
  }
}

module.exports = GraphAlgorithms;