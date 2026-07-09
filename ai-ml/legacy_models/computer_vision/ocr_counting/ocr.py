"""
OCR Implementation for Warehouse Label Reading

This module provides OCR capabilities using Tesseract and CRNN for reading
labels and text on warehouse items.
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
import re
from PIL import Image
import pytesseract
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TesseractOCR:
    """
    Tesseract OCR for reading text on warehouse labels.
    
    This class provides text detection and recognition capabilities using Tesseract
    for extracting information from warehouse item labels.
    """
    
    def __init__(self, config: Optional[str] = None, 
                 confidence_threshold: float = 0.5):
        """
        Initialize Tesseract OCR.
        
        Args:
            config: Tesseract configuration string
            confidence_threshold: Minimum confidence threshold for text detection
        """
        self.config = config or '--psm 6'  # Default configuration
        self.confidence_threshold = confidence_threshold
        
        # Check if Tesseract is available
        try:
            pytesseract.get_tesseract_version()
            self.tesseract_available = True
        except pytesseract.TesseractNotFoundError:
            self.tesseract_available = False
            logger.warning("Tesseract not found. OCR functionality will be limited.")
            
        logger.info("Tesseract OCR initialized")
        
    def preprocess_image(self, image: Union[np.ndarray, str]) -> np.ndarray:
        """
        Preprocess image for OCR.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            
        Returns:
            Preprocessed image
        """
        if isinstance(image, str):
            # Load image from file
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Could not load image from {image}")
        else:
            img = image.copy()
            
        # Convert to grayscale if needed
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
            
        # Apply preprocessing techniques to improve OCR accuracy
        # 1. Noise removal
        denoised = cv2.medianBlur(gray, 3)
        
        # 2. Thresholding
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # 3. Morphological operations to remove noise and improve text
        kernel = np.ones((1, 1), np.uint8)
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        
        return opening
    
    def extract_text(self, image: Union[np.ndarray, str]) -> Dict[str, Any]:
        """
        Extract text from image using Tesseract.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            
        Returns:
            Dictionary with extracted text and metadata
        """
        if not self.tesseract_available:
            return {
                'text': '',
                'confidence': 0.0,
                'words': [],
                'boxes': []
            }
            
        # Preprocess image
        processed_img = self.preprocess_image(image)
        
        # Convert to PIL Image
        pil_img = Image.fromarray(processed_img)
        
        # Extract text with bounding boxes
        data = pytesseract.image_to_data(pil_img, config=self.config, output_type=pytesseract.Output.DICT)
        
        # Extract text with confidence
        text = pytesseract.image_to_string(pil_img, config=self.config)
        
        # Process word-level data
        words = []
        boxes = []
        
        n_boxes = len(data['text'])
        for i in range(n_boxes):
            if int(data['conf'][i]) > self.confidence_threshold * 100:
                word = data['text'][i]
                if word.strip():  # Only include non-empty words
                    words.append({
                        'text': word,
                        'confidence': float(data['conf'][i]) / 100.0,
                        'x': data['left'][i],
                        'y': data['top'][i],
                        'width': data['width'][i],
                        'height': data['height'][i]
                    })
                    
                    boxes.append([
                        data['left'][i], 
                        data['top'][i], 
                        data['width'][i], 
                        data['height'][i]
                    ])
        
        # Calculate average confidence
        avg_confidence = np.mean([word['confidence'] for word in words]) if words else 0.0
        
        return {
            'text': text.strip(),
            'confidence': avg_confidence,
            'words': words,
            'boxes': boxes
        }
    
    def extract_structured_data(self, image: Union[np.ndarray, str]) -> Dict[str, Any]:
        """
        Extract structured data from warehouse labels.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            
        Returns:
            Dictionary with structured label data
        """
        # Extract text
        ocr_result = self.extract_text(image)
        
        # Parse structured data from text
        structured_data = self._parse_label_data(ocr_result['text'])
        
        # Add OCR metadata
        structured_data.update({
            'ocr_confidence': ocr_result['confidence'],
            'raw_text': ocr_result['text'],
            'detected_words': ocr_result['words']
        })
        
        return structured_data
    
    def _parse_label_data(self, text: str) -> Dict[str, Any]:
        """
        Parse structured data from OCR text.
        
        Args:
            text: Raw OCR text
            
        Returns:
            Dictionary with parsed label data
        """
        # Initialize structured data
        data = {
            'sku': None,
            'product_name': None,
            'quantity': None,
            'weight': None,
            'dimensions': None,
            'batch_number': None,
            'expiration_date': None,
            'manufacturing_date': None
        }
        
        # Convert to lowercase for easier matching
        text_lower = text.lower()
        
        # Extract SKU (look for patterns like "SKU:", "Item:", "#" followed by alphanumeric)
        sku_patterns = [
            r'sku[^\w]*([a-z0-9\-]+)',
            r'item[^\w]*([a-z0-9\-]+)',
            r'#([a-z0-9\-]+)',
            r'^([a-z0-9]{6,})$'  # Standalone alphanumeric codes
        ]
        
        for pattern in sku_patterns:
            match = re.search(pattern, text_lower)
            if match:
                data['sku'] = match.group(1).upper()
                break
                
        # Extract quantity (look for numbers followed by "pcs", "pieces", "qty", etc.)
        qty_patterns = [
            r'qty[^\d]*(\d+)',
            r'quantity[^\d]*(\d+)',
            r'(\d+)\s*(?:pcs|pieces|units?)',
            r'(\d+)\s*x\s*\d+'  # For dimensions like 10x20
        ]
        
        for pattern in qty_patterns:
            match = re.search(pattern, text_lower)
            if match:
                data['quantity'] = int(match.group(1))
                break
                
        # Extract weight (look for numbers followed by "kg", "g", "lbs", etc.)
        weight_patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)',
            r'(\d+(?:\.\d+)?)\s*(?:g|grams?)',
            r'(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)',
            r'weight[^\d]*(\d+(?:\.\d+)?)'
        ]
        
        for pattern in weight_patterns:
            match = re.search(pattern, text_lower)
            if match:
                data['weight'] = float(match.group(1))
                break
                
        # Extract dimensions (look for patterns like 10x20x30 cm)
        dim_patterns = [
            r'(\d+(?:\.\d+)?)\s*[x\*]\s*(\d+(?:\.\d+)?)\s*[x\*]\s*(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)\s*[x\*]\s*(\d+(?:\.\d+)?)',
            r'dimensions?[^\d]*(\d+(?:\.\d+)?)\s*[x\*]\s*(\d+(?:\.\d+)?)'
        ]
        
        for pattern in dim_patterns:
            match = re.search(pattern, text_lower)
            if match:
                if len(match.groups()) == 3:
                    data['dimensions'] = {
                        'length': float(match.group(1)),
                        'width': float(match.group(2)),
                        'height': float(match.group(3))
                    }
                elif len(match.groups()) == 2:
                    data['dimensions'] = {
                        'length': float(match.group(1)),
                        'width': float(match.group(2))
                    }
                break
                
        # Extract dates (look for common date formats)
        date_patterns = [
            r'(?:exp(?:iry)?|expires?)[^\d]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
            r'(?:mfg|mfr|manufactured?)[^\d]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
            r'(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})'
        ]
        
        expiration_match = re.search(date_patterns[0], text_lower)
        if expiration_match:
            data['expiration_date'] = expiration_match.group(1)
            
        mfg_match = re.search(date_patterns[1], text_lower)
        if mfg_match:
            data['manufacturing_date'] = mfg_match.group(1)
            
        # Extract batch/lot numbers
        batch_patterns = [
            r'(?:batch|lot)[^\w]*([a-z0-9\-]+)',
            r'([a-z0-9]{4,}-[a-z0-9]{4,})'  # Pattern like ABCD-1234
        ]
        
        for pattern in batch_patterns:
            match = re.search(pattern, text_lower)
            if match:
                data['batch_number'] = match.group(1).upper()
                break
                
        return data
    
    def visualize_ocr_results(self, image: Union[np.ndarray, str], 
                            ocr_results: Dict[str, Any]) -> np.ndarray:
        """
        Visualize OCR results on image.
        
        Args:
            image: Input image
            ocr_results: OCR results dictionary
            
        Returns:
            Image with OCR results visualized
        """
        # Load image if path provided
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image.copy()
            
        # Draw bounding boxes for detected words
        for word_info in ocr_results.get('words', []):
            x, y, w, h = word_info['x'], word_info['y'], word_info['width'], word_info['height']
            confidence = word_info['confidence']
            
            # Choose color based on confidence
            if confidence > 0.8:
                color = (0, 255, 0)  # Green for high confidence
            elif confidence > 0.5:
                color = (0, 255, 255)  # Yellow for medium confidence
            else:
                color = (0, 0, 255)  # Red for low confidence
                
            # Draw rectangle
            cv2.rectangle(img, (x, y), (x + w, y + h), color, 1)
            
            # Draw confidence text
            conf_text = f"{confidence:.2f}"
            cv2.putText(img, conf_text, (x, y - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
            
        # Add overall confidence
        overall_conf = ocr_results.get('confidence', 0)
        cv2.putText(img, f"Overall Confidence: {overall_conf:.2f}", (10, 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        return img

class CRNNOCR:
    """
    CRNN OCR for custom label recognition.
    
    This class provides deep learning-based OCR using CRNN (Convolutional Recurrent Neural Network)
    for recognizing custom fonts and specialized warehouse labels.
    """
    
    def __init__(self, model_path: Optional[str] = None, 
                 confidence_threshold: float = 0.5):
        """
        Initialize CRNN OCR.
        
        Args:
            model_path: Path to pretrained CRNN model
            confidence_threshold: Minimum confidence threshold for text recognition
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        
        # Initialize model (placeholder)
        self._initialize_model()
        
        logger.info("CRNN OCR initialized")
        
    def _initialize_model(self):
        """Initialize CRNN model."""
        # In a real implementation, we would load a pretrained CRNN model here
        # For now, we'll use placeholder logic
        self.model = "placeholder_crnn_model"
        
    def recognize_text(self, image: Union[np.ndarray, str]) -> Dict[str, Any]:
        """
        Recognize text in image using CRNN.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            
        Returns:
            Dictionary with recognized text and confidence
        """
        # In a real implementation, this would use the CRNN model
        # For now, we'll return placeholder results
        
        # Preprocess image
        processed_img = self.preprocess_image(image)
        
        # Placeholder recognition (would use actual CRNN model)
        # This is where we would run the CRNN inference
        recognized_text = "PLACEHOLDER_TEXT"
        confidence = 0.85
        
        return {
            'text': recognized_text,
            'confidence': confidence,
            'characters': [{'char': c, 'confidence': confidence} for c in recognized_text]
        }
    
    def preprocess_image(self, image: Union[np.ndarray, str]) -> np.ndarray:
        """
        Preprocess image for CRNN.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            
        Returns:
            Preprocessed image
        """
        if isinstance(image, str):
            # Load image from file
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Could not load image from {image}")
        else:
            img = image.copy()
            
        # Convert to grayscale if needed
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
            
        # Resize to standard height (32px) while maintaining aspect ratio
        target_height = 32
        aspect_ratio = gray.shape[1] / gray.shape[0]
        target_width = int(target_height * aspect_ratio)
        
        resized = cv2.resize(gray, (target_width, target_height), interpolation=cv2.INTER_LINEAR)
        
        # Normalize pixel values
        normalized = resized.astype(np.float32) / 255.0
        
        return normalized

# Example usage
if __name__ == "__main__":
    # Create Tesseract OCR
    ocr = TesseractOCR()
    
    print("OCR systems initialized successfully")