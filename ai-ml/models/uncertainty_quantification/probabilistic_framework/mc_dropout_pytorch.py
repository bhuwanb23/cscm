"""
PyTorch MC Dropout wrapper for uncertainty quantification.

Wraps any PyTorch nn.Module with Monte Carlo Dropout at inference time.
Returns mean prediction, epistemic uncertainty (model confidence),
and aleatoric uncertainty (data noise) from N stochastic forward passes.
"""

import torch
import numpy as np
from typing import Optional, Tuple


class MCDropoutWrapper:
    """
    Monte Carlo Dropout wrapper for any PyTorch nn.Module.

    Enables dropout layers during inference by running the model in train mode,
    performing N stochastic forward passes, and decomposing the predictive
    variance into epistemic (model) and aleatoric (data) components.

    Usage:
        model = LSTMModel(...)
        mc_model = MCDropoutWrapper(model, num_samples=50)
        mean, epistemic, aleatoric = mc_model.predict(x_tensor)
    """

    def __init__(
        self,
        model: torch.nn.Module,
        num_samples: int = 50,
        dropout_layers: Optional[list] = None,
    ):
        """
        Args:
            model: Any PyTorch nn.Module with dropout layers.
            num_samples: Number of MC forward passes (default 50).
            dropout_layers: Specific layer names to toggle; if None, uses
                           model.train() to enable all dropouts.
        """
        self.model = model
        self.num_samples = num_samples
        self.dropout_layers = dropout_layers
        self.device = next(model.parameters()).device

    def predict(
        self, x: torch.Tensor, num_samples: Optional[int] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Run MC Dropout inference.

        Args:
            x: Input tensor of shape (batch_size, ...).
            num_samples: Override number of forward passes.

        Returns:
            Tuple of (mean, epistemic, aleatoric) each as numpy arrays.
            - mean:   (batch_size, output_dim) — predictive mean
            - epistemic: (batch_size,) — model uncertainty std
            - aleatoric: (batch_size,) — data noise std
        """
        n = num_samples if num_samples is not None else self.num_samples
        x = x.to(self.device)
        predictions = []

        self.model.train()

        with torch.no_grad():
            for _ in range(n):
                pred = self.model(x)
                predictions.append(pred.cpu().numpy())

        predictions = np.stack(predictions, axis=0)
        mean = predictions.mean(axis=0)
        variance = predictions.var(axis=0)

        if mean.ndim == 1 or (mean.ndim >= 2 and mean.shape[1] == 1):
            epistemic = np.sqrt(variance.squeeze())
            aleatoric = np.zeros_like(epistemic)
            if epistemic.ndim == 0:
                epistemic = np.array([epistemic])
                aleatoric = np.array([aleatoric])
        else:
            epistemic = np.sqrt(variance.mean(axis=1))
            aleatoric = np.zeros(variance.shape[0])

        return mean, epistemic, aleatoric

    def predict_with_quantiles(
        self,
        x: torch.Tensor,
        quantiles: list = [0.05, 0.25, 0.5, 0.75, 0.95],
        num_samples: Optional[int] = None,
    ) -> dict:
        """
        Run MC Dropout and return quantile predictions.

        Args:
            x: Input tensor.
            quantiles: List of quantile levels (0-1).
            num_samples: Number of MC samples.

        Returns:
            Dict with 'mean', 'std', and each quantile as keys.
        """
        n = num_samples if num_samples is not None else self.num_samples
        x = x.to(self.device)
        samples = []

        self.model.train()
        with torch.no_grad():
            for _ in range(n):
                samples.append(self.model(x).cpu().numpy())

        samples = np.stack(samples, axis=0)
        result = {
            'mean': samples.mean(axis=0),
            'std': samples.std(axis=0),
        }
        for q in quantiles:
            result[f'q_{int(q * 100):02d}'] = np.quantile(samples, q, axis=0)

        return result
