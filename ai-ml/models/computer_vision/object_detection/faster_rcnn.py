"""
Faster R-CNN Implementation for Warehouse Object Detection

This module provides a PyTorch-based Faster R-CNN implementation with ResNet backbone
for detecting SKUs and boxes in warehouse environments.
"""

import torch
import torch.nn as nn
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn, FasterRCNN_ResNet50_FPN_Weights
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.transforms import functional as F
import numpy as np
import cv2
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FasterRCNNDetector:
    """
    Faster R-CNN Detector for warehouse object detection.
    
    This class provides a wrapper around PyTorch's Faster R-CNN implementation
    with additional functionality for warehouse-specific use cases.
    """
    
    def __init__(self, num_classes: Optional[int] = None, 
                 pretrained: bool = True,
                 confidence_threshold: float = 0.5):
        """
        Initialize Faster R-CNN detector.
        
        Args:
            num_classes: Number of classes (None to use COCO pretrained)
            pretrained: Whether to use pretrained weights
            confidence_threshold: Minimum confidence threshold for detections
        """
        self.num_classes = num_classes
        self.pretrained = pretrained
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Initialize model
        self._initialize_model()
        
        logger.info(f"Faster R-CNN detector initialized on {self.device}")
        
    def _initialize_model(self):
        """Initialize the Faster R-CNN model."""
        if self.pretrained and self.num_classes is None:
            # Use COCO pretrained model
            weights = FasterRCNN_ResNet50_FPN_Weights.DEFAULT
            self.model = fasterrcnn_resnet50_fpn(weights=weights)
        else:
            # Create model with custom number of classes
            self.model = fasterrcnn_resnet50_fpn(pretrained=self.pretrained)
            
            # Replace the classifier with a new one for custom classes
            if self.num_classes is not None:
                in_features = self.model.roi_heads.box_predictor.cls_score.in_features
                self.model.roi_heads.box_predictor = FastRCNNPredictor(in_features, self.num_classes)
                
        self.model.to(self.device)
        self.model.eval()
        
    def preprocess_image(self, image: Union[np.ndarray, str]) -> torch.Tensor:
        """
        Preprocess image for Faster R-CNN inference.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            
        Returns:
            Preprocessed tensor
        """
        if isinstance(image, str):
            # Load image from file
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Could not load image from {image}")
        else:
            img = image.copy()
            
        # Convert BGR to RGB
        if len(img.shape) == 3 and img.shape[2] == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
        # Convert to tensor
        tensor = F.to_tensor(img)
        return tensor.to(self.device)
    
    def detect(self, image: Union[np.ndarray, str], 
               class_names: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Detect objects in image using Faster R-CNN.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            class_names: List of class names (None for COCO classes)
            
        Returns:
            List of detection results with bounding boxes, confidence, and class
        """
        # Preprocess image
        img_tensor = self.preprocess_image(image)
        
        # Run inference
        with torch.no_grad():
            prediction = self.model([img_tensor])
            
        # Process results
        detections = []
        boxes = prediction[0]['boxes'].cpu().numpy()
        scores = prediction[0]['scores'].cpu().numpy()
        labels = prediction[0]['labels'].cpu().numpy()
        
        # COCO class names (if using pretrained model)
        coco_names = [
            '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
            'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign',
            'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
            'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag',
            'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite',
            'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
            'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana',
            'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
            'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'dining table',
            'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
            'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock',
            'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
        ]
        
        for i in range(len(boxes)):
            if scores[i] >= self.confidence_threshold:
                box = boxes[i]
                score = scores[i]
                label = labels[i]
                
                # Get class name
                if class_names and label < len(class_names):
                    class_name = class_names[label]
                elif label < len(coco_names):
                    class_name = coco_names[label]
                else:
                    class_name = f"class_{label}"
                
                detection = {
                    'bbox': box.tolist(),
                    'confidence': float(score),
                    'class_id': int(label),
                    'class_name': class_name
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
        img_tensors = [self.preprocess_image(img) for img in images]
        
        # Run batch inference
        with torch.no_grad():
            predictions = self.model(img_tensors)
            
        # Process results
        batch_detections = []
        for prediction in predictions:
            detections = []
            boxes = prediction['boxes'].cpu().numpy()
            scores = prediction['scores'].cpu().numpy()
            labels = prediction['labels'].cpu().numpy()
            
            for i in range(len(boxes)):
                if scores[i] >= self.confidence_threshold:
                    box = boxes[i]
                    score = scores[i]
                    label = labels[i]
                    
                    # For batch processing, we'll use generic class names
                    class_name = f"class_{label}"
                    
                    detection = {
                        'bbox': box.tolist(),
                        'confidence': float(score),
                        'class_id': int(label),
                        'class_name': class_name
                    }
                    detections.append(detection)
                    
            batch_detections.append(detections)
            
        return batch_detections
    
    def train(self, train_loader, num_epochs: int = 10, 
              learning_rate: float = 0.001) -> None:
        """
        Train Faster R-CNN model on custom dataset.
        
        Args:
            train_loader: DataLoader with training data
            num_epochs: Number of training epochs
            learning_rate: Learning rate for optimizer
        """
        # Set model to training mode
        self.model.train()
        
        # Create optimizer
        params = [p for p in self.model.parameters() if p.requires_grad]
        optimizer = torch.optim.SGD(params, lr=learning_rate, momentum=0.9, weight_decay=0.0005)
        
        # Training loop
        for epoch in range(num_epochs):
            epoch_loss = 0.0
            num_batches = 0
            
            for images, targets in train_loader:
                images = list(image.to(self.device) for image in images)
                targets = [{k: v.to(self.device) for k, v in t.items()} for t in targets]
                
                # Forward pass
                loss_dict = self.model(images, targets)
                losses = sum(loss for loss in loss_dict.values())
                
                # Backward pass
                optimizer.zero_grad()
                losses.backward()
                optimizer.step()
                
                epoch_loss += losses.item()
                num_batches += 1
                
            avg_loss = epoch_loss / num_batches
            logger.info(f"Epoch [{epoch+1}/{num_epochs}], Average Loss: {avg_loss:.4f}")
            
        # Set model back to evaluation mode
        self.model.eval()
        logger.info("Training completed")
    
    def save_model(self, path: str) -> None:
        """
        Save trained model to file.
        
        Args:
            path: Path to save model
        """
        torch.save(self.model.state_dict(), path)
        logger.info(f"Model saved to {path}")
    
    def load_model(self, path: str) -> None:
        """
        Load trained model from file.
        
        Args:
            path: Path to load model from
        """
        self.model.load_state_dict(torch.load(path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()
        logger.info(f"Model loaded from {path}")
    
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
            cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), 2)
            
            # Draw label
            label = f"{class_name}: {confidence:.2f}"
            cv2.putText(img, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
            
        return img

# Example usage
if __name__ == "__main__":
    # Create detector
    detector = FasterRCNNDetector()
    
    # Example detection (this would work if we had an image)
    # detections = detector.detect("path/to/image.jpg")
    # print(f"Found {len(detections)} objects")
    
    print("FasterRCNNDetector initialized successfully")