"""
Validation script for model wrapper classes.
This script demonstrates the functionality of all model wrappers.
"""

import sys
import os
import numpy as np
import pandas as pd

# Add the api directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models.model_wrappers import (
    DemandForecastingModel,
    InventoryOptimizationModel,
    AnomalyDetectionModel,
    CustomerDemandModel,
    ContinualLearningModel,
    UncertaintyQuantificationModel,
    ModelMonitoringModel
)


def validate_demand_forecasting():
    """Validate demand forecasting model wrapper."""
    print("Validating DemandForecastingModel...")
    
    # Initialize model
    model = DemandForecastingModel()
    print("✓ Model initialized")
    
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=100)
    sales = np.random.randint(50, 200, 100)
    
    data = pd.DataFrame({
        'date': dates.strftime('%Y-%m-%d'),
        'sales': sales,
        'product_id': 1
    })
    
    # Split data
    train_data = data.iloc[:80]
    test_data = data.iloc[80:]
    
    # Train model
    model.train(train_data)
    print("✓ Model trained")
    
    # Make predictions
    predictions = model.predict(test_data)
    print(f"✓ Predictions made: {len(predictions)} predictions")
    
    # Evaluate model
    true_values = test_data['sales'].values
    metrics = model.evaluate(test_data, true_values)
    print(f"✓ Model evaluated: MAE={metrics['mae']:.2f}, RMSE={metrics['rmse']:.2f}")
    
    print("DemandForecastingModel validation completed.\n")


def validate_inventory_optimization():
    """Validate inventory optimization model wrapper."""
    print("Validating InventoryOptimizationModel...")
    
    # Initialize model
    model = InventoryOptimizationModel(holding_cost=1.0, shortage_cost=2.0)
    print("✓ Model initialized")
    
    # Create sample data
    historical_demand = np.random.normal(100, 20, 100)  # Mean=100, Std=20
    
    # Fit model
    model.fit(historical_demand)
    print("✓ Model fitted")
    
    # Optimize
    optimal_qty = model.optimize()
    print(f"✓ Optimization completed: Optimal quantity = {optimal_qty:.2f}")
    
    print("InventoryOptimizationModel validation completed.\n")


def validate_anomaly_detection():
    """Validate anomaly detection model wrapper."""
    print("Validating AnomalyDetectionModel...")
    
    # Initialize model
    model = AnomalyDetectionModel(contamination=0.1)
    print("✓ Model initialized")
    
    # Create sample data
    normal_data = np.random.normal(0, 1, (90, 5))  # 90 normal samples
    anomaly_data = np.random.normal(5, 1, (10, 5))  # 10 anomaly samples
    X = np.vstack([normal_data, anomaly_data])
    
    # Fit model
    model.fit(X)
    print("✓ Model fitted")
    
    # Detect anomalies
    predictions, scores, info = model.detect_anomalies(X)
    print(f"✓ Anomaly detection completed: {info['num_anomalies']} anomalies detected")
    
    print("AnomalyDetectionModel validation completed.\n")


def validate_placeholder_models():
    """Validate placeholder models."""
    print("Validating placeholder models...")
    
    # Customer Demand Model
    try:
        customer_model = CustomerDemandModel()
        customer_model.analyze(None)
    except NotImplementedError:
        print("✓ CustomerDemandModel correctly raises NotImplementedError")
    
    # Continual Learning Model
    try:
        cl_model = ContinualLearningModel()
        cl_model.update(None)
    except NotImplementedError:
        print("✓ ContinualLearningModel correctly raises NotImplementedError")
    
    # Uncertainty Quantification Model
    try:
        uq_model = UncertaintyQuantificationModel()
        uq_model.quantify(None)
    except NotImplementedError:
        print("✓ UncertaintyQuantificationModel correctly raises NotImplementedError")
    
    # Model Monitoring Model
    try:
        mm_model = ModelMonitoringModel()
        mm_model.monitor(None)
    except NotImplementedError:
        print("✓ ModelMonitoringModel correctly raises NotImplementedError")
    
    print("Placeholder models validation completed.\n")


def main():
    """Main validation function."""
    print("Model Wrapper Validation Script")
    print("=" * 40)
    
    try:
        validate_demand_forecasting()
        validate_inventory_optimization()
        validate_anomaly_detection()
        validate_placeholder_models()
        
        print("All validations completed successfully!")
        
    except Exception as e:
        print(f"Validation failed with error: {e}")
        raise


if __name__ == "__main__":
    main()