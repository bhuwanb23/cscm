"""
Test suite for OCR and Counting functionality in warehouse computer vision system.
"""

import pytest
import sys
import os
import numpy as np
import cv2
from unittest.mock import patch, MagicMock

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

def test_imports():
    """Test that all modules can be imported without errors."""
    try:
        from legacy_models.computer_vision.ocr_counting.ocr import TesseractOCR
        from legacy_models.computer_vision.ocr_counting.density_estimation import DensityEstimator
        assert True
    except ImportError as e:
        pytest.fail(f"Import failed: {e}")

@patch('models.computer_vision.ocr_counting.ocr.cv2.imread')
@patch('models.computer_vision.ocr_counting.ocr.pytesseract.get_tesseract_version')
def test_tesseract_ocr_extract_text(mock_get_tesseract_version, mock_imread):
    """Test Tesseract OCR text extraction."""
    from legacy_models.computer_vision.ocr_counting.ocr import TesseractOCR
    
    # Mock Tesseract availability
    mock_get_tesseract_version.return_value = "5.0.0"
    
    # Mock image data
    mock_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    mock_imread.return_value = mock_image
    
    # Mock pytesseract result
    with patch('models.computer_vision.ocr_counting.ocr.pytesseract.image_to_string') as mock_image_to_string, \
         patch('models.computer_vision.ocr_counting.ocr.pytesseract.image_to_data') as mock_image_to_data:
        mock_image_to_string.return_value = "SKU12345\nQuantity: 10\nWeight: 5.5kg"
        mock_image_to_data.return_value = {
            'text': ['SKU12345', 'Quantity:', '10', 'Weight:', '5.5kg'],
            'conf': [95, 90, 92, 88, 91],
            'left': [0, 0, 0, 0, 0],
            'top': [0, 0, 0, 0, 0],
            'width': [50, 50, 20, 30, 30],
            'height': [20, 20, 20, 20, 20]
        }
        
        ocr = TesseractOCR()
        result = ocr.extract_text("test_image.jpg")
        
        # Assertions
        assert isinstance(result, dict)
        assert 'text' in result
        assert 'confidence' in result
        assert 'words' in result
        assert 'boxes' in result
        assert "SKU12345" in result['text']
        mock_imread.assert_called_once_with("test_image.jpg")

@patch('models.computer_vision.ocr_counting.ocr.cv2.imread')
@patch('models.computer_vision.ocr_counting.ocr.pytesseract.get_tesseract_version')
def test_tesseract_ocr_extract_structured_data(mock_get_tesseract_version, mock_imread):
    """Test Tesseract OCR structured data extraction."""
    from legacy_models.computer_vision.ocr_counting.ocr import TesseractOCR
    
    # Mock Tesseract availability
    mock_get_tesseract_version.return_value = "5.0.0"
    
    # Mock image data
    mock_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    mock_imread.return_value = mock_image
    
    # Mock pytesseract result
    with patch('models.computer_vision.ocr_counting.ocr.pytesseract.image_to_string') as mock_image_to_string, \
         patch('models.computer_vision.ocr_counting.ocr.pytesseract.image_to_data') as mock_image_to_data:
        mock_image_to_string.return_value = "SKU12345\nQuantity: 10\nWeight: 5.5kg"
        mock_image_to_data.return_value = {
            'text': ['SKU12345', 'Quantity:', '10', 'Weight:', '5.5kg'],
            'conf': [95, 90, 92, 88, 91],
            'left': [0, 0, 0, 0, 0],
            'top': [0, 0, 0, 0, 0],
            'width': [50, 50, 20, 30, 30],
            'height': [20, 20, 20, 20, 20]
        }
        
        ocr = TesseractOCR()
        result = ocr.extract_structured_data("test_image.jpg")
        
        # Assertions
        assert isinstance(result, dict)
        assert 'sku' in result
        assert 'quantity' in result
        assert 'weight' in result
        assert 'ocr_confidence' in result

def test_density_estimator_count_items_blob_detection():
    """Test density estimation using blob detection."""
    from legacy_models.computer_vision.ocr_counting.density_estimation import DensityEstimator
    
    density_estimator = DensityEstimator()
    
    # Create test image with blobs
    test_image = np.zeros((200, 200, 3), dtype=np.uint8)
    # Add some white circles to simulate items
    cv2.circle(test_image, (50, 50), 10, (255, 255, 255), -1)
    cv2.circle(test_image, (150, 150), 15, (255, 255, 255), -1)
    
    with patch('models.computer_vision.ocr_counting.density_estimation.cv2.imread') as mock_imread:
        mock_imread.return_value = test_image
        
        result = density_estimator.count_items_blob_detection(test_image)
        
        # Assertions
        assert isinstance(result, dict)
        assert 'count' in result
        assert 'method' in result
        assert result['method'] == 'blob_detection'

def test_density_estimator_count_items_template_matching():
    """Test density estimation using template matching."""
    from legacy_models.computer_vision.ocr_counting.density_estimation import DensityEstimator
    
    density_estimator = DensityEstimator()
    
    # Create test images
    test_image = np.ones((100, 100, 3), dtype=np.uint8) * 255
    template = np.ones((20, 20, 3), dtype=np.uint8) * 128
    
    with patch('models.computer_vision.ocr_counting.density_estimation.cv2.imread') as mock_imread:
        mock_imread.side_effect = [test_image, template] if isinstance(test_image, str) else [test_image, template]
        
        result = density_estimator.count_items_template_matching(
            test_image, template
        )
        
        # Assertions
        assert isinstance(result, dict)
        assert 'count' in result
        assert 'method' in result
        assert result['method'] == 'template_matching'

def test_density_estimator_count_items_clustering():
    """Test density estimation using clustering."""
    from legacy_models.computer_vision.ocr_counting.density_estimation import DensityEstimator
    
    density_estimator = DensityEstimator()
    
    # Create test image with features
    test_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    
    with patch('models.computer_vision.ocr_counting.density_estimation.cv2.imread') as mock_imread:
        mock_imread.return_value = test_image
        
        result = density_estimator.count_items_clustering(test_image)
        
        # Assertions
        assert isinstance(result, dict)
        assert 'count' in result
        assert 'method' in result
        assert result['method'] == 'clustering'

if __name__ == '__main__':
    pytest.main([__file__])