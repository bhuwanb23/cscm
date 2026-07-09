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
    """Validate now-implemented models (formerly placeholders).

    These models have real implementations and return structured dicts
    rather than raising NotImplementedError. Tests verify expected shapes.
    """
    print("Validating implemented models (formerly placeholders)...")

    # Customer Demand Model
    customer_model = CustomerDemandModel()
    no_data = customer_model.analyze({})
    assert 'error' in no_data and no_data['error'] == 'no data', "CustomerDemandModel no-data path failed"
    with_data = customer_model.analyze({'historical_data': list(range(15)), 'time_horizon_days': 3})
    assert 'forecast' in with_data and len(with_data['forecast']) == 3, "CustomerDemandModel with-data path failed"
    print("✓ CustomerDemandModel returns expected dicts")

    # Continual Learning Model
    cl_model = ContinualLearningModel(n_features=5)
    cl_result = cl_model.update({})
    assert 'mse' in cl_result and 'training_step' in cl_result, "ContinualLearningModel.update failed"
    assert cl_result['training_step'] == 1, "ContinualLearningModel training_step should start at 1"
    cl_second = cl_model.update({})
    assert cl_second['training_step'] == 2, "ContinualLearningModel training_step should increment"
    try:
        cl_model.update(None)
        assert False, "ContinualLearningModel.update(None) should raise AttributeError"
    except AttributeError:
        pass
    print("✓ ContinualLearningModel returns mse + training_step, raises on None")

    # Uncertainty Quantification Model
    uq_model = UncertaintyQuantificationModel(input_dim=4)
    uq_result = uq_model.quantify({})
    assert 'prediction' in uq_result, "UncertaintyQuantificationModel missing prediction"
    assert 'uncertainty' in uq_result, "UncertaintyQuantificationModel missing uncertainty"
    assert 'epistemic' in uq_result['uncertainty'], "missing epistemic"
    assert 'aleatoric' in uq_result['uncertainty'], "missing aleatoric"
    assert 'confidence_interval' in uq_result, "missing confidence_interval"
    assert uq_result['confidence_interval']['lower'] < uq_result['confidence_interval']['upper'], \
        "CI lower must be < upper"
    print("✓ UncertaintyQuantificationModel returns prediction + uncertainty + CI")

    # Model Monitoring Model
    mm_model = ModelMonitoringModel(model_id='validation-model')
    mm_result = mm_model.monitor({'y_true': 1.0, 'y_pred': 1.0})
    assert 'model_id' in mm_result, "ModelMonitoringModel missing model_id"
    assert 'total_predictions' in mm_result, "ModelMonitoringModel missing total_predictions"
    assert 'drift_detected' in mm_result, "ModelMonitoringModel missing drift_detected"
    assert mm_result['drift_detected'] is False, "ModelMonitoringModel should not detect drift on close values"
    print("✓ ModelMonitoringModel returns id, count, and drift flag")

    print("Implemented models validation completed.\n")


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