"""
Hot Reload Configuration for AI/ML Service
This configuration optimizes FastAPI hot reload for development
"""

import os
from pathlib import Path

# Directories to watch for changes
WATCH_DIRECTORIES = [
    "api",
    "legacy_models",
]

# File extensions to watch
WATCH_EXTENSIONS = [".py", ".json", ".yaml", ".yml"]

# Files to ignore (relative to project root)
IGNORE_FILES = [
    "__pycache__",
    "*.pyc",
    ".git",
    "venv",
    ".env",
    "*.log",
]

# Reload delay in seconds (prevents excessive reloads)
RELOAD_DELAY = 0.5

# Whether to reload on model file changes
RELOAD_ON_MODEL_CHANGE = True

# Whether to show detailed reload information
VERBOSE_RELOAD = True

def get_watch_paths():
    """Get absolute paths to watch for changes"""
    base_path = Path(__file__).parent
    watch_paths = []
    
    for directory in WATCH_DIRECTORIES:
        dir_path = base_path / directory
        if dir_path.exists():
            watch_paths.append(str(dir_path))
    
    return watch_paths

def should_ignore_file(file_path):
    """Check if a file should be ignored during hot reload"""
    file_path = Path(file_path)
    
    for ignore_pattern in IGNORE_FILES:
        if ignore_pattern in str(file_path):
            return True
    
    return False

def log_reload_info(message):
    """Log reload information if verbose mode is enabled"""
    if VERBOSE_RELOAD:
        print(f"[Hot Reload] {message}")
