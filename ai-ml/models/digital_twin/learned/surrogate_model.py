"""
Neural surrogate model to approximate slow simulators.
"""

from __future__ import annotations

import numpy as np
from typing import Optional

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:  # pragma: no cover - optional dependency
    HAS_TORCH = False
    torch = None
    nn = None


class NeuralSurrogateModel:
    def __init__(self, input_dim: int, hidden_dim: int = 32, output_dim: int = 1, device: Optional[str] = None):
        if not HAS_TORCH:
            raise ImportError("PyTorch required for NeuralSurrogateModel")
        self.device = torch.device(device or ('cuda' if torch.cuda.is_available() else 'cpu'))
        self.model = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        ).to(self.device)
        self.loss_fn = nn.MSELoss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=1e-3)

    def fit(self, X: np.ndarray, y: np.ndarray, epochs: int = 100):
        self.model.train()
        X_tensor = torch.tensor(X, dtype=torch.float32, device=self.device)
        y_tensor = torch.tensor(y, dtype=torch.float32, device=self.device)
        for _ in range(epochs):
            preds = self.model(X_tensor)
            loss = self.loss_fn(preds, y_tensor)
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()

    def predict(self, X: np.ndarray) -> np.ndarray:
        self.model.eval()
        with torch.no_grad():
            X_tensor = torch.tensor(X, dtype=torch.float32, device=self.device)
            preds = self.model(X_tensor)
        return preds.cpu().numpy()
