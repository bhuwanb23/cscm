"""
Attention visualization helper.
"""

from __future__ import annotations

import numpy as np
from typing import Dict, List, Optional


class AttentionVisualizer:
    def summarize(self, attention_weights: np.ndarray) -> Dict[str, np.ndarray]:
        mean_heads = attention_weights.mean(axis=1)
        max_heads = attention_weights.max(axis=1)
        return {
            'mean_attention': mean_heads,
            'max_attention': max_heads
        }

    def token_attention(
        self,
        attention_weights: np.ndarray,
        tokens: Optional[List[str]] = None,
    ) -> Dict[str, float]:
        avg_attention = attention_weights.mean(axis=(0, 1))
        if tokens and len(tokens) == len(avg_attention):
            return {token: float(weight) for token, weight in zip(tokens, avg_attention)}
        return {str(i): float(weight) for i, weight in enumerate(avg_attention)}
