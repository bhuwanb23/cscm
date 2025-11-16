"""
Supplier Network Anomaly Detection

Implements anomaly detection specifically for supplier networks.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any, Set
import logging
from datetime import datetime, timedelta
import pickle

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False
    nx = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SupplierNetworkDetector:
    """
    Supplier network anomaly detector.
    
    Detects anomalies in supplier relationships and performance.
    """
    
    def __init__(
        self,
        anomaly_threshold: float = 0.5,
        min_suppliers: int = 2
    ):
        """
        Initialize supplier network detector.
        
        Args:
            anomaly_threshold: Threshold for anomaly detection
            min_suppliers: Minimum number of suppliers for analysis
        """
        if not HAS_NETWORKX:
            raise ImportError("NetworkX is required for supplier network detection")
        
        self.anomaly_threshold = anomaly_threshold
        self.min_suppliers = min_suppliers
        
        self.supplier_graph: Optional[nx.DiGraph] = None
        self.supplier_data: Dict[int, Dict[str, Any]] = {}
        self.is_fitted = False
    
    def build_supplier_network(
        self,
        supplier_data: pd.DataFrame,
        relationship_data: Optional[pd.DataFrame] = None
    ):
        """
        Build supplier network from data.
        
        Args:
            supplier_data: DataFrame with supplier information
            relationship_data: Optional DataFrame with supplier relationships
        """
        logger.info(f"Building supplier network with {len(supplier_data)} suppliers")
        
        self.supplier_graph = nx.DiGraph()
        
        # Add suppliers as nodes
        for idx, row in supplier_data.iterrows():
            supplier_id = row.get('supplier_id', idx)
            self.supplier_graph.add_node(supplier_id)
            
            # Store supplier data
            self.supplier_data[supplier_id] = {
                'name': row.get('name', f'Supplier_{supplier_id}'),
                'location': row.get('location', ''),
                'lead_time': row.get('lead_time', 0),
                'reliability': row.get('reliability', 1.0),
                'cost': row.get('cost', 0.0),
                'quality_score': row.get('quality_score', 1.0)
            }
        
        # Add relationships if provided
        if relationship_data is not None:
            for idx, row in relationship_data.iterrows():
                source = row.get('source_supplier_id')
                target = row.get('target_supplier_id')
                if source and target:
                    self.supplier_graph.add_edge(source, target, **row.to_dict())
        
        logger.info(f"Supplier network built with {self.supplier_graph.number_of_nodes()} nodes")
    
    def compute_supplier_features(self) -> Dict[int, np.ndarray]:
        """
        Compute features for each supplier.
        
        Returns:
            Dictionary of supplier_id to feature vector
        """
        if self.supplier_graph is None:
            raise ValueError("Supplier network must be built first")
        
        features = {}
        
        for supplier_id in self.supplier_graph.nodes():
            supplier_info = self.supplier_data.get(supplier_id, {})
            
            # Basic features
            lead_time = supplier_info.get('lead_time', 0)
            reliability = supplier_info.get('reliability', 1.0)
            cost = supplier_info.get('cost', 0.0)
            quality_score = supplier_info.get('quality_score', 1.0)
            
            # Network features
            in_degree = self.supplier_graph.in_degree(supplier_id)
            out_degree = self.supplier_graph.out_degree(supplier_id)
            
            try:
                betweenness = nx.betweenness_centrality(self.supplier_graph)[supplier_id]
            except:
                betweenness = 0.0
            
            # Performance features
            avg_lead_time = np.mean([self.supplier_data.get(n, {}).get('lead_time', 0) 
                                    for n in self.supplier_graph.nodes()])
            avg_reliability = np.mean([self.supplier_data.get(n, {}).get('reliability', 1.0) 
                                      for n in self.supplier_graph.nodes()])
            
            # Anomaly indicators
            lead_time_anomaly = abs(lead_time - avg_lead_time) / (avg_lead_time + 1e-8)
            reliability_anomaly = abs(reliability - avg_reliability) / (avg_reliability + 1e-8)
            
            feature_vector = np.array([
                lead_time,
                reliability,
                cost,
                quality_score,
                in_degree,
                out_degree,
                betweenness,
                lead_time_anomaly,
                reliability_anomaly
            ])
            
            features[supplier_id] = feature_vector
        
        return features
    
    def detect_anomalies(
        self,
        method: str = 'statistical'
    ) -> Tuple[Dict[int, int], Dict[int, float], Dict[str, Any]]:
        """
        Detect anomalous suppliers.
        
        Args:
            method: Detection method
        
        Returns:
            Tuple of (predictions, scores, info_dict)
        """
        if self.supplier_graph is None:
            raise ValueError("Supplier network must be built first")
        
        # Compute features
        features = self.compute_supplier_features()
        
        # Convert to array
        supplier_ids = list(features.keys())
        feature_matrix = np.array([features[sid] for sid in supplier_ids])
        
        # Detect anomalies
        if method == 'statistical':
            # Use z-score
            mean_features = np.mean(feature_matrix, axis=0)
            std_features = np.std(feature_matrix, axis=0) + 1e-8
            
            z_scores = np.abs((feature_matrix - mean_features) / std_features)
            anomaly_scores = np.mean(z_scores, axis=1)
            
            predictions = {sid: -1 if score > self.anomaly_threshold else 1 
                          for sid, score in zip(supplier_ids, anomaly_scores)}
            scores = {sid: float(score) for sid, score in zip(supplier_ids, anomaly_scores)}
        
        else:
            from sklearn.ensemble import IsolationForest
            
            detector = IsolationForest(contamination=0.1, random_state=42)
            pred = detector.fit_predict(feature_matrix)
            anomaly_scores = -detector.score_samples(feature_matrix)
            
            predictions = {sid: int(pred[i]) for i, sid in enumerate(supplier_ids)}
            scores = {sid: float(anomaly_scores[i]) for i, sid in enumerate(supplier_ids)}
        
        # Get anomaly suppliers
        anomaly_suppliers = [sid for sid, pred in predictions.items() if pred == -1]
        
        info = {
            'num_anomalies': len(anomaly_suppliers),
            'anomaly_rate': len(anomaly_suppliers) / len(supplier_ids),
            'anomaly_suppliers': anomaly_suppliers,
            'num_suppliers': len(supplier_ids)
        }
        
        self.is_fitted = True
        
        return predictions, scores, info
    
    def get_risk_assessment(
        self,
        predictions: Dict[int, int],
        scores: Dict[int, float]
    ) -> Dict[int, Dict[str, Any]]:
        """
        Get risk assessment for suppliers.
        
        Args:
            predictions: Supplier predictions
            scores: Anomaly scores
        
        Returns:
            Dictionary of supplier_id to risk assessment
        """
        risk_assessments = {}
        
        for supplier_id in self.supplier_graph.nodes():
            supplier_info = self.supplier_data.get(supplier_id, {})
            is_anomaly = predictions.get(supplier_id, 1) == -1
            anomaly_score = scores.get(supplier_id, 0.0)
            
            # Risk factors
            risk_factors = []
            
            if is_anomaly:
                risk_factors.append('anomaly_detected')
            
            if supplier_info.get('reliability', 1.0) < 0.7:
                risk_factors.append('low_reliability')
            
            if supplier_info.get('lead_time', 0) > 30:
                risk_factors.append('high_lead_time')
            
            if supplier_info.get('quality_score', 1.0) < 0.8:
                risk_factors.append('low_quality')
            
            risk_level = 'high' if len(risk_factors) >= 2 else 'medium' if len(risk_factors) == 1 else 'low'
            
            risk_assessments[supplier_id] = {
                'is_anomaly': is_anomaly,
                'anomaly_score': anomaly_score,
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'supplier_info': supplier_info
            }
        
        return risk_assessments
    
    def save(self, filepath: str):
        """Save model to file."""
        model_data = {
            'supplier_graph': self.supplier_graph,
            'supplier_data': self.supplier_data,
            'anomaly_threshold': self.anomaly_threshold,
            'is_fitted': self.is_fitted
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    def load(self, filepath: str):
        """Load model from file."""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.supplier_graph = model_data['supplier_graph']
        self.supplier_data = model_data['supplier_data']
        self.anomaly_threshold = model_data['anomaly_threshold']
        self.is_fitted = model_data['is_fitted']
        
        logger.info(f"Model loaded from {filepath}")

