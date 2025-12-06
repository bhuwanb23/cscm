import logging
from typing import List, Optional
import sys
import os
from datetime import datetime

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from ..routers.nlp import NLPQueryRequest, NLPQueryResponse, NLPSummaryRequest, NLPSummaryResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NLPService:
    """
    Service class for NLP operations
    """
    
    @staticmethod
    def process_query(request: NLPQueryRequest) -> NLPQueryResponse:
        """
        Process a natural language query
        
        Args:
            request: NLPQueryRequest with query text
            
        Returns:
            NLPQueryResponse with processed query results
        """
        try:
            logger.info("Processing natural language query")
            
            # Validate input parameters
            if not request.query:
                raise ValueError("Query text is required")
            if request.max_tokens <= 0:
                raise ValueError("Max tokens must be positive")
            
            # This would integrate with the actual NLP model
            # For now, returning mock data
            response = NLPQueryResponse(
                query=request.query,
                intent="DEMAND_FORECAST",
                entities=[
                    {"type": "PRODUCT", "value": "SKU123", "confidence": 0.95},
                    {"type": "LOCATION", "value": "STORE456", "confidence": 0.87},
                    {"type": "TIMEFRAME", "value": "next_week", "confidence": 0.92}
                ],
                response="Based on historical data, SKU123 is expected to have a demand of approximately 150 units at STORE456 for next week.",
                confidence=0.85,
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info("Successfully processed natural language query")
            return response
        except Exception as e:
            logger.error(f"Error processing natural language query: {str(e)}")
            raise
    
    @staticmethod
    def generate_summary(request: NLPSummaryRequest) -> NLPSummaryResponse:
        """
        Generate a summary for a document
        
        Args:
            request: NLPSummaryRequest with document ID
            
        Returns:
            NLPSummaryResponse with document summary
        """
        try:
            logger.info(f"Generating summary for document ID: {request.document_id}")
            
            # This would integrate with the actual summarization model
            # For now, returning mock data
            response = NLPSummaryResponse(
                document_id=request.document_id,
                summary="This document contains sales data for Q4 2023. Key highlights include a 15% increase in revenue compared to Q3, strong performance in the electronics category, and improved supply chain efficiency metrics.",
                key_points=[
                    "15% revenue increase vs. previous quarter",
                    "Electronics category outperformed expectations",
                    "Supply chain efficiency improved by 8%"
                ],
                sentiment="POSITIVE",
                topics=["SALES", "REVENUE", "SUPPLY_CHAIN"],
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully generated summary for document ID: {request.document_id}")
            return response
        except Exception as e:
            logger.error(f"Error generating document summary: {str(e)}")
            raise