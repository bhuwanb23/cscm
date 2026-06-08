"""
ADWIN (ADaptive WINdowing) drift detector.

ADWIN maintains a sliding window of values and adaptively grows/shrinks it
based on detected distribution changes. When the average of two sub-windows
differs by more than a statistically-significant threshold, the oldest
elements are dropped (drift alert).

Reference: Bifet & Gavalda (2007) "Learning from Time-Changing Data with
Adaptive Windowing"
"""

import numpy as np
import math
from collections import deque
from typing import List, Optional


class ADWINDetector:
    """
    ADWIN change detector for streaming data.

    Maintains a window of statistics and checks for drift by comparing
    the means of two sub-windows. If a statistically-significant difference
    is found, the window is cut and drift is signaled.

    Usage:
        detector = ADWINDetector(delta=0.01)
        for value in stream:
            detector.update(value)
            if detector.drift_detected:
                print("Drift at index", detector.window_length)
    """

    def __init__(self, delta: float = 0.01, max_window: int = 10000):
        """
        Args:
            delta: Confidence parameter (0-1). Smaller = less false positives.
            max_window: Maximum window size before forced cut.
        """
        self.delta = delta
        self.max_window = max_window
        self.window = deque()
        self.total = 0.0
        self.variance = 0.0
        self.window_length = 0
        self.drift_detected = False
        self.total_drifts = 0
        self.last_drift_index = -1

    def _epsilon(self, n: int) -> float:
        """Hoeffding bound for two sub-windows of sizes n0 and n1 = n - n0."""
        m = n / 2.0
        return math.sqrt((1.0 / (2.0 * m)) * math.log(2.0 / self.delta))

    def update(self, value: float) -> bool:
        """
        Add a new value and check for drift.

        Args:
            value: New observation.

        Returns:
            True if drift was detected, False otherwise.
        """
        self.drift_detected = False
        self.window.append(value)
        self.total += value
        self.window_length += 1
        n = self.window_length

        if n < 10:
            return False

        if n > self.max_window:
            self._shrink(1)

        n0_min = 5
        for n0 in range(n0_min, n - n0_min + 1):
            n1 = n - n0
            if n1 < n0_min:
                continue

            sum0 = sum(self.window[i] for i in range(n0))
            sum1 = self.total - sum0
            mu0 = sum0 / n0
            mu1 = sum1 / n1

            eps = self._epsilon(n)
            diff = abs(mu0 - mu1)
            if diff > eps:
                self.drift_detected = True
                self.total_drifts += 1
                self.last_drift_index = self.window_length
                self._shrink(n0)
                return True

        return False

    def _shrink(self, cut: int):
        """Remove the oldest `cut` elements from the window."""
        for _ in range(cut):
            if self.window:
                old = self.window.popleft()
                self.total -= old
                self.window_length -= 1

    def get_mean(self) -> float:
        if self.window_length == 0:
            return 0.0
        return self.total / self.window_length

    def get_std(self) -> float:
        if self.window_length < 2:
            return 0.0
        arr = np.array(self.window)
        return float(arr.std(ddof=1))

    def get_stats(self) -> dict:
        return {
            "window_length": self.window_length,
            "mean": self.get_mean(),
            "std": self.get_std(),
            "total_drifts": self.total_drifts,
            "last_drift_index": self.last_drift_index,
        }

    def reset(self):
        self.window.clear()
        self.total = 0.0
        self.variance = 0.0
        self.window_length = 0
        self.drift_detected = False
