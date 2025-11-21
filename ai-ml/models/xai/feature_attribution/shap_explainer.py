"""
SHAP explainer wrapper with graceful fallback if the `shap` package is missing.
"""

from __future__ import annotations

import numpy as np
from typing import Callable, Dict, Optional

try:  # pragma: no cover - optional dependency
    import shap

    HAS_SHAP = True
except ImportError:  # pragma: no cover
    shap = None
    HAS_SHAP = False


class TabularSHAPExplainer:
    """Provide SHAP values for tabular models via shap.KernelExplainer or a fallback."""

    def __init__(
        self,
        model_fn: Callable[[np.ndarray], np.ndarray],
        background: np.ndarray,
        link: Optional[str] = None,
    ):
        self.model_fn = model_fn
        self.background = np.array(background)
        self.link = link
        self._explainer = None
        if HAS_SHAP:
            self._explainer = shap.KernelExplainer(  # type: ignore[attr-defined]
                lambda data: np.array(model_fn(np.array(data))).reshape(-1, 1),
                self.background,
                link=link,
            )

    def explain(self, instance: np.ndarray, num_samples: int = 200) -> Dict[int, float]:
        instance = np.array(instance)
        if HAS_SHAP and self._explainer is not None:
            shap_values = self._explainer.shap_values(  # type: ignore[attr-defined]
                instance.reshape(1, -1),
                nsamples=num_samples,
            )
            if isinstance(shap_values, list):
                shap_vector = shap_values[0][0]
            else:
                shap_vector = shap_values[0]
            return {i: float(val) for i, val in enumerate(shap_vector)}

        # fallback permutation-based approximation
        n_features = instance.shape[0]
        shap_values = np.zeros(n_features)
        baseline = float(np.mean(self.model_fn(self.background)))
        rng = np.random.default_rng()
        for _ in range(num_samples):
            perm = rng.permutation(n_features)
            running = baseline
            current = self.background[rng.integers(len(self.background))].copy()
            for idx in perm:
                prev = running
                current[idx] = instance[idx]
                running = float(self.model_fn(current.reshape(1, -1))[0])
                shap_values[idx] += running - prev
        shap_values /= max(num_samples, 1)
        return {i: float(val) for i, val in enumerate(shap_values)}
