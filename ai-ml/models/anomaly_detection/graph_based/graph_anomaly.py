"""
Graph-Based Anomaly Detection

Implements graph-based methods for anomaly detection in network structures.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any, Set
import logging
from collections import defaultdict
import pickle

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False
    nx = None

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GraphAnomalyDetector:
    """
    Graph-based anomaly detector.
    
    Detects anomalies in graph structures using various graph metrics.
    """
    
    def __init__(
        self,
        anomaly_threshold: float = 0.5,
        use_centrality: bool = True,
        use_community: bool = True,
        use_embedding: bool = False
    ):
        """
        Initialize graph anomaly detector.
        
        Args:
            anomaly_threshold: Threshold for anomaly detection
            use_centrality: Use centrality-based features
            use_community: Use community-based features
            use_embedding: Use graph embedding features
        """
        if not HAS_NETWORKX:
            raise ImportError("NetworkX is required for graph anomaly detection")
        
        self.anomaly_threshold = anomaly_threshold
        self.use_centrality = use_centrality
        self.use_community = use_community
        self.use_embedding = use_embedding
        
        self.graph: Optional[nx.Graph] = None
        self.node_features: Dict[int, np.ndarray] = {}
        self.is_fitted = False
    
    def build_graph(
        self,
        edges: List[Tuple[int, int]],
        node_attributes: Optional[Dict[int, Dict[str, Any]]] = None,
        edge_weights: Optional[Dict[Tuple[int, int], float]] = None
    ):
        """
        Build graph from edges.
        
        Args:
            edges: List of (source, target) edges
            node_attributes: Optional node attributes
            edge_weights: Optional edge weights
        """
        logger.info(f"Building graph with {len(edges)} edges")
        
        self.graph = nx.Graph()
        
        # Add edges
        for edge in edges:
            if edge_weights and edge in edge_weights:
                self.graph.add_edge(edge[0], edge[1], weight=edge_weights[edge])
            else:
                self.graph.add_edge(edge[0], edge[1])
        
        # Add node attributes
        if node_attributes:
            for node, attrs in node_attributes.items():
                self.graph.nodes[node].update(attrs)
        
        logger.info(f"Graph built with {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges")
    
    def compute_node_features(self) -> Dict[int, np.ndarray]:
        """
        Compute node features for anomaly detection.
        
        Returns:
            Dictionary of node_id to feature vector
        """
        if self.graph is None:
            raise ValueError("Graph must be built before computing features")
        
        features = {}
        
        for node in self.graph.nodes():
            feature_list = []
            
            # Centrality features
            if self.use_centrality:
                degree = self.graph.degree(node)
                try:
                    betweenness = nx.betweenness_centrality(self.graph)[node]
                    closeness = nx.closeness_centrality(self.graph)[node]
                    eigenvector = nx.eigenvector_centrality(self.graph, max_iter=100)[node]
                except:
                    betweenness = 0.0
                    closeness = 0.0
                    eigenvector = 0.0
                
                feature_list.extend([degree, betweenness, closeness, eigenvector])
            
            # Community features
            if self.use_community:
                try:
                    communities = nx.community.greedy_modularity_communities(self.graph)
                    community_id = -1
                    for i, comm in enumerate(communities):
                        if node in comm:
                            community_id = i
                            break
                    community_size = len(communities[community_id]) if community_id >= 0 else 0
                except:
                    community_id = -1
                    community_size = 0
                
                feature_list.extend([community_id, community_size])
            
            # Local features
            neighbors = list(self.graph.neighbors(node))
            num_neighbors = len(neighbors)
            avg_neighbor_degree = np.mean([self.graph.degree(n) for n in neighbors]) if neighbors else 0.0
            
            feature_list.extend([num_neighbors, avg_neighbor_degree])
            
            features[node] = np.array(feature_list)
        
        self.node_features = features
        return features
    
    def detect_anomalies(
        self,
        method: str = 'statistical'  # 'statistical', 'isolation_forest', 'one_class_svm'
    ) -> Tuple[Dict[int, int], Dict[int, float], Dict[str, Any]]:
        """
        Detect anomalous nodes in the graph.
        
        Args:
            method: Detection method
        
        Returns:
            Tuple of (predictions, scores, info_dict)
        """
        if self.graph is None:
            raise ValueError("Graph must be built before detection")
        
        # Compute features
        if not self.node_features:
            self.compute_node_features()
        
        # Convert to array
        nodes = list(self.node_features.keys())
        feature_matrix = np.array([self.node_features[node] for node in nodes])
        
        # Detect anomalies
        if method == 'statistical':
            # Use z-score
            mean_features = np.mean(feature_matrix, axis=0)
            std_features = np.std(feature_matrix, axis=0) + 1e-8
            
            z_scores = np.abs((feature_matrix - mean_features) / std_features)
            anomaly_scores = np.mean(z_scores, axis=1)
            
            predictions = {node: -1 if score > self.anomaly_threshold else 1 
                          for node, score in zip(nodes, anomaly_scores)}
            scores = {node: float(score) for node, score in zip(nodes, anomaly_scores)}
        
        elif method == 'isolation_forest':
            from sklearn.ensemble import IsolationForest
            
            detector = IsolationForest(contamination=0.1, random_state=42)
            pred = detector.fit_predict(feature_matrix)
            anomaly_scores = -detector.score_samples(feature_matrix)
            
            predictions = {node: int(pred[i]) for i, node in enumerate(nodes)}
            scores = {node: float(anomaly_scores[i]) for i, node in enumerate(nodes)}
        
        elif method == 'one_class_svm':
            from sklearn.svm import OneClassSVM
            
            detector = OneClassSVM(nu=0.1)
            pred = detector.fit_predict(feature_matrix)
            decision_scores = detector.decision_function(feature_matrix)
            
            predictions = {node: int(pred[i]) for i, node in enumerate(nodes)}
            scores = {node: float(-decision_scores[i]) for i, node in enumerate(nodes)}
        
        else:
            raise ValueError(f"Unknown method: {method}")
        
        # Get anomaly nodes
        anomaly_nodes = [node for node, pred in predictions.items() if pred == -1]
        
        info = {
            'num_anomalies': len(anomaly_nodes),
            'anomaly_rate': len(anomaly_nodes) / len(nodes),
            'anomaly_nodes': anomaly_nodes,
            'num_nodes': len(nodes),
            'num_edges': self.graph.number_of_edges()
        }
        
        self.is_fitted = True
        
        return predictions, scores, info
    
    def get_anomalous_subgraphs(
        self,
        predictions: Dict[int, int],
        min_size: int = 2
    ) -> List[Set[int]]:
        """
        Extract anomalous subgraphs.
        
        Args:
            predictions: Node predictions
            min_size: Minimum subgraph size
        
        Returns:
            List of anomalous subgraphs (sets of nodes)
        """
        if self.graph is None:
            raise ValueError("Graph must be built")
        
        anomaly_nodes = [node for node, pred in predictions.items() if pred == -1]
        
        # Find connected components of anomalous nodes
        anomaly_subgraph = self.graph.subgraph(anomaly_nodes)
        subgraphs = list(nx.connected_components(anomaly_subgraph))
        
        # Filter by size
        subgraphs = [sg for sg in subgraphs if len(sg) >= min_size]
        
        return subgraphs
    
    def save(self, filepath: str):
        """Save model to file."""
        model_data = {
            'graph': self.graph,
            'node_features': self.node_features,
            'anomaly_threshold': self.anomaly_threshold,
            'use_centrality': self.use_centrality,
            'use_community': self.use_community,
            'use_embedding': self.use_embedding,
            'is_fitted': self.is_fitted
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    def load(self, filepath: str):
        """Load model from file."""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.graph = model_data['graph']
        self.node_features = model_data['node_features']
        self.anomaly_threshold = model_data['anomaly_threshold']
        self.use_centrality = model_data['use_centrality']
        self.use_community = model_data['use_community']
        self.use_embedding = model_data['use_embedding']
        self.is_fitted = model_data['is_fitted']
        
        logger.info(f"Model loaded from {filepath}")

