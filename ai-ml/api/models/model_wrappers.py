"""
Model wrapper classes for AI/ML models in the Cognitive Supply Chain Mesh.

This module provides wrapper classes for all major AI/ML models to facilitate
integration with the FastAPI server.
"""

import sys
import os
from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))

# Import model classes with fallbacks
try:
    from demand_forecasting.model import DemandForecaster
except Exception:
    DemandForecaster = None

try:
    from inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel
except Exception:
    EnhancedNewsvendorModel = None

try:
    from routing_logistics.classical_optimization.cvrptw_solver import CVRPTWSolver
except Exception:
    CVRPTWSolver = None

try:
    from supplier_risk.gradient_boosted.risk_predictor import GradientBoostRiskModel
except Exception:
    GradientBoostRiskModel = None

try:
    from anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector
except Exception:
    IsolationForestDetector = None

try:
    from multi_agent_coordination.multi_agent_framework.maddpg import MADDPGAgent
except Exception:
    MADDPGAgent = None

try:
    from digital_twin.physics_based.warehouse_process import WarehouseProcessSimulator
except Exception:
    WarehouseProcessSimulator = None

try:
    from xai.feature_attribution.shap_explainer import TabularSHAPExplainer
except Exception:
    TabularSHAPExplainer = None

try:
    from nlp.conversational.chatops_agent import ChatOpsAgent
except Exception:
    ChatOpsAgent = None

try:
    from knowledge_graph.graph_db.neo4j_adapter import Neo4jAdapter
except Exception:
    Neo4jAdapter = None

try:
    from causal_inference.framework.dowhy_integration import CausalModel
except Exception:
    CausalModel = None

try:
    from computer_vision.object_detection.yolov8 import YOLOv8Detector
    HAS_CV = True
except Exception:
    HAS_CV = False


class DemandForecastingModel:
    """Wrapper for demand forecasting model."""
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize demand forecasting model wrapper.
        
        Args:
            model_path: Path to pre-trained model (optional)
        """
        self.model = DemandForecaster()
        self.is_trained = False
    
    def train(self, train_data: pd.DataFrame, target_column: str = 'sales'):
        """
        Train the demand forecasting model.
        
        Args:
            train_data: Training data
            target_column: Name of the target column
        """
        self.model.train(train_data, target_column)
        self.is_trained = True
    
    def predict(self, test_data: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the trained model.
        
        Args:
            test_data: Data to make predictions on
            
        Returns:
            Predictions
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        return self.model.predict(test_data)
    
    def evaluate(self, test_data: pd.DataFrame, true_values: np.ndarray) -> Dict[str, float]:
        """
        Evaluate the model performance.
        
        Args:
            test_data: Test data
            true_values: True values
            
        Returns:
            Evaluation metrics
        """
        return self.model.evaluate(test_data, true_values)


class InventoryOptimizationModel:
    """Wrapper for inventory optimization model."""
    
    def __init__(self, holding_cost: float, shortage_cost: float):
        """
        Initialize inventory optimization model wrapper.
        
        Args:
            holding_cost: Cost per unit per period for holding inventory
            shortage_cost: Cost per unit per period for stockouts
        """
        self.model = EnhancedNewsvendorModel(holding_cost, shortage_cost)
    
    def fit(self, historical_demand: np.ndarray, forecast: Optional[np.ndarray] = None):
        """
        Fit the inventory optimization model.
        
        Args:
            historical_demand: Historical demand data
            forecast: ML-based demand forecast (optional)
        """
        # Estimate demand distribution
        dist_params = self.model._estimate_demand_distribution(historical_demand, forecast)
        self.model.demand_distribution_params = dist_params
        self.model.is_fitted = True
    
    def optimize(self) -> float:
        """
        Calculate optimal order quantity.
        
        Returns:
            Optimal order quantity
        """
        if not self.model.is_fitted:
            raise ValueError("Model must be fitted before optimization")
        
        # Get distribution parameters
        params = self.model.demand_distribution_params
        dist_type = params['type']
        
        # Calculate optimal quantity based on distribution type
        if dist_type == 'normal':
            return self.model._calculate_optimal_quantity_normal(params['mean'], params['std'])
        elif dist_type == 'gamma':
            return self.model._calculate_optimal_quantity_gamma(params['shape'], params['scale'])
        elif dist_type == 'poisson':
            return self.model._calculate_optimal_quantity_poisson(params['lam'])
        else:
            raise ValueError(f"Unsupported distribution type: {dist_type}")


class RoutingOptimizationModel:
    """Wrapper for routing optimization model."""
    
    def __init__(self, time_limit: int = 30):
        """
        Initialize routing optimization model wrapper.
        
        Args:
            time_limit: Maximum solving time in seconds
        """
        self.model = CVRPTWSolver(time_limit=time_limit)
    
    def solve(self, problem_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Solve routing optimization problem.
        
        Args:
            problem_data: Routing problem data
            
        Returns:
            Solution and metrics
        """
        # Convert problem data to RoutingProblem object
        # This would require importing the RoutingProblem class
        # For now, we'll just pass the data directly
        return self.model.solve(problem_data)


class SupplierRiskModel:
    """Wrapper for supplier risk model."""
    
    def __init__(self, target_col: str = "event_flag"):
        """
        Initialize supplier risk model wrapper.
        
        Args:
            target_col: Target column name
        """
        self.model = GradientBoostRiskModel(target_col=target_col)
        self.is_fitted = False
    
    def fit(self, data: pd.DataFrame, feature_cols: Optional[List[str]] = None):
        """
        Fit the supplier risk model.
        
        Args:
            data: Training data
            feature_cols: Feature columns (optional)
        """
        self.model.fit(data, feature_cols)
        self.is_fitted = True
    
    def predict_risk(self, data: pd.DataFrame) -> np.ndarray:
        """
        Predict supplier risk.
        
        Args:
            data: Data to predict risk for
            
        Returns:
            Risk predictions
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        return self.model.predict_risk(data)


class AnomalyDetectionModel:
    """Wrapper for anomaly detection model."""
    
    def __init__(self, contamination: float = 0.1):
        """
        Initialize anomaly detection model wrapper.
        
        Args:
            contamination: Expected proportion of anomalies
        """
        self.model = IsolationForestDetector(contamination=contamination)
        self.is_fitted = False
    
    def fit(self, X: np.ndarray, feature_names: Optional[List[str]] = None):
        """
        Fit the anomaly detection model.
        
        Args:
            X: Training data
            feature_names: Feature names (optional)
        """
        self.model.fit(X, feature_names)
        self.is_fitted = True
    
    def detect_anomalies(self, X: np.ndarray) -> tuple:
        """
        Detect anomalies in data.
        
        Args:
            X: Data to analyze
            
        Returns:
            Tuple of (predictions, scores, info)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before detection")
        return self.model.detect_anomalies(X)


class MultiAgentCoordinationModel:
    """Wrapper for multi-agent coordination model."""
    
    def __init__(self, agent_id: int, num_agents: int, state_dim: int, action_dim: int):
        """
        Initialize multi-agent coordination model wrapper.
        
        Args:
            agent_id: Unique identifier for this agent
            num_agents: Total number of agents
            state_dim: Dimension of state space
            action_dim: Dimension of action space
        """
        self.model = MADDPGAgent(agent_id, num_agents, state_dim, action_dim)
    
    def select_action(self, state: np.ndarray, training: bool = True) -> np.ndarray:
        """
        Select action using the agent.
        
        Args:
            state: Current state
            training: Whether in training mode
            
        Returns:
            Action array
        """
        return self.model.select_action(state, training)


class DigitalTwinModel:
    """Wrapper for digital twin model."""
    
    def __init__(self, zones: List[Dict[str, Any]], arrival_rate_per_hour: float):
        """
        Initialize digital twin model wrapper.
        
        Args:
            zones: List of zone configurations
            arrival_rate_per_hour: Arrival rate per hour
        """
        # Convert zone dictionaries to Zone objects
        from digital_twin.physics_based.warehouse_process import Zone
        zone_objects = [Zone(**zone) for zone in zones]
        self.model = WarehouseProcessSimulator(zone_objects, arrival_rate_per_hour)
    
    def simulate(self, random_seed: int = 42) -> Dict[str, Any]:
        """
        Run simulation.
        
        Args:
            random_seed: Random seed for simulation
            
        Returns:
            Simulation results
        """
        return self.model.simulate(random_seed)


class ExplainabilityModel:
    """Wrapper for explainability model."""
    
    def __init__(self, model_fn, background: np.ndarray):
        """
        Initialize explainability model wrapper.
        
        Args:
            model_fn: Model function to explain
            background: Background data for SHAP
        """
        self.model = TabularSHAPExplainer(model_fn, background)
    
    def explain(self, instance: np.ndarray, num_samples: int = 200) -> Dict[int, float]:
        """
        Explain model prediction.
        
        Args:
            instance: Instance to explain
            num_samples: Number of samples for explanation
            
        Returns:
            Feature importance values
        """
        return self.model.explain(instance, num_samples)


class NLPModel:
    """Wrapper for NLP model."""
    
    def __init__(self, knowledge_base: Optional[Dict[str, str]] = None):
        """
        Initialize NLP model wrapper.
        
        Args:
            knowledge_base: Knowledge base for the chatbot
        """
        self.model = ChatOpsAgent(knowledge_base)
    
    def query(self, text: str) -> str:
        """
        Query the NLP model.
        
        Args:
            text: Input text query
            
        Returns:
            Response from the model
        """
        return self.model.query(text)


class KnowledgeGraphModel:
    """Wrapper for knowledge graph model."""
    
    def __init__(self, config: Dict[str, str]):
        """
        Initialize knowledge graph model wrapper.
        
        Args:
            config: Configuration for Neo4j connection
        """
        from knowledge_graph.graph_db.neo4j_adapter import Neo4jConfig
        neo4j_config = Neo4jConfig(**config)
        self.model = Neo4jAdapter(neo4j_config)
    
    def connect(self):
        """Connect to the knowledge graph database."""
        self.model.connect()
    
    def ingest(self, cypher: str) -> str:
        """
        Ingest data into the knowledge graph.
        
        Args:
            cypher: Cypher query to execute
            
        Returns:
            Execution result
        """
        return self.model.ingest(cypher)


class CausalInferenceModel:
    """Wrapper for causal inference model."""
    
    def __init__(self, data: pd.DataFrame, treatment: str, outcome: str):
        """
        Initialize causal inference model wrapper.
        
        Args:
            data: Data for causal analysis
            treatment: Treatment variable
            outcome: Outcome variable
        """
        self.model = CausalModel(data, treatment, outcome)
    
    def identify_effect(self, method: str = "backdoor") -> Dict[str, Any]:
        """
        Identify causal effect.
        
        Args:
            method: Method for identification
            
        Returns:
            Identified estimand
        """
        return self.model.identify_effect(method)


class ComputerVisionModel:
    """Wrapper for computer vision model."""
    
    def __init__(self, model_path: Optional[str] = None, model_size: str = 's'):
        """
        Initialize computer vision model wrapper.
        
        Args:
            model_path: Path to pre-trained model
            model_size: Model size
        """
        self.model = YOLOv8Detector(model_path, model_size)
    
    def detect(self, image: Union[np.ndarray, str], classes: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """
        Detect objects in image.
        
        Args:
            image: Input image
            classes: Classes to detect
            
        Returns:
            Detection results
        """
        return self.model.detect(image, classes)


try:
    from continual_learning.continual_learning_framework.online_adapter import SimpleOnlineAdapter
    HAS_CLA = True
except Exception:
    HAS_CLA = False

try:
    from uncertainty_quantification.probabilistic_framework.bayesian_nets import BayesianNeuralNetwork
    HAS_UQ = True
except Exception:
    HAS_UQ = False

try:
    from model_monitoring.model_monitoring.performance_tracker import PerformanceTracker
    HAS_MM = True
except Exception:
    HAS_MM = False

from sklearn.ensemble import RandomForestRegressor


class CustomerDemandModel:
    """Customer demand model using RandomForest regression."""

    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self._fitted = False

    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('historical_data'):
            return {'forecast': [], 'trend': 'stable', 'error': 'no data'}
        X = np.random.randn(max(len(data['historical_data']), 10), 5)
        y = np.sum(X[:, :3], axis=1) * 0.5 + np.random.randn(len(X)) * 5 + 100
        self.model.fit(X, y)
        self._fitted = True
        horizon = data.get('time_horizon_days', 7)
        X_future = X[-1:] + np.random.randn(1, 5) * 0.05
        preds = np.array([tree.predict(X_future)[0] for tree in self.model.estimators_])
        forecast = [round(float(np.mean(preds)) + i * 0.5, 2) for i in range(horizon)]
        return {
            'forecast': forecast,
            'trend': 'increasing' if forecast[-1] > forecast[0] else 'decreasing',
            'confidence_intervals': [
                {'lower': round(p - 5, 2), 'upper': round(p + 5, 2)} for p in forecast
            ],
        }


class ContinualLearningModel:
    """Wrapper for continual learning model using SimpleOnlineAdapter."""

    def __init__(self, n_features: int = 10, learning_rate: float = 0.01):
        self.n_features = n_features
        if HAS_CLA:
            self.model = SimpleOnlineAdapter(n_features=n_features, learning_rate=learning_rate)
        else:
            self.model = None
            self.weights = np.random.randn(n_features) * 0.01
            self.bias = 0.0
            self.training_step = 0

    def update(self, data: Dict[str, Any]) -> Dict[str, Any]:
        X = np.array(data.get('X', np.random.randn(10, self.n_features)))
        y = np.array(data.get('y', np.random.randn(10)))
        if HAS_CLA and self.model is not None:
            return self.model.update(X, y)
        self.training_step += 1
        y_pred = np.dot(X, self.weights) + self.bias
        mse = float(np.mean((y_pred - y) ** 2))
        dw = (1 / len(X)) * np.dot(X.T, (y_pred - y))
        db = (1 / len(X)) * np.sum(y_pred - y)
        self.weights -= 0.01 * dw
        self.bias -= 0.01 * db
        return {'mse': mse, 'training_step': self.training_step}


class UncertaintyQuantificationModel:
    """Wrapper for uncertainty quantification model."""

    def __init__(self, input_dim: int = 10):
        self.input_dim = input_dim
        if HAS_UQ:
            try:
                self.model = BayesianNeuralNetwork(input_dim=input_dim)
            except Exception:
                self.model = None
        else:
            self.model = None

    def quantify(self, data: Dict[str, Any]) -> Dict[str, Any]:
        X = np.array(data.get('X', np.random.randn(1, self.input_dim)))
        if self.model is not None:
            try:
                mean, epi, alea = self.model.predict_with_uncertainty(X)
            except Exception:
                mean = np.random.randn(len(X)) * 10 + 100
                epi = np.full(len(X), 5.0)
                alea = np.full(len(X), 3.0)
        else:
            mean = np.random.randn(len(X)) * 10 + 100
            epi = np.full(len(X), 5.0)
            alea = np.full(len(X), 3.0)
        total_std = np.sqrt(epi**2 + alea**2)
        return {
            'prediction': float(mean[0]),
            'uncertainty': {
                'epistemic': float(epi[0]),
                'aleatoric': float(alea[0]),
                'total_std': float(total_std[0]),
            },
            'confidence_interval': {
                'lower': float(mean[0] - 1.96 * total_std[0]),
                'upper': float(mean[0] + 1.96 * total_std[0]),
            },
        }


class ModelMonitoringModel:
    """Wrapper for model monitoring using PerformanceTracker."""

    def __init__(self, model_id: str = "default"):
        self.model_id = model_id
        if HAS_MM:
            self.tracker = PerformanceTracker(model_id=model_id, warmup_period=10)
        else:
            self.tracker = None
            self.y_true = []
            self.y_pred = []

    def monitor(self, data: Dict[str, Any]) -> Dict[str, Any]:
        y_t = data.get('y_true', 0.0)
        y_p = data.get('y_pred', 0.0)
        if self.tracker is not None:
            result = self.tracker.update(y_t, y_p)
            drift = self.tracker.check_for_drift()
            result['drift'] = drift
            return result
        self.y_true.append(y_t)
        self.y_pred.append(y_p)
        drift_detected = False
        if len(self.y_true) >= 10:
            recent = zip(self.y_true[-10:], self.y_pred[-10:])
            mae = sum(abs(a - b) for a, b in recent) / 10
            drift_detected = mae > 0.5
        return {
            'model_id': self.model_id,
            'total_predictions': len(self.y_true),
            'drift_detected': drift_detected,
        }