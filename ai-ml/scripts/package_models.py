"""
Package ML models for GitHub Releases
This script creates compressed archives of model files for upload to GitHub Releases
"""
import os
import shutil
import zipfile
from pathlib import Path
from datetime import datetime

def package_models():
    """Package all model directories into a zip file for GitHub Releases"""
    
    # Get the project root
    project_root = Path(__file__).parent.parent
    legacy_models_dir = project_root / "legacy_models"
    output_dir = project_root / "model_packages"
    
    # Create output directory
    output_dir.mkdir(exist_ok=True)
    
    # Create a version identifier
    version = f"v1.0.0-{datetime.now().strftime('%Y%m%d')}"
    zip_filename = f"cscm-ml-models-{version}.zip"
    zip_path = output_dir / zip_filename
    
    print(f"Packaging models from: {legacy_models_dir}")
    print(f"Output file: {zip_path}")
    
    # Create zip file
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for model_dir in legacy_models_dir.iterdir():
            if model_dir.is_dir() and not model_dir.name.startswith('__'):
                print(f"Adding model directory: {model_dir.name}")
                for file_path in model_dir.rglob('*'):
                    if file_path.is_file() and not file_path.name.endswith('.pyc'):
                        # Calculate relative path from legacy_models
                        rel_path = file_path.relative_to(legacy_models_dir)
                        zipf.write(file_path, rel_path)
                        print(f"  - {rel_path}")
    
    print(f"\n✅ Models packaged successfully: {zip_path}")
    print(f"File size: {zip_path.stat().st_size / (1024*1024):.2f} MB")
    
    # Also create a simple model info file
    info_file = output_dir / f"model-info-{version}.txt"
    with open(info_file, 'w') as f:
        f.write(f"CSCM ML Models Package\n")
        f.write(f"Version: {version}\n")
        f.write(f"Date: {datetime.now().isoformat()}\n")
        f.write(f"\nIncluded model directories:\n")
        for model_dir in legacy_models_dir.iterdir():
            if model_dir.is_dir() and not model_dir.name.startswith('__'):
                f.write(f"  - {model_dir.name}\n")
    
    print(f"Model info file: {info_file}")
    
    return zip_path, info_file

if __name__ == "__main__":
    package_models()
