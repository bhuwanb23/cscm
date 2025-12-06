import logging
from typing import List, Optional
import sys
import os
from datetime import datetime

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from ..routers.knowledge_graph import KGQueryRequest, KGQueryResponse, KGSimilarityRequest, KGSimilarityResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KnowledgeGraphService:
    """
    Service class for knowledge graph operations
    """
    
    @staticmethod
    def query_knowledge_graph(request: KGQueryRequest) -> KGQueryResponse:
        """
        Query the knowledge graph with natural language or structured queries
        
        Args:
            request: KGQueryRequest with query parameters
            
        Returns:
            KGQueryResponse with query results
        """
        try:
            logger.info(f"Querying knowledge graph: {request.query}")
            
            # Validate input parameters
            if not request.query:
                raise ValueError("Query text is required")
            if request.max_results <= 0:
                raise ValueError("Max results must be positive")
            
            # This would integrate with the actual knowledge graph database
            # For now, returning mock data
            response = KGQueryResponse(
                query=request.query,
                results=[
                    {"entity": "supplier_123", "type": "Supplier", "attributes": {"location": "US", "rating": 4.5}},
                    {"entity": "product_456", "type": "Product", "attributes": {"category": "Electronics", "price": 299.99}}
                ],
                entity_count=1250,
                relationship_count=3500,
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info("Successfully queried knowledge graph")
            return response
        except Exception as e:
            logger.error(f"Error querying knowledge graph: {str(e)}")
            raise
    
    @staticmethod
    def find_similar_entities(request: KGSimilarityRequest) -> KGSimilarityResponse:
        """
        Find similar entities in the knowledge graph
        
        Args:
            request: KGSimilarityRequest with entity ID and type
            
        Returns:
            KGSimilarityResponse with similar entities
        """
        try:
            logger.info(f"Finding similar entities for: {request.entity_id}")
            
            # Validate input parameters
            if not request.entity_id:
                raise ValueError("Entity ID is required")
            if not request.entity_type:
                raise ValueError("Entity type is required")
            if request.top_k <= 0:
                raise ValueError("Top K must be positive")
            
            # This would integrate with the actual similarity search
            # For now, returning mock data
            response = KGSimilarityResponse(
                entity_id=request.entity_id,
                entity_type=request.entity_type,
                similar_entities=[
                    {"id": "supplier_124", "type": "Supplier", "similarity_score": 0.92},
                    {"id": "supplier_125", "type": "Supplier", "similarity_score": 0.87}
                ],
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully found similar entities for: {request.entity_id}")
            return response
        except Exception as e:
            logger.error(f"Error finding similar entities: {str(e)}")
            raise