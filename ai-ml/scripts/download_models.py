"""
Download ML models from GitHub Releases
This script downloads and extracts model files from GitHub Releases
"""
import os
import sys
import zipfile
import requests
from pathlib import Path

def download_models(repo_owner, repo_name, release_tag=None, models_dir="/app/models"):
    """
    Download models from GitHub Releases
    
    Args:
        repo_owner: GitHub repository owner (e.g., "yourusername")
        repo_name: GitHub repository name (e.g., "cscm")
        release_tag: Specific release tag (e.g., "v1.0.0"). If None, uses latest
        models_dir: Directory to extract models to
    """
    
    # Get release info
    if release_tag:
        url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/releases/tags/{release_tag}"
    else:
        url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/releases/latest"
    
    print(f"Fetching release info from: {url}")
    response = requests.get(url)
    response.raise_for_status()
    release_data = response.json()
    
    # Find the model package asset
    asset_url = None
    asset_name = None
    for asset in release_data.get('assets', []):
        if asset['name'].startswith('cscm-ml-models-') and asset['name'].endswith('.zip'):
            asset_url = asset['browser_download_url']
            asset_name = asset['name']
            break
    
    if not asset_url:
        print("❌ No model package found in release assets")
        print("Available assets:")
        for asset in release_data.get('assets', []):
            print(f"  - {asset['name']}")
        sys.exit(1)
    
    print(f"Downloading: {asset_name}")
    
    # Download the file
    download_response = requests.get(asset_url, stream=True)
    download_response.raise_for_status()
    
    temp_zip = Path("/tmp") / asset_name
    with open(temp_zip, 'wb') as f:
        for chunk in download_response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    print(f"Downloaded to: {temp_zip}")
    
    # Extract models
    models_path = Path(models_dir)
    models_path.mkdir(parents=True, exist_ok=True)
    
    print(f"Extracting to: {models_path}")
    with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
        zip_ref.extractall(models_path)
    
    # Clean up
    temp_zip.unlink()
    
    print(f"✅ Models extracted successfully to {models_path}")
    
    # List extracted contents
    print("\nExtracted directories:")
    for item in models_path.iterdir():
        if item.is_dir():
            print(f"  - {item.name}")

if __name__ == "__main__":
    # Configuration - these should be set via environment variables
    REPO_OWNER = os.getenv('GITHUB_REPO_OWNER', 'yourusername')
    REPO_NAME = os.getenv('GITHUB_REPO_NAME', 'cscm')
    RELEASE_TAG = os.getenv('GITHUB_RELEASE_TAG', None)  # None for latest
    MODELS_DIR = os.getenv('MODELS_DIR', '/app/models')
    
    download_models(REPO_OWNER, REPO_NAME, RELEASE_TAG, MODELS_DIR)
