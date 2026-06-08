"""
LIME-style local explainer with optional dependency on the `lime` package.
"""

from __future__ import annotations

import numpy as np
from typing import Callable, Dict, Optional
from sklearn.linear_model import LinearRegression

try:  # pragma: no cover - optional dependency
    from lime.lime_tabular import LimeTabularExplainer

    HAS_LIME = True
except ImportError:  # pragma: no cover
    LimeTabularExplainer = None
    HAS_LIME = False


class TabularLIMEExplainer:
    def __init__(
        self,
        model_fn: Callable[[np.ndarray], np.ndarray],
        training_data: Optional[np.ndarray] = None,
        feature_names: Optional[list[str]] = None,
        class_names: Optional[list[str]] = None,
    ):
        self.model_fn = model_fn
        self.training_data = training_data
        self.feature_names = feature_names
        self.class_names = class_names
        self._lime_explainer = None
        if HAS_LIME and training_data is not None:
            self._lime_explainer = LimeTabularExplainer(
                training_data,
                feature_names=feature_names,
                class_names=class_names,
                discretize_continuous=False,
            )

    def explain(
        self,
        instance: np.ndarray,
        num_samples: int = 200,
        kernel_width: float = 0.75,
    ) -> Dict[int, float]:
        instance = np.array(instance)
        if HAS_LIME and self._lime_explainer is not None:
            exp = self._lime_explainer.explain_instance(
                instance,
                lambda data: np.column_stack([1 - self.model_fn(data), self.model_fn(data)]),
                num_samples=num_samples,
            )
            return {feat_idx: weight for feat_idx, weight in exp.as_map()[1]}

        # fall back to manual linear surrogate
        n_features = instance.shape[0]
        samples = np.random.normal(loc=instance, scale=kernel_width, size=(num_samples, n_features))
        distances = np.linalg.norm(samples - instance, axis=1)
        weights = np.exp(-(distances ** 2) / (kernel_width ** 2))
        preds = self.model_fn(samples)
        model = LinearRegression()
        model.fit(samples, preds, sample_weight=weights)
        return {i: float(coef) for i, coef in enumerate(model.coef_)}
