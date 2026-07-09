"""
Density Estimation for Item Counting in Warehouse Computer Vision

This module provides computer vision-based counting methods using density
estimation to count items in warehouse environments.
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from scipy import ndimage
from sklearn.cluster import DBSCAN
import matplotlib.pyplot as plt

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DensityEstimator:
    """
    Density Estimator for counting items in warehouse images.
    
    This class provides various density estimation methods for counting
    items like boxes, packages, or products in warehouse environments.
    """
    
    def __init__(self, method: str = 'blob_detection', 
                 confidence_threshold: float = 0.5):
        """
        Initialize density estimator.
        
        Args:
            method: Counting method ('blob_detection', 'template_matching', 'clustering')
            confidence_threshold: Minimum confidence threshold for detections
        """
        self.method = method
        self.confidence_threshold = confidence_threshold
        
        logger.info(f"Density estimator initialized with method: {method}")
        
    def count_items_blob_detection(self, image: Union[np.ndarray, str]) -> Dict[str, Any]:
        """
        Count items using blob detection.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            
        Returns:
            Dictionary with count and detection information
        """
        # Load image if path provided
        if isinstance(image, str):
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Could not load image from {image}")
        else:
            img = image.copy()
            
        # Convert to grayscale
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
            
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (11, 11), 0)
        
        # Apply threshold to create binary image
        _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Apply morphological operations to clean up the image
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)
        
        # Set up the detector with default parameters
        params = cv2.SimpleBlobDetector_Params()
        
        # Change thresholds
        params.minThreshold = 10
        params.maxThreshold = 200
        
        # Filter by Area
        params.filterByArea = True
        params.minArea = 50
        params.maxArea = 5000
        
        # Filter by Circularity
        params.filterByCircularity = True
        params.minCircularity = 0.1
        
        # Filter by Convexity
        params.filterByConvexity = True
        params.minConvexity = 0.2
        
        # Filter by Inertia
        params.filterByInertia = True
        params.minInertiaRatio = 0.01
        
        # Create a detector with the parameters
        detector = cv2.SimpleBlobDetector_create(params)
        
        # Detect blobs
        keypoints = detector.detect(cleaned)
        
        # Calculate confidence based on blob quality
        confidences = []
        for kp in keypoints:
            # Simple confidence based on blob size and response
            size_confidence = min(1.0, kp.size / 100.0)
            response_confidence = min(1.0, kp.response / 1000.0) if kp.response > 0 else 0.5
            confidences.append((size_confidence + response_confidence) / 2)
            
        # Filter by confidence threshold
        filtered_keypoints = []
        filtered_confidences = []
        for kp, conf in zip(keypoints, confidences):
            if conf >= self.confidence_threshold:
                filtered_keypoints.append(kp)
                filtered_confidences.append(conf)
                
        count = len(filtered_keypoints)
        avg_confidence = np.mean(filtered_confidences) if filtered_confidences else 0.0
        
        return {
            'count': count,
            'confidence': avg_confidence,
            'keypoints': [{
                'x': kp.pt[0],
                'y': kp.pt[1],
                'size': kp.size,
                'response': kp.response,
                'confidence': conf
            } for kp, conf in zip(filtered_keypoints, filtered_confidences)],
            'method': 'blob_detection'
        }
    
    def count_items_template_matching(self, image: Union[np.ndarray, str], 
                                   template: Union[np.ndarray, str]) -> Dict[str, Any]:
        """
        Count items using template matching.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            template: Template image to match
            
        Returns:
            Dictionary with count and detection information
        """
        # Load images
        if isinstance(image, str):
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Could not load image from {image}")
        else:
            img = image.copy()
            
        if isinstance(template, str):
            tmpl = cv2.imread(template, 0)
            if tmpl is None:
                raise ValueError(f"Could not load template from {template}")
        else:
            if len(template.shape) == 3:
                tmpl = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)
            else:
                tmpl = template.copy()
                
        # Convert image to grayscale
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
            
        # Apply template matching
        result = cv2.matchTemplate(gray, tmpl, cv2.TM_CCOEFF_NORMED)
        
        # Find locations where matching exceeds threshold
        locations = np.where(result >= self.confidence_threshold)
        
        # Convert to list of points
        points = list(zip(locations[1], locations[0]))  # (x, y) format
        
        # Cluster nearby points to avoid counting the same object multiple times
        if len(points) > 0:
            # Use DBSCAN clustering to group nearby detections
            clustering = DBSCAN(eps=max(tmpl.shape) // 2, min_samples=1)
            cluster_labels = clustering.fit_predict(points)
            
            # Count unique clusters
            unique_clusters = len(set(cluster_labels))
            avg_confidence = np.mean(result[locations]) if len(locations[0]) > 0 else 0.0
        else:
            unique_clusters = 0
            avg_confidence = 0.0
            
        return {
            'count': unique_clusters,
            'confidence': avg_confidence,
            'locations': points,
            'method': 'template_matching'
        }
    
    def count_items_clustering(self, image: Union[np.ndarray, str]) -> Dict[str, Any]:
        """
        Count items using clustering-based density estimation.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            
        Returns:
            Dictionary with count and detection information
        """
        # Load image if path provided
        if isinstance(image, str):
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Could not load image from {image}")
        else:
            img = image.copy()
            
        # Convert to grayscale
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
            
        # Apply edge detection
        edges = cv2.Canny(gray, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours by area
        min_area = 100
        max_area = 10000
        filtered_contours = [cnt for cnt in contours if min_area < cv2.contourArea(cnt) < max_area]
        
        # Extract centroid points
        centroids = []
        for cnt in filtered_contours:
            M = cv2.moments(cnt)
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                centroids.append([cx, cy])
                
        # Cluster centroids to count distinct items
        if len(centroids) > 0:
            centroids = np.array(centroids)
            
            # Use DBSCAN clustering
            clustering = DBSCAN(eps=50, min_samples=1)
            cluster_labels = clustering.fit_predict(centroids)
            
            # Count unique clusters
            unique_clusters = len(set(cluster_labels))
            
            # Calculate average confidence based on contour properties
            confidences = []
            for cnt in filtered_contours:
                area = cv2.contourArea(cnt)
                perimeter = cv2.arcLength(cnt, True)
                # Simple confidence based on area and circularity
                circularity = 4 * np.pi * area / (perimeter * perimeter) if perimeter > 0 else 0
                area_confidence = min(1.0, area / 1000.0)
                shape_confidence = min(1.0, circularity)
                confidences.append((area_confidence + shape_confidence) / 2)
                
            avg_confidence = np.mean(confidences) if confidences else 0.0
        else:
            unique_clusters = 0
            avg_confidence = 0.0
            
        return {
            'count': unique_clusters,
            'confidence': avg_confidence,
            'centroids': centroids.tolist() if len(centroids) > 0 else [],
            'contours': len(filtered_contours),
            'method': 'clustering'
        }
    
    def count_items(self, image: Union[np.ndarray, str], 
                   template: Optional[Union[np.ndarray, str]] = None) -> Dict[str, Any]:
        """
        Count items in image using the specified method.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            template: Optional template for template matching
            
        Returns:
            Dictionary with count and detection information
        """
        if self.method == 'blob_detection':
            return self.count_items_blob_detection(image)
        elif self.method == 'template_matching':
            if template is None:
                raise ValueError("Template required for template matching method")
            return self.count_items_template_matching(image, template)
        elif self.method == 'clustering':
            return self.count_items_clustering(image)
        else:
            raise ValueError(f"Unknown method: {self.method}")
    
    def visualize_counting_results(self, image: Union[np.ndarray, str], 
                                 counting_results: Dict[str, Any]) -> np.ndarray:
        """
        Visualize counting results on image.
        
        Args:
            image: Input image
            counting_results: Counting results dictionary
            
        Returns:
            Image with counting results visualized
        """
        # Load image if path provided
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image.copy()
            
        method = counting_results['method']
        count = counting_results['count']
        confidence = counting_results['confidence']
        
        # Draw detections based on method
        if method == 'blob_detection':
            for kp_info in counting_results['keypoints']:
                x, y = int(kp_info['x']), int(kp_info['y'])
                size = int(kp_info['size'])
                conf = kp_info['confidence']
                
                # Choose color based on confidence
                if conf > 0.8:
                    color = (0, 255, 0)  # Green for high confidence
                elif conf > 0.5:
                    color = (0, 255, 255)  # Yellow for medium confidence
                else:
                    color = (0, 0, 255)  # Red for low confidence
                    
                # Draw circle
                cv2.circle(img, (x, y), size // 2, color, 2)
                
        elif method == 'template_matching':
            for loc in counting_results['locations']:
                x, y = int(loc[0]), int(loc[1])
                # Draw small circles at detection locations
                cv2.circle(img, (x, y), 5, (0, 255, 0), -1)
                
        elif method == 'clustering':
            for centroid in counting_results['centroids']:
                x, y = int(centroid[0]), int(centroid[1])
                # Draw circles at centroids
                cv2.circle(img, (x, y), 10, (255, 0, 0), 2)
                
        # Add count and confidence information
        cv2.putText(img, f"Count: {count}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(img, f"Confidence: {confidence:.2f}", (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1)
        
        return img

class CountingValidation:
    """
    Validation system for item counting accuracy.
    
    This class provides methods to validate and improve the accuracy
    of item counting systems.
    """
    
    def __init__(self):
        """Initialize counting validation system."""
        logger.info("Counting validation system initialized")
        
    def calculate_accuracy(self, predicted_count: int, 
                         ground_truth_count: int) -> Dict[str, float]:
        """
        Calculate counting accuracy metrics.
        
        Args:
            predicted_count: Predicted item count
            ground_truth_count: Actual item count
            
        Returns:
            Dictionary with accuracy metrics
        """
        # Calculate absolute error
        absolute_error = abs(predicted_count - ground_truth_count)
        
        # Calculate relative error
        if ground_truth_count > 0:
            relative_error = absolute_error / ground_truth_count
        else:
            relative_error = float('inf') if predicted_count > 0 else 0.0
            
        # Calculate accuracy percentage
        if ground_truth_count > 0:
            accuracy = max(0.0, 1.0 - relative_error)
        else:
            accuracy = 1.0 if predicted_count == 0 else 0.0
            
        return {
            'predicted_count': predicted_count,
            'ground_truth_count': ground_truth_count,
            'absolute_error': absolute_error,
            'relative_error': relative_error,
            'accuracy': accuracy
        }
    
    def validate_multiple_predictions(self, predictions: List[int], 
                                   ground_truth: int) -> Dict[str, Any]:
        """
        Validate multiple counting predictions.
        
        Args:
            predictions: List of predicted counts
            ground_truth: Actual count
            
        Returns:
            Dictionary with validation statistics
        """
        if not predictions:
            return {
                'mean_prediction': 0,
                'std_prediction': 0,
                'min_prediction': 0,
                'max_prediction': 0,
                'accuracy_stats': self.calculate_accuracy(0, ground_truth)
            }
            
        # Calculate statistics
        mean_pred = np.mean(predictions)
        std_pred = np.std(predictions)
        min_pred = np.min(predictions)
        max_pred = np.max(predictions)
        
        # Calculate accuracy for mean prediction
        accuracy_stats = self.calculate_accuracy(int(round(mean_pred)), ground_truth)
        
        return {
            'mean_prediction': mean_pred,
            'std_prediction': std_pred,
            'min_prediction': min_pred,
            'max_prediction': max_pred,
            'accuracy_stats': accuracy_stats,
            'predictions': predictions
        }

# Example usage
if __name__ == "__main__":
    # Create density estimator
    estimator = DensityEstimator()
    
    print("Density estimation systems initialized successfully")