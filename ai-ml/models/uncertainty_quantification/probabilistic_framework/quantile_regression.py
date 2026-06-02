"""
Generic quantile regression wrapper for PyTorch models.

Wraps any PyTorch nn.Module to output predictions at multiple quantile levels
using pinball loss. Can be used standalone or as a replacement head for
existing forecasting models.
"""

import torch
import torch.nn as nn
import numpy as np
from typing import Optional, List, Union


def pinball_loss(pred: torch.Tensor, target: torch.Tensor, quantile: float) -> torch.Tensor:
    """
    Pinball / quantile loss function.

    Args:
        pred: Predicted quantile values (batch_size, ...).
        target: True target values (batch_size, ...).
        quantile: Quantile level (0-1).

    Returns:
        Scalar loss.
    """
    error = target - pred
    loss = torch.max(quantile * error, (quantile - 1) * error)
    return loss.mean()


class QuantileRegressionHead(nn.Module):
    """
    Drop-in replacement output head that produces one output per quantile.

    Takes the hidden representation from a base model and projects it
    to `len(quantiles)` outputs.
    """

    def __init__(self, hidden_dim: int, quantiles: List[float]):
        super().__init__()
        self.quantiles = sorted(quantiles)
        self.num_quantiles = len(quantiles)
        self.projection = nn.Linear(hidden_dim, self.num_quantiles)

    def forward(self, h: torch.Tensor) -> torch.Tensor:
        return self.projection(h)


class QuantileRegressionWrapper:
    """
    Wraps a PyTorch model to perform quantile regression.

    The wrapper adds a quantile output head and trains with pinball loss.
    Supports both training from scratch and converting a pre-trained model.

    Usage:
        base_model = LSTMModel(input_dim=10, hidden_dim=64, output_dim=1)
        qr_model = QuantileRegressionWrapper(
            base_model,
            hidden_dim=64,
            quantiles=[0.1, 0.5, 0.9]
        )
        qr_model.fit(X_train, y_train, epochs=50)
        predictions = qr_model.predict(X_test)
    """

    def __init__(
        self,
        base_model: nn.Module,
        hidden_dim: int,
        quantiles: Optional[List[float]] = None,
        lr: float = 1e-3,
        device: Optional[torch.device] = None,
    ):
        self.quantiles = quantiles or [0.1, 0.25, 0.5, 0.75, 0.9]
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.lr = lr

        self.base_model = base_model.to(self.device)
        self.head = QuantileRegressionHead(hidden_dim, self.quantiles).to(self.device)
        self.optimizer = torch.optim.Adam(
            list(self.base_model.parameters()) + list(self.head.parameters()),
            lr=self.lr,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if hasattr(self.base_model, 'get_hidden'):
            h = self.base_model.get_hidden(x)
        elif hasattr(self.base_model, 'extract_features'):
            h = self.base_model.extract_features(x)
        elif hasattr(self.base_model, 'fc'):
            h = self.base_model.fc(x)
        else:
            with torch.no_grad():
                features = self.base_model(x)
            h = features
        return self.head(h)

    def compute_loss(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        target_expanded = target.unsqueeze(-1).expand_as(pred)
        total_loss = 0.0
        for i, q in enumerate(self.quantiles):
            total_loss = total_loss + pinball_loss(pred[:, i], target_expanded[:, i], q)
        return total_loss / len(self.quantiles)

    def fit(
        self,
        X: Union[np.ndarray, torch.Tensor],
        y: Union[np.ndarray, torch.Tensor],
        epochs: int = 100,
        batch_size: int = 32,
        verbose: bool = True,
    ):
        if isinstance(X, np.ndarray):
            X = torch.FloatTensor(X)
        if isinstance(y, np.ndarray):
            y = torch.FloatTensor(y)

        dataset = torch.utils.data.TensorDataset(X, y)
        loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

        self.base_model.train()
        self.head.train()

        for epoch in range(epochs):
            total_loss = 0.0
            for batch_X, batch_y in loader:
                batch_X, batch_y = batch_X.to(self.device), batch_y.to(self.device)
                self.optimizer.zero_grad()
                pred = self.forward(batch_X)
                loss = self.compute_loss(pred, batch_y)
                loss.backward()
                self.optimizer.step()
                total_loss += loss.item()

            if verbose and (epoch + 1) % 10 == 0:
                print(f"Epoch {epoch + 1}/{epochs}, Loss: {total_loss:.4f}")

    @torch.no_grad()
    def predict(self, X: Union[np.ndarray, torch.Tensor]) -> dict:
        if isinstance(X, np.ndarray):
            X = torch.FloatTensor(X)

        self.base_model.eval()
        self.head.eval()
        X = X.to(self.device)
        raw = self.forward(X).cpu().numpy()

        result = {}
        for i, q in enumerate(self.quantiles):
            result[f'q_{int(q * 100):02d}'] = raw[:, i]
        result['mean'] = raw.mean(axis=1)
        result['lower'] = raw[:, 0]
        result['upper'] = raw[:, -1]
        return result
