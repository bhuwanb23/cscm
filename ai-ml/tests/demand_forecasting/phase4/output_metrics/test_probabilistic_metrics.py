"""
Test suite for probabilistic metrics
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.demand_forecasting.output_metrics.probabilistic_metrics import ProbabilisticMetricsCalculator


def test_pinball_loss():
    """Test pinball loss calculation."""
    calculator = ProbabilisticMetricsCalculator()
    
    y_true = np.array([100, 110, 120])
    y_pred = np.array([105, 108, 118])
    quantile = 0.5
    
    loss = calculator.pinball_loss(y_true, y_pred, quantile)
    
    assert isinstance(loss, float)
    assert loss >= 0


def test_multi_quantile_pinball_loss():
    """Test multi-quantile pinball loss."""
    calculator = ProbabilisticMetricsCalculator()
    
    y_true = np.array([100, 110, 120])
    y_pred_quantiles = np.array([
        [95, 105, 115],   # 0.1 quantile
        [100, 110, 120],  # 0.5 quantile
        [105, 115, 125]   # 0.9 quantile
    ]).T
    
    quantiles = [0.1, 0.5, 0.9]
    
    loss = calculator.multi_quantile_pinball_loss(y_true, y_pred_quantiles, quantiles)
    
    assert isinstance(loss, float)
    assert loss >= 0


def test_crps_from_samples():
    """Test CRPS calculation from samples."""
    calculator = ProbabilisticMetricsCalculator()
    
    np.random.seed(42)
    y_true = np.array([100, 110, 120])
    samples = np.random.normal(100, 10, (3, 1000))  # 3 forecasts, 1000 samples each
    
    crps = calculator.crps_from_samples(y_true, samples)
    
    assert isinstance(crps, float)
    assert crps >= 0


def test_crps_from_quantiles():
    """Test CRPS calculation from quantiles."""
    calculator = ProbabilisticMetricsCalculator()
    
    y_true = np.array([100, 110, 120])
    quantiles = np.array([
        [95, 105, 115],   # 0.1 quantile
        [100, 110, 120],  # 0.5 quantile
        [105, 115, 125]   # 0.9 quantile
    ]).T
    
    quantile_levels = [0.1, 0.5, 0.9]
    
    crps = calculator.crps_from_quantiles(y_true, quantiles, quantile_levels)
    
    assert isinstance(crps, float)
    assert crps >= 0


def test_calculate_coverage():
    """Test coverage calculation."""
    calculator = ProbabilisticMetricsCalculator()
    
    y_true = np.array([100, 110, 120, 130, 140])
    lower_bound = np.array([95, 105, 115, 125, 135])
    upper_bound = np.array([105, 115, 125, 135, 145])
    
    coverage = calculator.calculate_coverage(y_true, lower_bound, upper_bound)
    
    assert isinstance(coverage, float)
    assert 0 <= coverage <= 100
    # All values should be within bounds
    assert coverage == 100.0


def test_calculate_interval_width():
    """Test interval width calculation."""
    calculator = ProbabilisticMetricsCalculator()
    
    lower_bound = np.array([95, 105, 115])
    upper_bound = np.array([105, 115, 125])
    
    width = calculator.calculate_interval_width(lower_bound, upper_bound)
    
    assert isinstance(width, float)
    assert width > 0
    # All intervals should have width 10
    assert abs(width - 10.0) < 0.1


def test_calculate_all_probabilistic_metrics():
    """Test calculating all probabilistic metrics."""
    calculator = ProbabilisticMetricsCalculator()
    
    np.random.seed(42)
    y_true = np.array([100, 110, 120])
    y_pred_samples = np.random.normal(100, 10, (3, 1000))
    y_pred_quantiles = np.array([
        [95, 105, 115],
        [100, 110, 120],
        [105, 115, 125]
    ]).T
    quantile_levels = [0.1, 0.5, 0.9]
    
    metrics = calculator.calculate_all_probabilistic_metrics(
        y_true, y_pred_samples, y_pred_quantiles, quantile_levels
    )
    
    assert 'crps' in metrics
    assert 'crps_quantiles' in metrics
    assert 'pinball_loss_q10' in metrics
    assert 'pinball_loss_q50' in metrics
    assert 'pinball_loss_q90' in metrics
    assert 'avg_pinball_loss' in metrics
    
    assert all(isinstance(v, float) for v in metrics.values())


if __name__ == "__main__":
    pytest.main([__file__])

