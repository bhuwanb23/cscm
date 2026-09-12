# Multi-stage build for AI/ML service
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY requirements.txt requirements-extras.txt requirements-dev.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY api/ ./api/
COPY legacy_models/ ./legacy_models/
COPY models/ ./models/
COPY config/ ./config/
COPY utils/ ./utils/
COPY scripts/ ./scripts/
COPY conftest.py pytest.ini ./

# Install requests for downloading models
RUN pip install --no-cache-dir requests

# Download models from GitHub Releases if credentials are provided
# Otherwise use local models from legacy_models/
RUN python3 << 'EOF'
import os
import sys
from pathlib import Path

# Check if GitHub credentials are provided
github_owner = os.getenv('GITHUB_REPO_OWNER')
github_repo = os.getenv('GITHUB_REPO_NAME')
release_tag = os.getenv('GITHUB_RELEASE_TAG')
models_dir = Path("/app/models")

if github_owner and github_repo:
    print("GitHub credentials provided, attempting to download models from releases...")
    try:
        from scripts.download_models import download_models
        download_models(github_owner, github_repo, release_tag, str(models_dir))
        print("✅ Models downloaded from GitHub Releases")
    except Exception as e:
        print(f"⚠️  Failed to download from GitHub: {e}")
        print("Falling back to local models...")
else:
    print("No GitHub credentials provided, using local models")

# Ensure models directory exists
models_dir.mkdir(parents=True, exist_ok=True)

# If models directory is empty or download failed, copy from legacy_models
if not any(models_dir.iterdir()):
    print("Copying models from legacy_models...")
    legacy_models = Path("/app/legacy_models")
    if legacy_models.exists():
        import shutil
        for item in legacy_models.iterdir():
            if item.is_dir():
                dest = models_dir / item.name
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(item, dest)
                print(f"  - Copied {item.name}")
    else:
        print("⚠️  No legacy_models found, using demo models")
        # Create demo models as fallback
        import pickle
        import numpy as np
        from datetime import datetime
        
        demo_dirs = ["demand_forecasting", "inventory_optimization", "routing_logistics", 
                     "customer_demand", "supplier_risk", "anomaly_detection", "knowledge_graph"]
        for demo_dir in demo_dirs:
            (models_dir / demo_dir).mkdir(parents=True, exist_ok=True)
            demo_model = {
                "model_type": f"demo_{demo_dir}",
                "version": "1.0.0",
                "created_at": datetime.now().isoformat(),
                "parameters": {},
                "weights": np.random.rand(5, 5).tolist()
            }
            with open(models_dir / demo_dir / f"{demo_dir}_model.pkl", "wb") as f:
                pickle.dump(demo_model, f)
            print(f"  - Created demo model for {demo_dir}")

print("✅ Models initialization complete")
EOF

# Create non-root user
RUN useradd -m -u 1000 cscmuser && chown -R cscmuser:cscmuser /app
USER cscmuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]