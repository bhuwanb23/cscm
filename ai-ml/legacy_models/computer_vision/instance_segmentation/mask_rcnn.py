"""
Mask R-CNN Implementation for Damage Assessment in Warehouse Computer Vision

This module provides a PyTorch-based Mask R-CNN implementation for instance segmentation
to detect and assess damage in warehouse environments.
"""

import torch
import torch.nn as nn
import torchvision
from torchvision.models.detection import maskrcnn_resnet50_fpn, MaskRCNN_ResNet50_FPN_Weights
from torchvision.models.detection.mask_rcnn import MaskRCNNPredictor
from torchvision.transforms import functional as F
import numpy as np
import cv2
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MaskRCNNDamageDetector:
    """
    Mask R-CNN Detector for damage assessment in warehouse environments.
    
    This class provides instance segmentation capabilities to detect damaged items
    and assess the extent of damage in warehouse settings.
    """
    
    def __init__(self, num_classes: Optional[int] = None, 
                 pretrained: bool = True,
                 confidence_threshold: float = 0.5,
                 mask_threshold: float = 0.5):
        """
        Initialize Mask R-CNN damage detector.
        
        Args:
            num_classes: Number of classes (None to use COCO pretrained)
            pretrained: Whether to use pretrained weights
            confidence_threshold: Minimum confidence threshold for detections
            mask_threshold: Threshold for mask binarization
        """
        self.num_classes = num_classes
        self.pretrained = pretrained
        self.confidence_threshold = confidence_threshold
        self.mask_threshold = mask_threshold
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Initialize model
        self._initialize_model()
        
        logger.info(f"Mask R-CNN damage detector initialized on {self.device}")
        
    def _initialize_model(self):
        """Initialize the Mask R-CNN model."""
        if self.pretrained and self.num_classes is None:
            # Use COCO pretrained model
            weights = MaskRCNN_ResNet50_FPN_Weights.DEFAULT
            self.model = maskrcnn_resnet50_fpn(weights=weights)
        else:
            # Create model with custom number of classes
            self.model = maskrcnn_resnet50_fpn(pretrained=self.pretrained)
            
            # Replace the classifier with a new one for custom classes
            if self.num_classes is not None:
                # Replace box predictor
                in_features_box = self.model.roi_heads.box_predictor.cls_score.in_features
                self.model.roi_heads.box_predictor = MaskRCNNPredictor(
                    in_features_box, self.num_classes, self.num_classes)
                
                # Replace mask predictor
                in_features_mask = self.model.roi_heads.mask_predictor.conv5_mask.in_channels
                self.model.roi_heads.mask_predictor = MaskRCNNPredictor(
                    in_features_mask, self.num_classes, self.num_classes)
                
        self.model.to(self.device)
        self.model.eval()
        
    def preprocess_image(self, image: Union[np.ndarray, str]) -> torch.Tensor:
        """
        Preprocess image for Mask R-CNN inference.
        
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
    
    def detect_damage(self, image: Union[np.ndarray, str], 
                      damage_classes: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Detect and segment damaged items in image.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            damage_classes: List of damage class names to detect
            
        Returns:
            List of detection results with bounding boxes, masks, confidence, and damage info
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
        masks = prediction[0]['masks'].cpu().numpy()
        
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
        
        # Damage class mappings (these would be customized for warehouse use)
        damage_indicators = {
            'broken': ['vase', 'bottle', 'cup', 'bowl'],
            'damaged': ['laptop', 'tv', 'cell phone', 'keyboard'],
            'torn': ['backpack', 'handbag', 'tie', 'suitcase'],
            'dented': ['car', 'truck', 'motorcycle', 'bicycle']
        }
        
        for i in range(len(boxes)):
            if scores[i] >= self.confidence_threshold:
                box = boxes[i]
                score = scores[i]
                label = labels[i]
                mask = masks[i][0]  # First channel of mask
                
                # Get class name
                if label < len(coco_names):
                    class_name = coco_names[label]
                else:
                    class_name = f"class_{label}"
                
                # Check if this is a damage-indicating class
                damage_type = None
                for dmg_type, dmg_classes in damage_indicators.items():
                    if class_name in dmg_classes:
                        damage_type = dmg_type
                        break
                
                # Binarize mask
                binary_mask = (mask > self.mask_threshold).astype(np.uint8)
                
                # Calculate damage metrics
                mask_area = np.sum(binary_mask)
                damage_severity = self._calculate_damage_severity(mask, binary_mask)
                
                detection = {
                    'bbox': box.tolist(),
                    'mask': binary_mask.tolist(),
                    'confidence': float(score),
                    'class_id': int(label),
                    'class_name': class_name,
                    'damage_type': damage_type,
                    'damage_severity': damage_severity,
                    'mask_area': int(mask_area)
                }
                detections.append(detection)
                
        return detections
    
    def _calculate_damage_severity(self, mask: np.ndarray, binary_mask: np.ndarray) -> float:
        """
        Calculate damage severity based on mask characteristics.
        
        Args:
            mask: Raw mask probabilities
            binary_mask: Binarized mask
            
        Returns:
            Damage severity score (0.0 to 1.0)
        """
        # Simple severity calculation based on mask confidence and area
        if np.sum(binary_mask) == 0:
            return 0.0
            
        # Average confidence in the masked region
        masked_confidence = np.sum(mask * binary_mask) / np.sum(binary_mask)
        
        # Normalize to 0-1 range (this is a simplified approach)
        severity = masked_confidence * 0.7 + (np.sum(binary_mask) / 10000) * 0.3
        return min(1.0, severity)
    
    def detect_batch(self, images: List[Union[np.ndarray, str]]) -> List[List[Dict[str, Any]]]:
        """
        Detect damage in batch of images.
        
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
            masks = prediction['masks'].cpu().numpy()
            
            for i in range(len(boxes)):
                if scores[i] >= self.confidence_threshold:
                    box = boxes[i]
                    score = scores[i]
                    label = labels[i]
                    mask = masks[i][0]  # First channel of mask
                    
                    # For batch processing, we'll use generic class names
                    class_name = f"class_{label}"
                    
                    # Binarize mask
                    binary_mask = (mask > self.mask_threshold).astype(np.uint8)
                    
                    # Calculate damage metrics
                    mask_area = np.sum(binary_mask)
                    damage_severity = self._calculate_damage_severity(mask, binary_mask)
                    
                    detection = {
                        'bbox': box.tolist(),
                        'mask': binary_mask.tolist(),
                        'confidence': float(score),
                        'class_id': int(label),
                        'class_name': class_name,
                        'damage_type': None,  # Would need more context for batch
                        'damage_severity': damage_severity,
                        'mask_area': int(mask_area)
                    }
                    detections.append(detection)
                    
            batch_detections.append(detections)
            
        return batch_detections
    
    def train(self, train_loader, num_epochs: int = 10, 
              learning_rate: float = 0.001) -> None:
        """
        Train Mask R-CNN model on custom damage dataset.
        
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
        Visualize damage detections on image.
        
        Args:
            image: Input image
            detections: List of detection results
            
        Returns:
            Image with bounding boxes, masks, and damage info drawn
        """
        # Load image if path provided
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image.copy()
            
        # Draw detections
        for detection in detections:
            bbox = detection['bbox']
            mask = np.array(detection['mask'])
            confidence = detection['confidence']
            class_name = detection['class_name']
            damage_type = detection['damage_type']
            damage_severity = detection['damage_severity']
            
            # Convert to int coordinates
            x1, y1, x2, y2 = map(int, bbox)
            
            # Draw bounding box
            color = (0, 0, 255) if damage_type else (0, 255, 0)  # Red for damage, green otherwise
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            
            # Draw mask overlay
            if mask.shape == img.shape[:2]:  # Check if mask matches image dimensions
                # Create overlay
                overlay = img.copy()
                overlay[mask > 0] = [0, 255, 255]  # Cyan for mask
                cv2.addWeighted(overlay, 0.3, img, 0.7, 0, img)
            
            # Draw label
            label_parts = [class_name, f"{confidence:.2f}"]
            if damage_type:
                label_parts.append(f"{damage_type}:{damage_severity:.2f}")
            label = " ".join(label_parts)
            
            cv2.putText(img, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
        return img

# Example usage
if __name__ == "__main__":
    # Create detector
    detector = MaskRCNNDamageDetector()
    
    # Example detection (this would work if we had an image)
    # detections = detector.detect_damage("path/to/image.jpg")
    # print(f"Found {len(detections)} objects with damage info")
    
    print("MaskRCNNDamageDetector initialized successfully")