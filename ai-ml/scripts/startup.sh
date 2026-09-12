#!/bin/bash
set -e

echo "=========================================="
echo "CSCM AI/ML Service Startup Script"
echo "=========================================="

# Check if GitHub credentials are provided
if [ -n "$GITHUB_REPO_OWNER" ] && [ -n "$GITHUB_REPO_NAME" ]; then
    echo "GitHub credentials provided, attempting to download models from releases..."
    echo "Repository: $GITHUB_REPO_OWNER/$GITHUB_REPO_NAME"
    echo "Release Tag: ${GITHUB_RELEASE_TAG:-latest}"
    
    python3 << 'EOF'
import os
import sys
from pathlib import Path

github_owner = os.getenv('GITHUB_REPO_OWNER')
github_repo = os.getenv('GITHUB_REPO_NAME')
release_tag = os.getenv('GITHUB_RELEASE_TAG', 'latest')
models_dir = Path("/app/models")

try:
    from scripts.download_models import download_models
    download_models(github_owner, github_repo, release_tag, str(models_dir))
    print("✅ Models downloaded from GitHub Releases")
except Exception as e:
    print(f"⚠️  Failed to download from GitHub: {e}")
    print("Falling back to local models...")
    sys.exit(1)
EOF
    
    if [ $? -eq 0 ]; then
        echo "Model download successful"
    else
        echo "Model download failed, using fallback"
    fi
else
    echo "No GitHub credentials provided, using local/demo models"
fi

# Ensure models directory exists
mkdir -p /app/models

# If models directory is empty or download failed, copy from legacy_models
if [ -z "$(ls -A /app/models)" ]; then
    echo "Copying models from legacy_models..."
    if [ -d "/app/legacy_models" ]; then
        for dir in /app/legacy_models/*/; do
            if [ -d "$dir" ]; then
                dirname=$(basename "$dir")
                target="/app/models/$dirname"
                rm -rf "$target"
                cp -r "$dir" "$target"
                echo "  - Copied $dirname"
            fi
        done
    else
        echo "⚠️  No legacy_models found, using demo models"
        python3 << 'EOF'
import os
import pickle
import numpy as np
from datetime import datetime
from pathlib import Path

models_dir = Path("/app/models")
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
EOF
    fi
fi

echo "=========================================="
echo "✅ Models initialization complete"
echo "=========================================="

# Start the application
echo "Starting uvicorn server..."
exec uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
