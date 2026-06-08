"""
Test suite for computer vision deployment phase
"""

import pytest
import sys
import os
import numpy as np
import torch
import torch.nn as nn
from unittest.mock import patch, MagicMock

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

def test_imports():
    """Test that all deployment modules can be imported without errors."""
    try:
        from legacy_models.computer_vision.deployment.edge_deployment import ModelOptimizer, EdgeDeployer, HardwareCompatibilityLayer
        from legacy_models.computer_vision.deployment.low_latency_inference import BatchProcessor, StreamingInferenceEngine, InferenceCache, PerformanceMonitor
        from legacy_models.computer_vision.deployment.fine_tuning import ContinualLearningDataset, ModelVersionManager, AutomatedRetrainingPipeline, DataQualityMonitor
        assert True
    except ImportError as e:
        pytest.fail(f"Import failed: {e}")

def test_model_optimizer_initialization():
    """Test ModelOptimizer initialization."""
    from legacy_models.computer_vision.deployment.edge_deployment import ModelOptimizer
    
    # Test initialization
    optimizer = ModelOptimizer(model_path="test_model.pth")
    
    # Check attributes
    assert optimizer.model_path == "test_model.pth"

def test_model_optimizer_quantize_model():
    """Test model quantization."""
    from legacy_models.computer_vision.deployment.edge_deployment import ModelOptimizer
    
    # Create a simple model
    class SimpleModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.linear = nn.Linear(10, 5)
            
        def forward(self, x):
            return self.linear(x)
    
    model = SimpleModel()
    optimizer = ModelOptimizer()
    
    # Test dynamic quantization
    quantized_model = optimizer.quantize_model(model, "dynamic")
    
    # Should be a different type but still a module
    assert isinstance(quantized_model, nn.Module)
    # Check that the linear layer is quantized by checking its type
    assert hasattr(quantized_model.linear, 'weight')  # Still has weight
    # The linear layer should now be a quantized linear layer
    assert 'Linear' in str(type(quantized_model.linear))

def test_model_optimizer_prune_model():
    """Test model pruning."""
    from legacy_models.computer_vision.deployment.edge_deployment import ModelOptimizer
    
    # Create a simple model
    class SimpleModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.linear = nn.Linear(10, 5)
            
        def forward(self, x):
            return self.linear(x)
    
    model = SimpleModel()
    optimizer = ModelOptimizer()
    
    # Store original weights
    original_weight = model.linear.weight.clone()
    
    # Test pruning
    pruned_model = optimizer.prune_model(model, 0.3)
    
    # Should still be the same model instance
    assert pruned_model is model
    
    # Some weights should be zeroed out
    zero_weights = (pruned_model.linear.weight == 0).sum().item()
    total_weights = pruned_model.linear.weight.numel()
    
    # Should have some zero weights but not all
    assert zero_weights > 0
    assert zero_weights < total_weights

def test_hardware_compatibility_layer():
    """Test HardwareCompatibilityLayer."""
    from legacy_models.computer_vision.deployment.edge_deployment import HardwareCompatibilityLayer
    
    # Test initialization
    hw_layer = HardwareCompatibilityLayer()
    
    # Test compatibility checking
    result = hw_layer.check_compatibility(100, False, "jetson_nano")
    assert isinstance(result, dict)
    assert 'compatible' in result
    
    # Test platform optimization
    class SimpleModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.linear = nn.Linear(10, 5)
            
        def forward(self, x):
            return self.linear(x)
    
    model = SimpleModel()
    optimized_model = hw_layer.optimize_for_platform(model, "jetson_nano")
    assert isinstance(optimized_model, nn.Module)

def test_batch_processor():
    """Test BatchProcessor functionality."""
    from legacy_models.computer_vision.deployment.low_latency_inference import BatchProcessor
    import time
    
    # Test initialization
    batch_processor = BatchProcessor(max_batch_size=4, batch_timeout_ms=20.0)
    assert batch_processor.max_batch_size == 4
    
    # Test request submission
    batch_processor.start()
    
    # Submit some requests
    for i in range(3):
        batch_processor.submit_request(f"req_{i}", f"data_{i}")
    
    # Give some time for processing
    time.sleep(0.1)
    
    # Stop processor
    batch_processor.stop()

def test_inference_cache():
    """Test InferenceCache functionality."""
    from legacy_models.computer_vision.deployment.low_latency_inference import InferenceCache
    
    # Test initialization
    cache = InferenceCache(max_cache_size=100, ttl_seconds=60.0)
    
    # Test putting and getting values
    cache.put("key1", {"result": "value1"})
    cached_value = cache.get("key1")
    assert cached_value == {"result": "value1"}
    
    # Test invalidation
    cache.invalidate("key1")
    cached_value = cache.get("key1")
    assert cached_value is None

def test_continual_learning_dataset():
    """Test ContinualLearningDataset."""
    from legacy_models.computer_vision.deployment.fine_tuning import ContinualLearningDataset
    
    # Test initialization
    dataset = ContinualLearningDataset(max_size=100)
    assert len(dataset) == 0
    
    # Add samples
    dataset.add_sample("sample1", "label1", 1.0)
    dataset.add_sample("sample2", "label2", 0.8)
    
    # Check dataset size
    assert len(dataset) == 2
    
    # Test item retrieval
    sample, label, weight = dataset[0]
    assert sample == "sample1"
    assert label == "label1"
    assert weight == 1.0

def test_data_quality_monitor():
    """Test DataQualityMonitor."""
    from legacy_models.computer_vision.deployment.fine_tuning import DataQualityMonitor
    import numpy as np
    
    # Test initialization
    monitor = DataQualityMonitor()
    
    # Test statistics update
    data = np.random.randn(10, 3, 32, 32)
    labels = np.random.randint(0, 5, 10)
    
    stats = monitor.update_statistics(data, labels)
    assert 'mean' in stats
    assert 'std' in stats
    assert 'label_distribution' in stats
    
    # Test quality report
    report = monitor.get_quality_report()
    assert 'current_stats' in report
    assert 'quality_score' in report

if __name__ == '__main__':
    pytest.main([__file__])