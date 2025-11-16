# Anomaly Detection Tests

## Overview

Comprehensive test suite for the Anomaly & Outlier Detection module covering all 4 phases.

## Test Structure

```
tests/anomaly_detection/
├── phase1/          # Unsupervised Detection Tests
│   ├── test_isolation_forest.py
│   ├── test_one_class_svm.py
│   └── test_dbscan.py
├── phase2/          # Deep Learning Tests
│   ├── test_autoencoder.py
│   ├── test_vae.py
│   └── test_lstm_anomaly.py
├── phase3/          # Graph-Based Tests
│   ├── test_graph_anomaly.py
│   ├── test_supplier_network.py
│   └── test_bayesian_changepoint.py
└── phase4/          # Deployment Tests
    ├── test_continual_learning.py
    ├── test_threshold_calibration.py
    ├── test_risk_dashboard.py
    └── test_playbook.py
```

## Running Tests

### All Tests
```bash
# Activate venv first
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Run all tests
pytest tests/anomaly_detection/ -v
```

### Phase-Specific Tests
```bash
# Phase 1: Unsupervised Detection
pytest tests/anomaly_detection/phase1/ -v

# Phase 2: Deep Learning
pytest tests/anomaly_detection/phase2/ -v

# Phase 3: Graph-Based
pytest tests/anomaly_detection/phase3/ -v

# Phase 4: Deployment
pytest tests/anomaly_detection/phase4/ -v
```

### Specific Test File
```bash
pytest tests/anomaly_detection/phase1/test_isolation_forest.py -v
```

## Test Coverage

### Phase 1: Unsupervised Detection (8 tests)
- ✅ Isolation Forest initialization, fitting, prediction, and detection
- ✅ One-Class SVM initialization, fitting, and prediction
- ✅ DBSCAN initialization, fitting, and detection

### Phase 2: Deep Learning (12 tests)
- ✅ Autoencoder initialization, fitting, prediction, and detection
- ✅ VAE initialization, fitting, prediction, and detection
- ✅ LSTM Anomaly Detector initialization, fitting, prediction, and detection

### Phase 3: Graph-Based (12 tests)
- ✅ Graph Anomaly Detector initialization, graph building, feature computation, and detection
- ✅ Supplier Network Detector initialization, network building, detection, and risk assessment
- ✅ Bayesian Changepoint Detector initialization, fitting, detection, and summary

### Phase 4: Deployment (22 tests)
- ✅ Continual Learning initialization, update, prediction, detection, and statistics
- ✅ Threshold Calibration initialization, calibration, threshold application, and analysis
- ✅ Risk Dashboard initialization, alert creation, sending, batch operations, and statistics
- ✅ Anomaly Playbook initialization, rule addition, execution, batch execution, and history

## Total: 54 tests passing ✅

## Dependencies

Tests require:
- pytest
- numpy
- scikit-learn
- torch (for Phase 2 tests)
- networkx (for Phase 3 tests)
- pandas (for some Phase 3 tests)

## Notes

- Tests are designed to run with optional dependencies gracefully skipped if not available
- All tests use random seeds for reproducibility
- Test data is generated programmatically to avoid external dependencies
- Tests cover both happy paths and edge cases

