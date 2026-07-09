"""
Train all Demand Forecasting models and save weights.
"""
import os, sys, json, pickle, logging
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd
import numpy as np
import torch

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger("train_demand")
logger.setLevel(logging.INFO)

WEIGHTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "demand_forecasting", "weights")
os.makedirs(WEIGHTS_DIR, exist_ok=True)

np.random.seed(42)
torch.manual_seed(42)

def make_synthetic_timeseries(n=365):
    dates = pd.date_range("2023-01-01", periods=n, freq="D")
    t = np.arange(n)
    trend = 0.5 * t
    seasonal = 20 * np.sin(2 * np.pi * t / 7) + 10 * np.sin(2 * np.pi * t / 365)
    noise = np.random.normal(0, 5, n)
    sales = 100 + trend + seasonal + noise
    return pd.Series(np.maximum(sales, 1), index=dates, name="sales")

df_series = make_synthetic_timeseries(365)

# ---- 1. Statistical Models ----
logger.info("=" * 60)
logger.info("Training Statistical Models")

# 1a. ETSModel
from legacy_models.demand_forecasting.statistical.models import ETSModel
ets = ETSModel(trend="add", seasonal="add", seasonal_periods=7)
ets.fit(df_series)
preds = ets.predict(steps=10)
logger.info(f"ETS: fitted OK, preds[:3]={preds[:3].round(1)}")
with open(os.path.join(WEIGHTS_DIR, "ets_model.pkl"), "wb") as f:
    pickle.dump(ets, f)
logger.info("  -> saved ets_model.pkl")

# 1b. ARIMAModel
from legacy_models.demand_forecasting.statistical.models import ARIMAModel
arima = ARIMAModel(order=(1, 1, 1))
arima.fit(df_series)
preds = arima.predict(steps=10)
logger.info(f"ARIMA: fitted OK, preds[:3]={preds[:3].round(1)}")
with open(os.path.join(WEIGHTS_DIR, "arima_model.pkl"), "wb") as f:
    pickle.dump(arima, f)
logger.info("  -> saved arima_model.pkl")

# 1c. StatisticalForecaster (SARIMA)
from legacy_models.demand_forecasting.statistical.models import StatisticalForecaster
sf = StatisticalForecaster(model_type="sarima", order=(1, 1, 1), seasonal_order=(1, 1, 1, 7))
sf.fit(df_series)
preds = sf.predict(steps=10)
logger.info(f"SARIMA: fitted OK, preds[:3]={preds[:3].round(1)}")
with open(os.path.join(WEIGHTS_DIR, "sarima_forecaster.pkl"), "wb") as f:
    pickle.dump(sf, f)
logger.info("  -> saved sarima_forecaster.pkl")

# ---- 2. DemandForecaster (base class) ----
logger.info("=" * 60)
logger.info("Training DemandForecaster (Random Forest)")
import pandas as pd
dates = pd.date_range("2023-01-01", periods=365, freq="D")
sales_vals = df_series.values
df_data = pd.DataFrame({"date": dates.strftime("%Y-%m-%d"), "sales": sales_vals, "product_id": 1})
from legacy_models.demand_forecasting.model import DemandForecaster
df_model = DemandForecaster()
df_model.train(df_data)
preds = df_model.predict(df_data.iloc[-20:])
logger.info(f"DemandForecaster: trained OK, preds[:3]={preds[:3].round(1)}")
with open(os.path.join(WEIGHTS_DIR, "demand_forecaster_rf.pkl"), "wb") as f:
    pickle.dump(df_model, f)
logger.info("  -> saved demand_forecaster_rf.pkl (updated)")

# ---- 3. Gradient-Boosted Models ----
logger.info("=" * 60)
logger.info("Training Gradient-Boosted Models")

n_samples = 1000
X_gb = pd.DataFrame({
    "feature1": np.random.randn(n_samples),
    "feature2": np.random.randn(n_samples),
    "feature3": np.random.randn(n_samples),
})
y_gb = X_gb["feature1"] * 2 + X_gb["feature2"] * -1.5 + X_gb["feature3"] * 0.5 + np.random.randn(n_samples) * 0.1

from legacy_models.demand_forecasting.gradient_boosted.models import XGBoostModel, LightGBMModel, CatBoostModel

# 3a. XGBoost
xgb_model = XGBoostModel()
xgb_model.fit(X_gb, y_gb, num_boost_round=100)
preds = xgb_model.predict(X_gb[:5])
logger.info(f"XGBoost: trained OK, preds={preds.round(2)}")
with open(os.path.join(WEIGHTS_DIR, "xgboost_model.pkl"), "wb") as f:
    pickle.dump(xgb_model, f)
xgb_model.model.save_model(os.path.join(WEIGHTS_DIR, "xgboost_model.json"))
logger.info("  -> saved xgboost_model.pkl + .json")

# 3b. LightGBM
lgb_model = LightGBMModel()
lgb_model.fit(X_gb, y_gb, num_boost_round=100)
preds = lgb_model.predict(X_gb[:5])
logger.info(f"LightGBM: trained OK, preds={preds.round(2)}")
with open(os.path.join(WEIGHTS_DIR, "lightgbm_model.pkl"), "wb") as f:
    pickle.dump(lgb_model, f)
lgb_model.model.save_model(os.path.join(WEIGHTS_DIR, "lightgbm_model.txt"))
logger.info("  -> saved lightgbm_model.pkl + .txt")

# 3c. CatBoost
cb_model = CatBoostModel(iterations=100)
cb_model.fit(X_gb, y_gb, verbose=False)
preds = cb_model.predict(X_gb[:5])
logger.info(f"CatBoost: trained OK, preds={preds.round(2)}")
with open(os.path.join(WEIGHTS_DIR, "catboost_model.pkl"), "wb") as f:
    pickle.dump(cb_model, f)
cb_model.model.save_model(os.path.join(WEIGHTS_DIR, "catboost_model.cbm"))
logger.info("  -> saved catboost_model.pkl + .cbm")

# ---- 4. Deep Learning Models (LSTM, GRU, Seq2Seq) ----
logger.info("=" * 60)
logger.info("Training Deep Learning Models")

data_dl = df_series.values.astype(np.float32)
seq_len = 10
sequences, targets = [], []
for i in range(len(data_dl) - seq_len):
    sequences.append(data_dl[i:i+seq_len])
    targets.append(data_dl[i+seq_len])
sequences = np.array(sequences).reshape(-1, seq_len, 1)
targets = np.array(targets)

train_size = int(0.8 * len(sequences))
X_train_dl, X_test_dl = sequences[:train_size], sequences[train_size:]
y_train_dl, y_test_dl = targets[:train_size], targets[train_size:]

from legacy_models.demand_forecasting.deep_learning.models import DeepLearningForecaster

for model_type in ["lstm", "gru"]:
    dlf = DeepLearningForecaster(model_type=model_type, input_size=1, hidden_size=32, num_layers=2)
    dlf.fit(X_train_dl, y_train_dl, epochs=30, batch_size=32, learning_rate=0.001)
    preds = dlf.predict(X_test_dl[:5])
    logger.info(f"{model_type.upper()}: trained OK, preds={preds.round(1)}")
    torch.save(dlf.model.state_dict(), os.path.join(WEIGHTS_DIR, f"{model_type}_model.pt"))
    with open(os.path.join(WEIGHTS_DIR, f"{model_type}_forecaster.pkl"), "wb") as f:
        pickle.dump(dlf, f)
    logger.info(f"  -> saved {model_type}_model.pt + {model_type}_forecaster.pkl")

# Seq2Seq with sequence_length
dlf = DeepLearningForecaster(model_type="seq2seq", input_size=1, hidden_size=32, num_layers=2, sequence_length=seq_len)
dlf.fit(X_train_dl, y_train_dl, epochs=30, batch_size=32, learning_rate=0.001)
preds = dlf.predict(X_test_dl[:5])
logger.info(f"Seq2Seq: trained OK, preds={preds.round(1)}")
torch.save(dlf.model.state_dict(), os.path.join(WEIGHTS_DIR, "seq2seq_model.pt"))
with open(os.path.join(WEIGHTS_DIR, "seq2seq_forecaster.pkl"), "wb") as f:
    pickle.dump(dlf, f)
logger.info("  -> saved seq2seq_model.pt + seq2seq_forecaster.pkl")

# ---- 5. Transformer Models ----
logger.info("=" * 60)
logger.info("Training Transformer Models")

from legacy_models.demand_forecasting.transformer_based.models import TFTModel
try:
    tft = TFTModel(hidden_size=8, lstm_layers=1, attention_head_size=2, dropout=0.1,
                   max_encoder_length=10, max_prediction_length=1)
    logger.info("TFTModel: created, needs TimeSeriesDataSet with real data")
    with open(os.path.join(WEIGHTS_DIR, "tft_model_config.json"), "w") as f:
        json.dump({"hidden_size": 8, "lstm_layers": 1, "attention_head_size": 2}, f)
    logger.info("  -> saved tft_model_config.json (no weights — requires pytorch_forecasting DataLoader training)")
except Exception as e:
    logger.warning(f"TFTModel init failed: {e}")

# ---- 6. Hybrid Models ----
logger.info("=" * 60)
logger.info("Training Hybrid Models")

from legacy_models.demand_forecasting.hybrid.models import ARIMAMLHybridModel, ETSMLHybridModel, EnsembleHybridModel

# 6a. ARIMA-ML
hybrid_arima = ARIMAMLHybridModel(arima_order=(1, 1, 1), ml_model_type="random_forest")
hybrid_arima.fit(df_series)
preds = hybrid_arima.predict(steps=10)
logger.info(f"ARIMA-ML: fitted OK, preds[:3]={preds[:3].round(1)}")
with open(os.path.join(WEIGHTS_DIR, "arima_ml_hybrid.pkl"), "wb") as f:
    pickle.dump(hybrid_arima, f)
logger.info("  -> saved arima_ml_hybrid.pkl")

# 6b. ETS-ML
hybrid_ets = ETSMLHybridModel(ets_seasonal_periods=7, ml_model_type="random_forest")
hybrid_ets.fit(df_series)
preds = hybrid_ets.predict(steps=10)
logger.info(f"ETS-ML: fitted OK, preds[:3]={preds[:3].round(1)}")
with open(os.path.join(WEIGHTS_DIR, "ets_ml_hybrid.pkl"), "wb") as f:
    pickle.dump(hybrid_ets, f)
logger.info("  -> saved ets_ml_hybrid.pkl")

# 6c. Ensemble
hybrid_ens = EnsembleHybridModel(models=[
    {"type": "arima_ml", "params": {"arima_order": (1, 1, 1)}},
    {"type": "ets_ml", "params": {"ets_seasonal_periods": 7}},
])
hybrid_ens.fit(df_series)
preds = hybrid_ens.predict(steps=10)
logger.info(f"Ensemble: fitted OK, preds[:3]={preds[:3].round(1)}")
with open(os.path.join(WEIGHTS_DIR, "ensemble_hybrid.pkl"), "wb") as f:
    pickle.dump(hybrid_ens, f)
logger.info("  -> saved ensemble_hybrid.pkl")

# ---- 7. Probabilistic Models ----
logger.info("=" * 60)
logger.info("Training Probabilistic Models")

from legacy_models.demand_forecasting.probabilistic.models import DeepARModel, NBEATSModel
try:
    deepar = DeepARModel(epochs=5)
    deepar.fit(df_series)
    preds = deepar.predict(steps=10)
    logger.info(f"DeepAR-like: fitted OK")
    with open(os.path.join(WEIGHTS_DIR, "deepar_model.pkl"), "wb") as f:
        pickle.dump(deepar, f)
    logger.info("  -> saved deepar_model.pkl")
except Exception as e:
    logger.warning(f"DeepAR training failed: {e}")

try:
    nbeats = NBEATSModel(epochs=5)
    nbeats.fit(df_series)
    preds = nbeats.predict(steps=10)
    logger.info(f"NBEATS-like: fitted OK")
    with open(os.path.join(WEIGHTS_DIR, "nbeats_model.pkl"), "wb") as f:
        pickle.dump(nbeats, f)
    logger.info("  -> saved nbeats_model.pkl")
except Exception as e:
    logger.warning(f"NBEATS training failed: {e}")

from legacy_models.demand_forecasting.probabilistic.models import MQRNNModel
try:
    mqrnn = MQRNNModel(epochs=5)
    mqrnn.fit(df_series)
    preds = mqrnn.predict(steps=10)
    logger.info(f"MQRNN-like: fitted OK")
    with open(os.path.join(WEIGHTS_DIR, "mqrnn_model.pkl"), "wb") as f:
        pickle.dump(mqrnn, f)
    logger.info("  -> saved mqrnn_model.pkl")
except Exception as e:
    logger.warning(f"MQRNN training failed: {e}")

# ---- Summary ----
logger.info("=" * 60)
logger.info("Demand Forecasting training complete!")
logger.info(f"Weights saved to: {WEIGHTS_DIR}")
files = [f for f in os.listdir(WEIGHTS_DIR) if not f.endswith(".py")]
logger.info(f"Files: {sorted(files)}")
