# ML Model Deployment Guide

This guide explains how to deploy ML models for the CSCM AI/ML service using GitHub Releases.

## Overview

The AI/ML service uses ML models for:
- Demand forecasting
- Inventory optimization
- Routing logistics
- Customer demand analysis
- Supplier risk assessment
- Anomaly detection
- Knowledge graph operations

## Deployment Strategy

Instead of committing large model files to the repository, we use **GitHub Releases** to host model packages. The Docker container downloads models during the build process.

### Benefits

- ✅ Keeps repository clean and small
- ✅ Version control for models
- ✅ Easy rollback to previous model versions
- ✅ No large files in git history
- ✅ Works with Render free-tier deployment

## Quick Start

### 1. Package Models

**Option A: Manual Packaging**

```bash
cd ai-ml
python scripts/package_models.py
```

This creates a zip file in `ai-ml/model_packages/` containing all model directories.

**Option B: GitHub Actions**

Trigger the workflow manually:
1. Go to Actions tab in GitHub
2. Select "Package ML Models for Release"
3. Click "Run workflow"
4. Enter version (e.g., `v1.0.0`)
5. Click "Run workflow"

Or tag a commit to trigger automatically:
```bash
git tag models-v1.0.0
git push origin models-v1.0.0
```

### 2. Upload to GitHub Release

The GitHub Actions workflow automatically creates a release with the packaged models. If packaging manually:

1. Go to GitHub Releases
2. Click "Create a new release"
3. Tag version: `v1.0.0`
4. Upload the zip file from `ai-ml/model_packages/`
5. Publish the release

### 3. Configure Render Environment Variables

In your Render AI/ML service, set these environment variables:

```
GITHUB_REPO_OWNER=bhuwanb23
GITHUB_REPO_NAME=cscm
GITHUB_RELEASE_TAG=v1.0.0
```

**Note:** The release has already been created at: https://github.com/bhuwanb23/cscm/releases/tag/v1.0.0

### 4. Deploy

Push your changes and Render will automatically:
1. Build the Docker image
2. Download models from GitHub Releases
3. Extract them to `/app/models/`
4. Start the AI/ML service

## Directory Structure

```
ai-ml/
├── legacy_models/          # Source model directories (not committed)
│   ├── demand_forecasting/
│   ├── inventory_optimization/
│   ├── routing_logistics/
│   └── ...
├── models/                  # Downloaded models (at runtime)
│   ├── demand_forecasting/
│   ├── inventory_optimization/
│   └── ...
├── scripts/
│   ├── package_models.py   # Package models for release
│   └── download_models.py  # Download models from releases
└── model_packages/          # Generated zip files
    ├── cscm-ml-models-v1.0.0-20260912.zip
    └── model-info-v1.0.0-20260912.txt
```

## Model Versioning

### Version Format

Use semantic versioning: `vX.Y.Z-DATE`

- `v1.0.0-20260912` - First release
- `v1.1.0-20260920` - Updated demand models
- `v2.0.0-20261001` - Major model update

### Updating Models

1. Update models in `legacy_models/`
2. Run packaging script or trigger GitHub Actions
3. Create new release with new version tag
4. Update `GITHUB_RELEASE_TAG` in Render
5. Redeploy

## Fallback Behavior

If GitHub credentials are not provided or download fails, the Docker container will:
1. Use models from `legacy_models/` directory
2. If no models exist, create demo/placeholder models
3. Log the fallback behavior

## Troubleshooting

### Models not downloading

**Check environment variables:**
```bash
# In Render dashboard, verify:
GITHUB_REPO_OWNER=bhuwanb23
GITHUB_REPO_NAME=cscm
GITHUB_RELEASE_TAG=v1.0.0
```

**Check GitHub repository:**
- Ensure repository is public or you have a valid GITHUB_TOKEN
- Verify the release exists and contains the model zip file

**Check Docker logs:**
```bash
# Look for these messages:
# ✅ Models downloaded from GitHub Releases
# ⚠️ Failed to download from GitHub: ...
# Fallback to local models
```

### Release not created

**Check GitHub Actions:**
- Go to Actions tab
- Check "Package ML Models for Release" workflow
- Verify it completed successfully

**Check permissions:**
- Ensure GITHUB_TOKEN has permission to create releases
- Workflow file must be in `.github/workflows/`

### Local Testing

Test model downloading locally:

```bash
cd ai-ml
export GITHUB_REPO_OWNER=bhuwanb23
export GITHUB_REPO_NAME=cscm
export GITHUB_RELEASE_TAG=v1.0.0
python scripts/download_models.py
```

## Security Considerations

- ✅ Models are downloaded from authenticated GitHub releases
- ✅ No model files committed to repository
- ✅ Model versioning allows rollback
- ⚠️ Ensure repository is private if models contain sensitive data
- ⚠️ Use GitHub Secrets for credentials in production

## CI/CD Integration

The workflow automatically:
1. Packages models on tag push
2. Creates GitHub release
3. Attaches model zip and info file
4. Triggers Render deployment (if configured)

## Next Steps

1. **Package your current models** using the script
2. **Create a GitHub release** with the packaged models
3. **Configure Render environment variables** for your repository
4. **Deploy to Render** - models will download automatically
5. **Verify AI/ML endpoints** are working with the models

## Related Files

- `ai-ml/scripts/package_models.py` - Package models for release
- `ai-ml/scripts/download_models.py` - Download models from releases
- `ai-ml/.github/workflows/package-models.yml` - GitHub Actions workflow
- `ai-ml/Dockerfile` - Docker build with model download logic
- `ai-ml/api/utils/model_loader.py` - Model loading utility
