"""
Conftest for unit tests.
"""
import sys
import os

# Ensure legacy_models and api directories are importable
AI_ML_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, AI_ML_ROOT)
sys.path.insert(0, os.path.join(AI_ML_ROOT, 'legacy_models'))
sys.path.insert(0, os.path.join(AI_ML_ROOT, 'api'))
