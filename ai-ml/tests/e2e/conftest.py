"""
Conftest for end-to-end tests.
"""
import sys
import os

AI_ML_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, AI_ML_ROOT)
sys.path.insert(0, os.path.join(AI_ML_ROOT, 'models'))
sys.path.insert(0, os.path.join(AI_ML_ROOT, 'api'))
