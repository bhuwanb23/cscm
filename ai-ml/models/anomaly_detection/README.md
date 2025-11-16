# Anomaly & Outlier Detection Module

## Overview

This module provides comprehensive anomaly detection capabilities for supply chain data, including unsupervised methods, deep learning approaches, graph-based detection, and deployment infrastructure.

## Phase 1: Unsupervised Detection ✅

### Components

1. **Isolation Forest** (`unsupervised/isolation_forest.py`)
   - Tree-based isolation for anomaly detection
   - Handles high-dimensional data
   - Configurable contamination rate

2. **One-Class SVM** (`unsupervised/one_class_svm.py`)
   - Support vector machine for anomaly detection
   - Multiple kernel options
   - Decision function scores

3. **DBSCAN** (`unsupervised/dbscan.py`)
   - Density-based clustering for outlier identification
   - Noise point detection
   - Cluster analysis

## Phase 2: Deep Learning Approaches ✅

### Components

1. **Autoencoder** (`deep_learning/autoencoder.py`)
   - Neural network-based reconstruction
   - Reconstruction error for anomaly detection
   - Configurable architecture

2. **Variational Autoencoder (VAE)** (`deep_learning/vae.py`)
   - Probabilistic encoding
   - KL divergence regularization
   - Reconstruction and latent space analysis

3. **LSTM Anomaly Detector** (`deep_learning/lstm_anomaly.py`)
   - Sequence-based anomaly detection
   - Time series pattern learning
   - Prediction error analysis

## Phase 3: Graph-Based Detection ✅

### Components

1. **Graph Anomaly Detector** (`graph_based/graph_anomaly.py`)
   - Network structure analysis
   - Centrality-based features
   - Community detection

2. **Supplier Network Detector** (`graph_based/supplier_network.py`)
   - Supplier relationship analysis
   - Performance anomaly detection
   - Risk assessment

3. **Bayesian Changepoint Detector** (`graph_based/bayesian_changepoint.py`)
   - Time series changepoint detection
   - Dynamic programming approach
   - Segment parameter estimation

## Phase 4: Integration & Deployment ✅

### Components

1. **Continual Learning** (`deployment/continual_learning.py`)
   - Incremental model updates
   - Memory buffer management
   - Adaptive learning

2. **Threshold Calibration** (`deployment/threshold_calibration.py`)
   - Precision/recall optimization
   - False positive reduction
   - Threshold analysis

3. **Risk Dashboard Integration** (`deployment/risk_dashboard.py`)
   - Alert management
   - Dashboard data generation
   - Statistics tracking

4. **Anomaly Playbook** (`deployment/playbook.py`)
   - Automated response rules
   - Action execution
   - Playbook management

## Usage Examples

### Isolation Forest

```python
from models.anomaly_detection import IsolationForestDetector

detector = IsolationForestDetector(contamination=0.1)
detector.fit(X_train)
predictions, scores, info = detector.detect_anomalies(X_test)
```

### Autoencoder

```python
from models.anomaly_detection import AutoencoderDetector

detector = AutoencoderDetector(encoding_dim=32, epochs=50)
detector.fit(X_train)
predictions, scores, info = detector.detect_anomalies(X_test)
```

### Supplier Network

```python
from models.anomaly_detection import SupplierNetworkDetector
import pandas as pd

detector = SupplierNetworkDetector()
supplier_data = pd.read_csv('supplier_data.csv')
detector.build_supplier_network(supplier_data)
predictions, scores, info = detector.detect_anomalies()
```

### Threshold Calibration

```python
from models.anomaly_detection import AlertThresholdCalibrator

calibrator = AlertThresholdCalibrator(target_precision=0.9)
results = calibrator.calibrate(scores, labels)
calibrated_predictions = calibrator.apply_threshold(scores)
```

## Testing

Run tests with:

```bash
# All tests
pytest tests/anomaly_detection/ -v

# Phase-specific tests
pytest tests/anomaly_detection/phase1/ -v
pytest tests/anomaly_detection/phase2/ -v
pytest tests/anomaly_detection/phase3/ -v
pytest tests/anomaly_detection/phase4/ -v
```

## Dependencies

- scikit-learn (required)
- numpy
- pandas
- torch (for deep learning models)
- networkx (for graph-based models)
- scipy (for Bayesian changepoint)

## Notes

- All models support save/load functionality
- Deep learning models require PyTorch
- Graph-based models require NetworkX
- Models are designed for production use with proper error handling

