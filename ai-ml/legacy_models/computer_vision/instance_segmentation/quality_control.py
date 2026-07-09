"""
Quality Control Systems for Warehouse Computer Vision

This module provides comprehensive quality control systems for warehouse operations
using computer vision for automated inspection and reporting.
"""

import torch
import numpy as np
import cv2
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from datetime import datetime
from pathlib import Path
import json

# Import our damage detection modules
from .mask_rcnn import MaskRCNNDamageDetector
from .detailed_damage import DetailedDamageDetector, DamageSeverity

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QualityControlSystem:
    """
    Quality Control System for warehouse item inspection.
    
    This class provides a complete quality control pipeline including
    automated inspection, reporting, and anomaly detection.
    """
    
    def __init__(self, confidence_threshold: float = 0.5,
                 min_damage_severity: DamageSeverity = DamageSeverity.MINOR):
        """
        Initialize quality control system.
        
        Args:
            confidence_threshold: Minimum confidence for detections
            min_damage_severity: Minimum severity level to flag
        """
        self.confidence_threshold = confidence_threshold
        self.min_damage_severity = min_damage_severity
        self.damage_detector = MaskRCNNDamageDetector(confidence_threshold=confidence_threshold)
        self.detailed_analyzer = DetailedDamageDetector(confidence_threshold=confidence_threshold)
        self.inspection_history = []
        
        logger.info("Quality control system initialized")
        
    def inspect_item(self, image: Union[np.ndarray, str], 
                    item_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Inspect a single item for quality issues.
        
        Args:
            image: Input image (BGR numpy array or path to image)
            item_id: Optional item identifier
            
        Returns:
            Inspection results dictionary
        """
        # Generate item ID if not provided
        if item_id is None:
            item_id = f"item_{len(self.inspection_history) + 1}"
            
        # Record inspection timestamp
        timestamp = datetime.now().isoformat()
        
        # Detect damage
        try:
            detections = self.damage_detector.detect_damage(image)
        except Exception as e:
            logger.error(f"Error during damage detection: {e}")
            detections = []
            
        # Perform detailed analysis
        try:
            if isinstance(image, str):
                img_rgb = cv2.cvtColor(cv2.imread(image), cv2.COLOR_BGR2RGB)
            else:
                img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
            detailed_detections = self.detailed_analyzer.analyze_damage(img_rgb, detections)
        except Exception as e:
            logger.error(f"Error during detailed analysis: {e}")
            detailed_detections = detections
            
        # Filter significant damage
        significant_detections = self.detailed_analyzer.filter_significant_damage(
            detailed_detections, self.min_damage_severity, self.confidence_threshold)
            
        # Generate report
        report = self.detailed_analyzer.generate_damage_report(detailed_detections)
        
        # Create inspection record
        inspection_record = {
            'item_id': item_id,
            'timestamp': timestamp,
            'image_path': image if isinstance(image, str) else None,
            'total_detections': len(detections),
            'significant_detections': len(significant_detections),
            'detections': significant_detections,
            'report': report,
            'quality_status': 'PASS' if len(significant_detections) == 0 else 'FAIL'
        }
        
        # Add to history
        self.inspection_history.append(inspection_record)
        
        return inspection_record
    
    def inspect_batch(self, images: List[Union[np.ndarray, str]], 
                     item_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Inspect a batch of items for quality issues.
        
        Args:
            images: List of input images
            item_ids: Optional list of item identifiers
            
        Returns:
            List of inspection results
        """
        if item_ids is None:
            item_ids = [None] * len(images)
            
        inspection_results = []
        for image, item_id in zip(images, item_ids):
            result = self.inspect_item(image, item_id)
            inspection_results.append(result)
            
        return inspection_results
    
    def get_quality_statistics(self, time_window_hours: Optional[int] = 24) -> Dict[str, Any]:
        """
        Get quality statistics for recent inspections.
        
        Args:
            time_window_hours: Time window in hours (None for all history)
            
        Returns:
            Dictionary with quality statistics
        """
        if not self.inspection_history:
            return {'message': 'No inspection history available'}
            
        # Filter by time window if specified
        if time_window_hours is not None:
            cutoff_time = datetime.now().timestamp() - (time_window_hours * 3600)
            recent_inspections = [
                ins for ins in self.inspection_history
                if datetime.fromisoformat(ins['timestamp']).timestamp() > cutoff_time
            ]
        else:
            recent_inspections = self.inspection_history
            
        if not recent_inspections:
            return {'message': f'No inspections in the last {time_window_hours} hours'}
            
        # Calculate statistics
        total_inspections = len(recent_inspections)
        failed_inspections = sum(1 for ins in recent_inspections if ins['quality_status'] == 'FAIL')
        pass_rate = (total_inspections - failed_inspections) / total_inspections if total_inspections > 0 else 0
        
        # Aggregate damage types
        damage_type_counts = {}
        severity_counts = {}
        
        for inspection in recent_inspections:
            for detection in inspection['detections']:
                # Count damage types
                damage_type = detection.get('detailed_damage_type', 'unknown')
                damage_type_counts[damage_type] = damage_type_counts.get(damage_type, 0) + 1
                
                # Count severity levels
                severity = detection.get('damage_severity', 'NONE')
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        statistics = {
            'time_window_hours': time_window_hours,
            'total_inspections': total_inspections,
            'failed_inspections': failed_inspections,
            'pass_rate': pass_rate,
            'fail_rate': 1 - pass_rate,
            'damage_type_distribution': damage_type_counts,
            'severity_distribution': severity_counts,
            'most_common_damages': sorted(
                [(dt, count) for dt, count in damage_type_counts.items() if count > 0],
                key=lambda x: x[1], reverse=True
            )[:5]
        }
        
        return statistics
    
    def generate_inspection_report(self, output_path: str, 
                                 time_window_hours: Optional[int] = 24) -> str:
        """
        Generate a comprehensive inspection report.
        
        Args:
            output_path: Path to save the report
            time_window_hours: Time window for report data
            
        Returns:
            Path to generated report
        """
        # Get statistics
        stats = self.get_quality_statistics(time_window_hours)
        
        # Create report content
        report_content = {
            'generated_at': datetime.now().isoformat(),
            'time_window_hours': time_window_hours,
            'statistics': stats,
            'recent_inspections': self.inspection_history[-10:]  # Last 10 inspections
        }
        
        # Save report
        with open(output_path, 'w') as f:
            json.dump(report_content, f, indent=2)
            
        logger.info(f"Inspection report saved to {output_path}")
        return output_path
    
    def visualize_inspection_results(self, image: Union[np.ndarray, str], 
                                   inspection_results: Dict[str, Any]) -> np.ndarray:
        """
        Visualize inspection results on image.
        
        Args:
            image: Input image
            inspection_results: Inspection results dictionary
            
        Returns:
            Image with inspection results visualized
        """
        # Load image if path provided
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image.copy()
            
        # Draw detections
        for detection in inspection_results['detections']:
            bbox = detection['bbox']
            confidence = detection.get('damage_analysis_confidence', detection.get('confidence', 0))
            damage_type = detection.get('detailed_damage_type', 'damage')
            severity = detection.get('damage_severity', 'UNKNOWN')
            
            # Convert to int coordinates
            x1, y1, x2, y2 = map(int, bbox)
            
            # Choose color based on severity
            if severity == 'CRITICAL':
                color = (0, 0, 255)  # Red
            elif severity == 'SEVERE':
                color = (0, 165, 255)  # Orange
            elif severity == 'MODERATE':
                color = (0, 255, 255)  # Yellow
            elif severity == 'MINOR':
                color = (255, 0, 0)  # Blue
            else:
                color = (0, 255, 0)  # Green
            
            # Draw bounding box
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{damage_type}: {confidence:.2f} ({severity})"
            cv2.putText(img, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
        # Add overall status
        status = inspection_results['quality_status']
        status_color = (0, 255, 0) if status == 'PASS' else (0, 0, 255)
        cv2.putText(img, f"Status: {status}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, status_color, 2)
        
        return img
    
    def detect_anomalies(self, window_size: int = 100) -> List[Dict[str, Any]]:
        """
        Detect anomalies in quality control patterns.
        
        Args:
            window_size: Number of recent inspections to analyze
            
        Returns:
            List of detected anomalies
        """
        if len(self.inspection_history) < window_size:
            return []
            
        # Get recent inspections
        recent_inspections = self.inspection_history[-window_size:]
        
        # Calculate baseline statistics
        fail_rate_baseline = sum(1 for ins in recent_inspections[:-10] 
                               if ins['quality_status'] == 'FAIL') / len(recent_inspections[:-10])
        
        # Check for recent spike in failures
        recent_failures = sum(1 for ins in recent_inspections[-10:] 
                            if ins['quality_status'] == 'FAIL') / 10
        
        anomalies = []
        if recent_failures > fail_rate_baseline * 2 and fail_rate_baseline > 0:
            anomaly = {
                'type': 'quality_spike',
                'description': f'Failure rate increased from {fail_rate_baseline:.2%} to {recent_failures:.2%}',
                'timestamp': datetime.now().isoformat(),
                'severity': 'HIGH' if recent_failures > fail_rate_baseline * 3 else 'MEDIUM'
            }
            anomalies.append(anomaly)
            
        return anomalies

class AutomatedReportingSystem:
    """
    Automated Reporting System for quality control results.
    
    This class generates automated reports and sends notifications
    based on quality control findings.
    """
    
    def __init__(self, qc_system: QualityControlSystem):
        """
        Initialize automated reporting system.
        
        Args:
            qc_system: Quality control system to monitor
        """
        self.qc_system = qc_system
        self.report_recipients = []
        self.alert_thresholds = {
            'fail_rate': 0.1,  # 10% failure rate
            'critical_damages': 1,  # Any critical damages
            'severe_damages': 5   # More than 5 severe damages
        }
        
    def add_recipient(self, email: str, role: str = 'general'):
        """
        Add a report recipient.
        
        Args:
            email: Email address
            role: Role of recipient (general, management, quality)
        """
        self.report_recipients.append({'email': email, 'role': role})
        
    def check_alerts(self) -> List[Dict[str, Any]]:
        """
        Check for alert conditions and generate alerts.
        
        Returns:
            List of alerts to send
        """
        alerts = []
        
        # Get recent statistics
        stats = self.qc_system.get_quality_statistics(24)  # Last 24 hours
        
        # Check failure rate alert
        if stats.get('fail_rate', 0) > self.alert_thresholds['fail_rate']:
            alerts.append({
                'type': 'high_failure_rate',
                'message': f'High failure rate detected: {stats["fail_rate"]:.2%}',
                'severity': 'HIGH',
                'recipients': [r for r in self.report_recipients if r['role'] in ['general', 'management']]
            })
            
        # Check critical damage alert
        critical_damages = stats['severity_distribution'].get('CRITICAL', 0)
        if critical_damages >= self.alert_thresholds['critical_damages']:
            alerts.append({
                'type': 'critical_damages',
                'message': f'Critical damages detected: {critical_damages}',
                'severity': 'HIGH',
                'recipients': [r for r in self.report_recipients if r['role'] in ['general', 'quality']]
            })
            
        # Check severe damage alert
        severe_damages = stats['severity_distribution'].get('SEVERE', 0)
        if severe_damages >= self.alert_thresholds['severe_damages']:
            alerts.append({
                'type': 'severe_damages',
                'message': f'Severe damages detected: {severe_damages}',
                'severity': 'MEDIUM',
                'recipients': [r for r in self.report_recipients if r['role'] in ['general', 'quality']]
            })
            
        return alerts
    
    def generate_daily_report(self, output_dir: str = './reports') -> str:
        """
        Generate daily quality control report.
        
        Args:
            output_dir: Directory to save report
            
        Returns:
            Path to generated report
        """
        # Ensure output directory exists
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Generate report filename
        date_str = datetime.now().strftime('%Y-%m-%d')
        report_path = f"{output_dir}/qc_report_{date_str}.json"
        
        # Generate report using QC system
        report_path = self.qc_system.generate_inspection_report(report_path, 24)
        
        return report_path

# Example usage
if __name__ == "__main__":
    # Create quality control system
    qc_system = QualityControlSystem()
    
    # Create reporting system
    reporting_system = AutomatedReportingSystem(qc_system)
    
    print("Quality control systems initialized successfully")