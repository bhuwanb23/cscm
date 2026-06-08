"""
Lightweight Policy Networks for Edge Deployment

This module implements lightweight policy network deployment for edge nodes
in multi-agent systems.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import logging
import pickle

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None
    optim = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LightweightPolicy(nn.Module):
    """Lightweight policy network for edge deployment."""
    
    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        hidden_dims: List[int] = [32, 32]
    ):
        """Initialize lightweight policy."""
        super(LightweightPolicy, self).__init__()
        
        layers = []
        input_dim = state_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        layers.append(nn.Linear(input_dim, action_dim))
        layers.append(nn.Tanh())  # Actions in [-1, 1]
        
        self.network = nn.Sequential(*layers)
    
    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        return self.network(state)


class EdgePolicyDeployment:
    """
    Edge policy deployment for multi-agent systems.
    
    Provides lightweight policy networks for deployment at edge nodes.
    """
    
    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        model_type: str = 'lightweight',  # 'lightweight', 'quantized', 'pruned'
        device: Optional[str] = None
    ):
        """
        Initialize edge policy deployment.
        
        Args:
            state_dim: Dimension of state space
            action_dim: Dimension of action space
            model_type: Type of model deployment
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for edge policy deployment")
        
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.model_type = model_type
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Create lightweight policy
        self.policy = LightweightPolicy(state_dim, action_dim).to(self.device)
        self.policy_loaded = False
    
    def load_policy(self, filepath: str):
        """
        Load policy from file.
        
        Args:
            filepath: Path to policy file
        """
        logger.info(f"Loading policy from {filepath}")
        
        if self.model_type == 'lightweight':
            checkpoint = torch.load(filepath, map_location=self.device)
            self.policy.load_state_dict(checkpoint['policy_state_dict'])
        elif self.model_type == 'quantized':
            # Load quantized model
            self.policy = torch.jit.load(filepath, map_location=self.device)
        elif self.model_type == 'pruned':
            # Load pruned model
            checkpoint = torch.load(filepath, map_location=self.device)
            self.policy.load_state_dict(checkpoint['policy_state_dict'])
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
        
        self.policy_loaded = True
        logger.info("Policy loaded successfully")
    
    def predict(
        self,
        state: np.ndarray,
        deterministic: bool = True
    ) -> np.ndarray:
        """
        Predict action from state.
        
        Args:
            state: Current state
            deterministic: Whether to use deterministic policy
        
        Returns:
            Action array
        """
        if not self.policy_loaded:
            raise ValueError("Policy must be loaded before prediction")
        
        self.policy.eval()
        
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            action = self.policy(state_tensor).cpu().numpy()[0]
        
        if not deterministic:
            # Add noise for exploration
            noise = np.random.normal(0, 0.1, size=action.shape)
            action = np.clip(action + noise, -1, 1)
        
        return action
    
    def batch_predict(
        self,
        states: List[np.ndarray],
        deterministic: bool = True
    ) -> List[np.ndarray]:
        """
        Batch prediction.
        
        Args:
            states: List of states
            deterministic: Whether to use deterministic policy
        
        Returns:
            List of actions
        """
        return [self.predict(state, deterministic=deterministic) for state in states]
    
    def optimize_for_edge(
        self,
        original_policy_path: str,
        output_path: str,
        quantization: bool = True,
        pruning: bool = False,
        target_size_mb: float = 1.0
    ):
        """
        Optimize policy for edge deployment.
        
        Args:
            original_policy_path: Path to original policy
            output_path: Path to save optimized policy
            quantization: Whether to quantize
            pruning: Whether to prune
            target_size_mb: Target model size in MB
        """
        logger.info(f"Optimizing policy for edge deployment")
        
        # Load original policy
        checkpoint = torch.load(original_policy_path, map_location=self.device)
        self.policy.load_state_dict(checkpoint['policy_state_dict'])
        
        # Quantization
        if quantization:
            logger.info("Quantizing policy...")
            # Convert to quantized model
            self.policy.eval()
            # Quantization would be implemented here
            # For now, just save the model
        
        # Pruning
        if pruning:
            logger.info("Pruning policy...")
            # Prune model
            # Pruning would be implemented here
        
        # Save optimized policy
        torch.save({
            'policy_state_dict': self.policy.state_dict(),
            'state_dim': self.state_dim,
            'action_dim': self.action_dim,
            'model_type': self.model_type
        }, output_path)
        
        logger.info(f"Optimized policy saved to {output_path}")
    
    def get_model_size(self) -> float:
        """
        Get model size in MB.
        
        Returns:
            Model size in megabytes
        """
        if not self.policy_loaded:
            return 0.0
        
        # Calculate model size
        param_size = sum(p.numel() * p.element_size() for p in self.policy.parameters())
        buffer_size = sum(b.numel() * b.element_size() for b in self.policy.buffers())
        total_size = param_size + buffer_size
        
        return total_size / (1024 * 1024)  # Convert to MB
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get model information.
        
        Returns:
            Dictionary of model information
        """
        if not self.policy_loaded:
            return {
                'loaded': False,
                'model_type': self.model_type,
                'state_dim': self.state_dim,
                'action_dim': self.action_dim
            }
        
        num_params = sum(p.numel() for p in self.policy.parameters())
        model_size = self.get_model_size()
        
        return {
            'loaded': True,
            'model_type': self.model_type,
            'state_dim': self.state_dim,
            'action_dim': self.action_dim,
            'num_parameters': num_params,
            'model_size_mb': model_size
        }

