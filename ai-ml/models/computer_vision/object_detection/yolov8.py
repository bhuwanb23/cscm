"""
YOLOv8 Implementation for SKU/Box Detection in Warehouse Computer Vision

This module provides a wrapper for YOLOv8 models with training and inference capabilities.
"""

import torch
import numpy as np
import cv2
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from pathlib import Path
import yaml
from ultralytics import YOLO
from ultralytics.engine.results import Results

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class YOLOv8Detector:
    """
    YOLOv8 Detector for SKU/box detection in warehouse environments.
    
    This class provides a wrapper around Ultralytics YOLOv8 with additional
    functionality for warehouse-specific use cases.
    """
    
    def __init__(self, model_path: Optional[str] = None, 
                 model_size: str = 's', 
                 confidence_threshold: float = 0.5):
        """
        Initialize YOLOv8 detector.
        
        Args:
            model_path: Path to pre-trained model or None to create new model
            model_size: Model size ('n', 's', 'm', 'l', 'x')
            confidence_threshold: Minimum confidence threshold for detections
        """
        self.model_path = model_path
        self.model_size = model_size
        self.confidence_threshold = confidence_threshold
        self.model = None
        
        # Load or create model
        if model_path and Path(model_path).exists():
            self.model = YOLO(model_path)
        else:
            model_name = f'yolov8{model_size}.pt'
            self.model = YOLO(model_name)
            
        logger.info(f"YOLOv8 detector initialized with model size {model_size}")
        
    def preprocess_image(self, image: Union[np.ndarray, str]) -> np.ndarray:
        """
        Preprocess image for YOLOv8 inference.
        
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
            
        # Convert BGR to RGB if needed
        if len(img.shape) == 3 and img.shape[2] == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
        return img
    
    def detect(self, image: Union[np.ndarray, str], 
               classes: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """
        Detect objects in image.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            classes: List of class indices to detect (None for all classes)
            
        Returns:
            List of detection results with bounding boxes, confidence, and class
        """
        # Preprocess image
        img = self.preprocess_image(image)
        
        # Run inference
        results = self.model(
            img, 
            conf=self.confidence_threshold,
            classes=classes
        )
        
        # Process results
        detections = []
        if isinstance(results, list):
            result = results[0]  # Get first result
        else:
            result = results
            
        if hasattr(result, 'boxes') and result.boxes is not None:
            boxes = result.boxes
            for i in range(len(boxes)):
                box = boxes.xyxy[i].cpu().numpy()  # xyxy format
                conf = boxes.conf[i].cpu().numpy()
                cls = boxes.cls[i].cpu().numpy()
                
                detection = {
                    'bbox': box.tolist(),
                    'confidence': float(conf),
                    'class_id': int(cls),
                    'class_name': self.model.names[int(cls)]
                }
                detections.append(detection)
                
        return detections
    
    def detect_batch(self, images: List[Union[np.ndarray, str]]) -> List[List[Dict[str, Any]]]:
        """
        Detect objects in batch of images.
        
        Args:
            images: List of input images
            
        Returns:
            List of detection results for each image
        """
        # Preprocess all images
        processed_images = [self.preprocess_image(img) for img in images]
        
        # Run batch inference
        results = self.model(
            processed_images,
            conf=self.confidence_threshold
        )
        
        # Process results
        batch_detections = []
        for result in results:
            detections = []
            if hasattr(result, 'boxes') and result.boxes is not None:
                boxes = result.boxes
                for i in range(len(boxes)):
                    box = boxes.xyxy[i].cpu().numpy()  # xyxy format
                    conf = boxes.conf[i].cpu().numpy()
                    cls = boxes.cls[i].cpu().numpy()
                    
                    detection = {
                        'bbox': box.tolist(),
                        'confidence': float(conf),
                        'class_id': int(cls),
                        'class_name': self.model.names[int(cls)]
                    }
                    detections.append(detection)
            batch_detections.append(detections)
            
        return batch_detections
    
    def train(self, data_yaml: str, epochs: int = 100, 
              imgsz: int = 640, batch_size: int = 16,
              project: str = 'warehouse_cv', name: str = 'yolov8_training') -> str:
        """
        Train YOLOv8 model on custom dataset.
        
        Args:
            data_yaml: Path to data.yaml file with dataset configuration
            epochs: Number of training epochs
            imgsz: Image size for training
            batch_size: Batch size for training
            project: Project name for saving results
            name: Experiment name
            
        Returns:
            Path to trained model
        """
        # Train model
        results = self.model.train(
            data=data_yaml,
            epochs=epochs,
            imgsz=imgsz,
            batch=batch_size,
            project=project,
            name=name,
            exist_ok=True
        )
        
        # Save trained model
        model_path = f"{project}/{name}/weights/best.pt"
        self.model = YOLO(model_path)
        
        logger.info(f"Model trained and saved to {model_path}")
        return model_path
    
    def export_model(self, format: str = 'onnx', 
                     export_path: Optional[str] = None) -> str:
        """
        Export model to different formats for deployment.
        
        Args:
            format: Export format ('onnx', 'torchscript', 'pt', etc.)
            export_path: Path to export model (default: auto-generated)
            
        Returns:
            Path to exported model
        """
        if export_path is None:
            export_path = f"yolov8{self.model_size}.{format}"
            
        # Export model
        self.model.export(format=format, save_dir=Path(export_path).parent)
        
        logger.info(f"Model exported to {export_path}")
        return export_path
    
    def visualize_detections(self, image: Union[np.ndarray, str], 
                           detections: List[Dict[str, Any]]) -> np.ndarray:
        """
        Visualize detections on image.
        
        Args:
            image: Input image
            detections: List of detection results
            
        Returns:
            Image with bounding boxes drawn
        """
        # Load image if path provided
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image.copy()
            
        # Draw bounding boxes
        for detection in detections:
            bbox = detection['bbox']
            confidence = detection['confidence']
            class_name = detection['class_name']
            
            # Convert to int coordinates
            x1, y1, x2, y2 = map(int, bbox)
            
            # Draw rectangle
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label
            label = f"{class_name}: {confidence:.2f}"
            cv2.putText(img, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
        return img

# Example usage
if __name__ == "__main__":
    # Create detector
    detector = YOLOv8Detector()
    
    # Example detection (this would work if we had an image)
    # detections = detector.detect("path/to/image.jpg")
    # print(f"Found {len(detections)} objects")
    
    print("YOLOv8Detector initialized successfully")