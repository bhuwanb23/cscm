"""
Demand Forecasting Model for CSCM AI/ML System

This module implements demand forecasting models for the Cognitive Supply Chain Mesh.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import logging
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DemandForecaster:
    """Base class for demand forecasting models."""

    def __init__(self, model_type="random_forest"):
        self.model_type = model_type
        self.model = None
        self.is_trained = False
        self.feature_columns = None
        self.target_column = None

    def _detect_target(self, data):
        for col in ("sales_quantity", "sales_amount", "sales", "quantity", "demand"):
            if col in data.columns:
                return col
        if "date" in data.columns:
            numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
            if numeric_cols:
                return numeric_cols[0]
        raise ValueError("Could not detect target column")

    def _select_features(self, data, target_col):
        exclude = {target_col, "date", "hour", "holiday_name", "sku_id", "store_id",
                   "product_id", "store_name", "location", "store_type"}
        suffix_pattern = re.compile(r"_(inventory|price)$")
        features = []
        for col in data.columns:
            if col in exclude:
                continue
            if suffix_pattern.search(col):
                continue
            dtype = data[col].dtype
            if dtype in (np.int64, np.float64, bool, "int64", "float64", "bool"):
                features.append(col)
        return features

    def _prepare_features(self, data, is_training=False):
        data = data.copy()

        if "date" in data.columns:
            data["date"] = pd.to_datetime(data["date"])

        target_col = self._detect_target(data)

        if is_training:
            self.target_column = target_col

        features = self._select_features(data, target_col)

        data = data.sort_values("date").reset_index(drop=True)

        n = len(data)
        target_vals = data[target_col].astype(float)

        for lag in (1, 7, 30):
            if lag >= n:
                continue
            col = f"{target_col}_lag_{lag}"
            data[col] = target_vals.shift(lag)
            features.append(col)

        for window in (7, 30):
            if window >= n:
                continue
            roll_mean = target_vals.rolling(window=window, min_periods=2).mean()
            roll_std = target_vals.rolling(window=window, min_periods=2).std()
            data[f"{target_col}_roll_{window}_mean"] = roll_mean
            data[f"{target_col}_roll_{window}_std"] = roll_std
            features.append(f"{target_col}_roll_{window}_mean")
            features.append(f"{target_col}_roll_{window}_std")

        features = [f for f in features if f in data.columns]
        data = data.drop(columns=[c for c in data.columns if c not in features + [target_col] and c != "date"], errors="ignore")

        if is_training:
            self.feature_columns = features

        return data

    def train(self, train_data, target_column=None):
        logger.info(f"Training {self.model_type} demand forecasting model")

        train_data = self._prepare_features(train_data, is_training=True)
        target_col = target_column or self.target_column

        train_data = train_data.dropna()
        if len(train_data) == 0:
            raise ValueError("Not enough data to train model after removing NaN values")

        X = train_data[self.feature_columns]
        y = train_data[target_col]

        if self.model_type == "random_forest":
            self.model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10, min_samples_leaf=3)
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")

        self.model.fit(X, y)
        self.is_trained = True
        logger.info(f"Model training completed — {len(self.feature_columns)} features, {len(y)} samples")

    def predict(self, test_data):
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        logger.info("Making demand forecasts")

        test_data = self._prepare_features(test_data, is_training=False)
        test_data = test_data.dropna()

        if len(test_data) == 0:
            raise ValueError("Not enough data to make predictions after removing NaN values")

        for col in self.feature_columns:
            if col not in test_data.columns:
                test_data[col] = 0.0

        X = test_data[self.feature_columns]

        predictions = self.model.predict(X)
        return predictions

    def forecast(self, future_dates, context_data=None, feature_defaults=None):
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        logger.info(f"Recursive forecast for {len(future_dates)} periods")

        n = len(future_dates)
        target_col = self.target_column
        if target_col not in self.feature_columns:
            target_lag_cols = [c for c in self.feature_columns if target_col in c]
        else:
            target_lag_cols = []

        window = pd.DataFrame({"date": future_dates, target_col: 0.0})
        if feature_defaults:
            for col, val in feature_defaults.items():
                if col in self.feature_columns:
                    window[col] = val

        ctx = None
        if context_data is not None and isinstance(context_data, pd.DataFrame) and target_col in context_data.columns:
            ctx = context_data.copy()
            if "date" in ctx.columns:
                ctx["date"] = pd.to_datetime(ctx["date"])
            ctx = ctx.sort_values("date").reset_index(drop=True)

        predictions = []
        for i in range(n):
            row = window.iloc[[i]].copy()
            if ctx is not None and len(ctx) > 0:
                for offset in range(1, len(ctx) + 1):
                    src = ctx.iloc[-offset]
                    lag_name = f"{target_col}_lag_{offset}" if f"{target_col}_lag_{offset}" in self.feature_columns else None
                    if lag_name and lag_name in self.feature_columns:
                        row[lag_name] = float(src[target_col])
                for window_size in (7, 30):
                    if window_size <= len(ctx):
                        slice_vals = ctx[target_col].iloc[-window_size:].values.astype(float)
                        mean_name = f"{target_col}_roll_{window_size}_mean"
                        std_name = f"{target_col}_roll_{window_size}_std"
                        if mean_name in self.feature_columns:
                            row[mean_name] = float(np.mean(slice_vals))
                        if std_name in self.feature_columns:
                            row[std_name] = float(np.std(slice_vals))

            for col in self.feature_columns:
                if col not in row.columns:
                    row[col] = 0.0

            X = row[self.feature_columns]
            pred = float(self.model.predict(X)[0])
            predictions.append(pred)

            if ctx is not None:
                new_row = pd.DataFrame({target_col: pred, "date": future_dates[i]})
                ctx = pd.concat([ctx, new_row], ignore_index=True)

            if i + 1 < n:
                window.loc[i + 1, target_col] = pred
                for offset in range(1, min(n - i, 31)):
                    lag_name = f"{target_col}_lag_{offset}"
                    if lag_name in self.feature_columns:
                        if i >= offset:
                            window.loc[i + 1, lag_name] = predictions[i - offset + 1]
                        elif ctx is not None and offset <= len(ctx):
                            window.loc[i + 1, lag_name] = float(ctx[target_col].iloc[-offset])
                for window_size in (7, 30):
                    mean_name = f"{target_col}_roll_{window_size}_mean"
                    std_name = f"{target_col}_roll_{window_size}_std"
                    if mean_name in self.feature_columns or std_name in self.feature_columns:
                        lookback = min(window_size, len(predictions) + len(ctx) if ctx is not None else len(predictions))
                        vals = []
                        if ctx is not None:
                            vals.extend(ctx[target_col].iloc[-lookback:].values)
                        vals.extend(predictions[-lookback:])
                        vals = vals[-lookback:]
                        if len(vals) >= 2:
                            arr = np.array(vals, dtype=float)
                            if mean_name in self.feature_columns:
                                window.loc[i + 1, mean_name] = float(np.mean(arr))
                            if std_name in self.feature_columns:
                                window.loc[i + 1, std_name] = float(np.std(arr))

        return np.array(predictions)

    def evaluate(self, test_data, true_values):
        predictions = self.predict(test_data)

        mae = mean_absolute_error(true_values[-len(predictions):], predictions)
        rmse = np.sqrt(mean_squared_error(true_values[-len(predictions):], predictions))

        metrics = {"mae": mae, "rmse": rmse}
        logger.info(f"Evaluation metrics - MAE: {mae:.2f}, RMSE: {rmse:.2f}")

        return metrics


if __name__ == "__main__":
    dates = pd.date_range("2023-01-01", periods=100)
    sales = np.random.randint(50, 200, 100)

    data = pd.DataFrame({
        "date": dates.strftime("%Y-%m-%d"),
        "sales": sales,
        "product_id": 1,
    })

    train_data = data.iloc[:80]
    test_data = data.iloc[80:]

    forecaster = DemandForecaster()
    forecaster.train(train_data)
    predictions = forecaster.predict(test_data)
    true_values = test_data["sales"].values
    metrics = forecaster.evaluate(test_data, true_values)

    print(f"Predictions: {predictions}")
    print(f"Metrics: {metrics}")