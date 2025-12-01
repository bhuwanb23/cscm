"""
Test suite for computer vision instance segmentation phase
"""

import pytest
import numpy as np
import sys
import os
from unittest.mock import patch, MagicMock

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

def test_imports():
    """Test that all modules can be imported without errors."""
    try:
        from models.computer_vision.instance_segmentation.detailed_damage import DetailedDamageDetector, DamageType, DamageSeverity
        assert True
    except ImportError as e:
        pytest.fail(f"Import failed: {e}")

def test_detailed_damage_detector_initialization():
    """Test detailed damage detector initialization."""
    from models.computer_vision.instance_segmentation.detailed_damage import DetailedDamageDetector
    
    # Test initialization
    detector = DetailedDamageDetector(confidence_threshold=0.5)
    
    # Check attributes
    assert detector.confidence_threshold == 0.5
    assert detector.damage_classifier is not None
    assert detector.severity_assessor is not None

def test_damage_type_classification():
    """Test damage type classification."""
    from models.computer_vision.instance_segmentation.detailed_damage import DetailedDamageDetector, DamageType
    
    detector = DetailedDamageDetector()
    
    # Create a sample image region and mask
    image_region = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    mask = np.ones((100, 100), dtype=np.uint8)
    
    # Test classification
    damage_type, confidence = detector.classify_damage_type(image_region, mask)
    
    # Should return a valid damage type and confidence
    assert isinstance(damage_type, str)
    assert isinstance(confidence, float)
    assert 0.0 <= confidence <= 1.0
    # Check that it's one of our defined damage types
    assert damage_type in [dt.value for dt in DamageType]

def test_damage_severity_assessment():
    """Test damage severity assessment."""
    from models.computer_vision.instance_segmentation.detailed_damage import DetailedDamageDetector, DamageType, DamageSeverity
    
    detector = DetailedDamageDetector()
    
    # Create a sample image region and mask
    image_region = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    mask = np.ones((100, 100), dtype=np.uint8)
    
    # Test severity assessment
    severity, confidence = detector.assess_damage_severity(image_region, mask, DamageType.SCRATCH.value)
    
    # Should return a valid severity level and confidence
    assert isinstance(severity, str)
    assert isinstance(confidence, float)
    assert 0.0 <= confidence <= 1.0
    # Check that it's one of our defined severity levels
    assert severity in [ds.name for ds in DamageSeverity]

if __name__ == '__main__':
    pytest.main([__file__])