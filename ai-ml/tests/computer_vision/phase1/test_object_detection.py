"""
Test suite for computer vision object detection phase
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
        from legacy_models.computer_vision.object_detection.yolov8 import YOLOv8Detector
        from legacy_models.computer_vision.object_detection.faster_rcnn import FasterRCNNDetector
        from legacy_models.computer_vision.object_detection.detectron2_integration import Detectron2Detector, Detectron2ConfigManager
        assert True
    except ImportError as e:
        pytest.fail(f"Import failed: {e}")

@patch('models.computer_vision.object_detection.yolov8.YOLO')
def test_yolov8_detector_initialization(mock_yolo):
    """Test YOLOv8 detector initialization."""
    from legacy_models.computer_vision.object_detection.yolov8 import YOLOv8Detector
    
    # Mock the YOLO model
    mock_model = MagicMock()
    mock_yolo.return_value = mock_model
    
    # Test initialization
    detector = YOLOv8Detector(model_size='s', confidence_threshold=0.5)
    
    # Check attributes
    assert detector.model_size == 's'
    assert detector.confidence_threshold == 0.5
    assert detector.model is not None

def test_yolov8_preprocess_image():
    """Test YOLOv8 image preprocessing."""
    from legacy_models.computer_vision.object_detection.yolov8 import YOLOv8Detector
    
    # Create a mock detector (we won't actually run inference)
    with patch('models.computer_vision.object_detection.yolov8.YOLO'):
        detector = YOLOv8Detector()
        
        # Create a sample image
        sample_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Test preprocessing
        processed = detector.preprocess_image(sample_image)
        assert processed.shape == (480, 640, 3)
        # Should be RGB (not BGR)
        assert np.allclose(processed, sample_image[:, :, ::-1])

@patch('models.computer_vision.object_detection.faster_rcnn.fasterrcnn_resnet50_fpn')
def test_faster_rcnn_detector_initialization(mock_faster_rcnn):
    """Test Faster R-CNN detector initialization."""
    from legacy_models.computer_vision.object_detection.faster_rcnn import FasterRCNNDetector
    
    # Mock the model
    mock_model = MagicMock()
    mock_faster_rcnn.return_value = mock_model
    
    # Test initialization
    detector = FasterRCNNDetector(pretrained=True, confidence_threshold=0.5)
    
    # Check attributes
    assert detector.pretrained == True
    assert detector.confidence_threshold == 0.5
    assert detector.model is not None

def test_faster_rcnn_preprocess_image():
    """Test Faster R-CNN image preprocessing."""
    from legacy_models.computer_vision.object_detection.faster_rcnn import FasterRCNNDetector
    
    # Create a mock detector
    with patch('models.computer_vision.object_detection.faster_rcnn.fasterrcnn_resnet50_fpn'):
        detector = FasterRCNNDetector()
        
        # Create a sample image
        sample_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Test preprocessing
        processed = detector.preprocess_image(sample_image)
        # Should be a torch tensor on the correct device
        assert hasattr(processed, 'shape')

def test_detectron2_import_handling():
    """Test that Detectron2 import handling works correctly."""
    from legacy_models.computer_vision.object_detection.detectron2_integration import DETECTRON2_AVAILABLE
    
    # This test just verifies the import handling logic
    # In a real environment, DETECTRON2_AVAILABLE would depend on whether Detectron2 is installed
    assert isinstance(DETECTRON2_AVAILABLE, bool)

if __name__ == '__main__':
    pytest.main([__file__])