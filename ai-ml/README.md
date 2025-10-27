# AI/ML Project Structure for Cognitive Supply Chain Mesh (CSCM)

This document describes the folder structure and organization of the AI/ML components for the CSCM project.

## Folder Structure

```
ai-ml/
├── config/                 # Configuration files for models and experiments
│   └── project_config.yaml # Main project configuration
├── data/                   # Data processing and storage
│   ├── raw/                # Raw data from sources
│   ├── processed/          # Cleaned and processed data
│   └── features/           # Feature stores and engineered features
├── docs/                   # Documentation for AI/ML components
├── experiments/            # Experiment tracking and results
│   ├── phase1/
│   ├── phase2/
│   ├── phase3/
│   ├── phase4/
│   └── phase5/
├── models/                 # Model implementations (modular, isolated)
│   ├── __init__.py         # Package initialization
│   ├── demand_forecasting/
│   │   ├── __init__.py     # Module initialization
│   │   ├── model.py        # Model implementation
│   │   └── README.md       # Model documentation
│   ├── inventory_optimization/
│   ├── routing_optimization/
│   ├── anomaly_detection/
│   ├── supplier_risk/
│   ├── digital_twin/
│   ├── xai/
│   ├── nlp/
│   ├── knowledge_graph/
│   ├── causal_inference/
│   ├── computer_vision/
│   ├── federated_learning/
│   ├── uncertainty_quantification/
│   └── monitoring/
├── scripts/                # Utility scripts for data processing, training, etc.
│   ├── __init__.py         # Package initialization
│   └── data_processing.py  # Data processing pipeline
├── tests/                  # Test files organized by phase and model
│   ├── phase1/
│   │   ├── demand_forecasting/
│   │   │   └── test_model.py
│   │   └── test_data_processing.py
│   ├── phase2/
│   ├── phase3/
│   ├── phase4/
│   └── phase5/
├── utils/                  # Utility functions and helpers
│   ├── __init__.py         # Package initialization
│   └── helpers.py          # Helper functions
├── requirements.txt        # Python package dependencies
├── TODO.md                 # Project roadmap and task tracking
└── README.md               # This file
```

## Design Principles

1. **Modular Isolation**: Each model type has its own directory to prevent cross-contamination
2. **Phase-based Testing**: Tests are organized by implementation phase to match the roadmap
3. **Separation of Concerns**: Data, models, experiments, and tests are clearly separated
4. **Scalable Structure**: The organization supports growth as more models are added

## Module Isolation

Each model directory contains:
- Model implementation files
- Model-specific utilities
- Model-specific configuration
- Model-specific documentation

This ensures that changes to one model do not affect others.

## Testing Organization

Tests are organized by:
1. **Phase**: Matching the implementation roadmap phases
2. **Model**: Within each phase, tests are further organized by model type

This allows for focused testing during each development phase while maintaining clear separation between different model types.

## Getting Started

1. Install dependencies: `pip install -r requirements.txt`
2. Run tests: `python -m pytest tests/`
3. Execute data processing: `python scripts/data_processing.py`

## Current Implementation Status

- ✅ Basic folder structure
- ✅ Configuration files
- ✅ Requirements specification
- ✅ Data processing pipeline (scripts)
- ✅ Demand forecasting model (Phase 1)
- ✅ Basic testing framework
- 🟡 Documentation (in progress)