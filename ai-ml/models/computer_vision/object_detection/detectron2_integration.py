"""
Detectron2 Integration for Warehouse Computer Vision

This module provides integration with Detectron2 for advanced object detection
and instance segmentation tasks in warehouse environments.
"""

import torch
import numpy as np
import cv2
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from pathlib import Path
import yaml

# Try to import Detectron2
try:
    from detectron2.engine import DefaultPredictor, DefaultTrainer
    from detectron2.config import get_cfg
    from detectron2 import model_zoo
    from detectron2.data import MetadataCatalog, DatasetCatalog
    from detectron2.structures import BoxMode
    import detectron2.data.transforms as T
    DETECTRON2_AVAILABLE = True
except ImportError:
    DETECTRON2_AVAILABLE = False
    logging.warning("Detectron2 not available. Some features will be disabled.")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Detectron2Detector:
    """
    Detectron2 Detector for advanced warehouse computer vision tasks.
    
    This class provides a wrapper around Detectron2 with pre-configured
    models and warehouse-specific configurations.
    """
    
    def __init__(self, model_config: Optional[str] = None, 
                 model_weights: Optional[str] = None,
                 confidence_threshold: float = 0.5):
        """
        Initialize Detectron2 detector.
        
        Args:
            model_config: Path to model config file or model zoo config
            model_weights: Path to model weights or model zoo weights
            confidence_threshold: Minimum confidence threshold for detections
        """
        if not DETECTRON2_AVAILABLE:
            raise ImportError("Detectron2 is not installed. Please install it to use this feature.")
            
        self.model_config = model_config
        self.model_weights = model_weights
        self.confidence_threshold = confidence_threshold
        self.predictor = None
        self.cfg = None
        
        # Initialize model
        self._initialize_model()
        
        logger.info("Detectron2 detector initialized")
        
    def _initialize_model(self):
        """Initialize the Detectron2 model."""
        # Create config
        self.cfg = get_cfg()
        
        if self.model_config:
            # Load custom config
            self.cfg.merge_from_file(self.model_config)
        else:
            # Use default config from model zoo
            self.cfg.merge_from_file(model_zoo.get_config_file(
                "COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml"))
                
        # Set model weights
        if self.model_weights:
            self.cfg.MODEL.WEIGHTS = self.model_weights
        else:
            self.cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(
                "COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml")
                
        # Set confidence threshold
        self.cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = self.confidence_threshold
        
        # Create predictor
        self.predictor = DefaultPredictor(self.cfg)
        
    def preprocess_image(self, image: Union[np.ndarray, str]) -> np.ndarray:
        """
        Preprocess image for Detectron2 inference.
        
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
            
        return img
    
    def detect(self, image: Union[np.ndarray, str]) -> List[Dict[str, Any]]:
        """
        Detect objects in image using Detectron2.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            
        Returns:
            List of detection results with bounding boxes, confidence, and class
        """
        # Preprocess image
        img = self.preprocess_image(image)
        
        # Run inference
        outputs = self.predictor(img)
        
        # Process results
        detections = []
        instances = outputs["instances"].to("cpu")
        
        boxes = instances.pred_boxes.tensor.numpy()
        scores = instances.scores.numpy()
        classes = instances.pred_classes.numpy()
        
        # Get class names from metadata
        metadata = MetadataCatalog.get(self.cfg.DATASETS.TRAIN[0] if self.cfg.DATASETS.TRAIN else "__unused")
        class_names = metadata.get("thing_classes", [f"class_{i}" for i in range(1000)])
        
        for i in range(len(boxes)):
            if scores[i] >= self.confidence_threshold:
                box = boxes[i]
                score = scores[i]
                class_id = classes[i]
                
                # Get class name
                class_name = class_names[class_id] if class_id < len(class_names) else f"class_{class_id}"
                
                detection = {
                    'bbox': box.tolist(),
                    'confidence': float(score),
                    'class_id': int(class_id),
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
        # Process each image individually (Detectron2 doesn't have native batch support)
        batch_detections = []
        for image in images:
            detections = self.detect(image)
            batch_detections.append(detections)
            
        return batch_detections
    
    def train(self, config_file: str, num_gpus: int = 1) -> str:
        """
        Train Detectron2 model on custom dataset.
        
        Args:
            config_file: Path to training configuration file
            num_gpus: Number of GPUs to use for training
            
        Returns:
            Path to trained model
        """
        # Load configuration
        cfg = get_cfg()
        cfg.merge_from_file(config_file)
        cfg.freeze()
        
        # Create trainer
        trainer = DefaultTrainer(cfg)
        trainer.resume_or_load(resume=False)
        
        # Train model
        trainer.train()
        
        # Return model path
        model_path = cfg.OUTPUT_DIR
        logger.info(f"Model trained and saved to {model_path}")
        return model_path
    
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
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 2)
            
            # Draw label
            label = f"{class_name}: {confidence:.2f}"
            cv2.putText(img, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            
        return img

class Detectron2ConfigManager:
    """
    Configuration manager for Detectron2 models.
    
    This class helps manage and create configuration files for Detectron2 models.
    """
    
    @staticmethod
    def create_warehouse_config(num_classes: int, 
                              output_dir: str = "./output",
                              base_config: str = "COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml") -> Dict[str, Any]:
        """
        Create configuration for warehouse object detection.
        
        Args:
            num_classes: Number of classes in the dataset
            output_dir: Directory to save training outputs
            base_config: Base configuration from model zoo
            
        Returns:
            Configuration dictionary
        """
        if not DETECTRON2_AVAILABLE:
            raise ImportError("Detectron2 is not installed.")
            
        # Get base configuration
        cfg = get_cfg()
        cfg.merge_from_file(model_zoo.get_config_file(base_config))
        
        # Modify for warehouse use case
        cfg.DATASETS.TRAIN = ("warehouse_train",)
        cfg.DATASETS.TEST = ("warehouse_val",)
        cfg.DATALOADER.NUM_WORKERS = 2
        cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(base_config)
        cfg.SOLVER.IMS_PER_BATCH = 2
        cfg.SOLVER.BASE_LR = 0.00025
        cfg.SOLVER.MAX_ITER = 1000
        cfg.SOLVER.STEPS = []
        cfg.MODEL.ROI_HEADS.BATCH_SIZE_PER_IMAGE = 128
        cfg.MODEL.ROI_HEADS.NUM_CLASSES = num_classes
        cfg.OUTPUT_DIR = output_dir
        
        return cfg
    
    @staticmethod
    def save_config(config: Dict[str, Any], path: str) -> None:
        """
        Save configuration to file.
        
        Args:
            config: Configuration dictionary
            path: Path to save configuration
        """
        # This is a simplified implementation
        # In practice, you would use cfg.dump() method
        with open(path, 'w') as f:
            yaml.dump(config, f)
        logger.info(f"Configuration saved to {path}")

# Example usage
if __name__ == "__main__":
    if DETECTRON2_AVAILABLE:
        # Create detector
        detector = Detectron2Detector()
        
        # Example detection (this would work if we had an image)
        # detections = detector.detect("path/to/image.jpg")
        # print(f"Found {len(detections)} objects")
        
        print("Detectron2Detector initialized successfully")
    else:
        print("Detectron2 is not available. Install it to use this feature.")