# CSCM Render Deployment Guide

This guide walks you through deploying the Cognitive Supply Chain Mesh (CSCM) backend services to Render's free tier.

## Prerequisites

1. **GitHub Account**: Your CSCM code must be in a GitHub repository
2. **Render Account**: Sign up for a free Render account at [render.com](https://render.com)
3. **Git**: Ensure all code changes are committed and pushed to GitHub

## Services Being Deployed

- **Backend API** (Node.js/Express): Port 3000
- **AI/ML Service** (Python/FastAPI): Port 8000
- **API Gateway** (Node.js): Port 8080
- **Redis Key Value**: 25MB in-memory
- **PostgreSQL Database**: Use your existing database (not created by blueprint)

## Architecture

```
Mobile App (Expo) → API Gateway (8080) → Backend API (3000) → PostgreSQL
                                                ↓
                                           AI/ML Service (8000)
```

## Deployment Steps

### Step 1: Commit Updated package-lock.json

After adding the `pg` dependency, you need to update the package-lock.json:

```bash
cd backend
npm install
cd ..
git add backend/package.json backend/package-lock.json
git commit -m "Add pg dependency and update lock file"
git push origin main
```

### Step 2: Set Database URL in Render Dashboard

**Important**: Since your repository is public, set the database URL in the Render dashboard (not in the YAML file) to keep credentials secure.

1. Deploy the blueprint first (see Step 3)
2. After deployment, go to the **cscm-backend** service in Render dashboard
3. Click **Environment** tab
4. Add a new environment variable:
   - Key: `DATABASE_URL`
   - Value: Your PostgreSQL connection string (e.g., `postgres://user:password@host:5432/database`)
5. Click **Save Changes**
6. The backend service will automatically restart with the new configuration

### Step 3: Connect GitHub to Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub account if not already connected
4. Select your CSCM repository

### Step 4: Deploy Blueprint

1. Render will detect the `render.yaml` file in your repository
2. Review the configuration:
   - 3 web services (Backend, AI/ML, Gateway)
   - 1 Redis Key Value instance
   - (PostgreSQL is external - you'll configure URL in dashboard)
3. Click "Apply" to deploy

### Step 5: Configure Database URL (After Deployment)

**Important**: Set the database URL in the Render dashboard to keep credentials secure (not in the public repository).

1. After deployment completes, go to the **cscm-backend** service in Render dashboard
2. Click the **Environment** tab
3. Click **Add Environment Variable**
4. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string
     - Format: `postgres://username:password@host:port/database`
     - Example: `postgres://myuser:mypass@db.example.com:5432/cscm`
5. Click **Save Changes**
6. The backend service will automatically restart with the database configuration

### Step 6: Monitor Deployment

Render will automatically:
- Build each service
- Start all services
- Configure environment variables

The database migration will run automatically on the first backend startup (using the PostgreSQL schema).

Monitor the deployment logs in the dashboard.

**AI/ML Model Download Logs:**
Look for these messages in AI/ML service logs:
- `✅ Models downloaded from GitHub Releases`
- `⚠️ Failed to download from GitHub: ...` (fallback to local models)
- `✅ Models initialization complete`

### Step 7: Deploy ML Models

The AI/ML service requires ML models to function. We use GitHub Releases to host model packages instead of committing large files to the repository.

#### 6.1 Package Models

Run the packaging script to create a model package:

```bash
cd ai-ml
python scripts/package_models.py
```

This creates a zip file in `ai-ml/model_packages/` containing all model directories.

#### 6.2 Create GitHub Release

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag version: `v1.0.0`
4. Upload the zip file from `ai-ml/model_packages/`
5. Add release notes
6. Click "Publish release"

**Alternatively**, use the GitHub Actions workflow:
1. Go to Actions tab
2. Select "Package ML Models for Release"
3. Click "Run workflow"
4. Enter version (e.g., `v1.0.0`)
5. Click "Run workflow"

#### 6.3 Configure AI/ML Environment Variables

In the Render dashboard for the **cscm-aiml** service, add these environment variables:

``
GITHUB_REPO_OWNER=your-github-username
GITHUB_REPO_NAME=cscm
GITHUB_RELEASE_TAG=v1.0.0
```

**Important:**
- Replace `your-github-username` with your actual GitHub username
- Replace `cscm` with your repository name if different
- Set `GITHUB_RELEASE_TAG` to the version you created

#### 6.4 Redeploy AI/ML Service

After adding the environment variables:
1. Go to the **cscm-aiml** service in Render
2. Click "Manual Deploy" → "Deploy latest commit"
3. The Docker container will download models from GitHub Releases during build

For detailed instructions, see: `ai-ml/MODEL_DEPLOYMENT.md`

### Step 8: Verify Deployment

Once deployment is complete, test the health endpoints:

```bash
# Test Backend
curl https://cscm-backend.onrender.com/health

# Test AI/ML
curl https://cscm-aiml.onrender.com/health

# Test Gateway
curl https://cscm-gateway.onrender.com/health
```

All should return `{"status": "healthy", ...}`

### Step 9: Enable Keep-Alive

The GitHub Actions workflow will automatically start pinging services every 14 minutes during working hours (8 AM - 6 PM UTC).

**Important**: This will use approximately 2,580 GitHub Actions minutes/month, which exceeds the 2,000 minute free limit. You have two options:

**Option 1: Switch to External Cron Service (Recommended)**
1. Sign up at [cron-job.org](https://cron-job.org) (free)
2. Create cron jobs for:
   - Backend: `https://cscm-backend.onrender.com/health`
   - Gateway: `https://cscm-gateway.onrender.com/health`
3. Schedule: Every 14 minutes, 8 AM - 6 PM
4. Disable the GitHub Actions workflow

**Option 2: Reduce GitHub Actions Frequency**
Update `.github/workflows/keep-alive.yml` to ping every 20 minutes instead of 14:
```yaml
schedule:
  - cron: '*/20 8-17 * * *'  # Every 20 minutes
```

### Step 10: Update Mobile App Configuration

Update your mobile app's API client to point to the Render Gateway:

```javascript
// App/src/api/endpoints.js
const GATEWAY_URL = 'https://cscm-gateway.onrender.com';
```

## Environment Variables

### Set in Render Dashboard (Manual Configuration)
- `DATABASE_URL`: Your existing PostgreSQL connection string (set manually in dashboard for security)

### Render automatically sets these environment variables:

### Backend
- `DATABASE_URL`: Your existing PostgreSQL connection string (set manually in dashboard)
- `REDIS_URL`: Redis connection string (from Render)
- `AI_ML_API_URL`: AI/ML service URL
- `JWT_SECRET`: Auto-generated by Render
- `NODE_ENV=production`
- `DATABASE_TYPE=postgresql`

### AI/ML
- `PORT=8000`
- `PYTHONUNBUFFERED=1`
- `DEBUG=false`
- `GITHUB_REPO_OWNER`: Your GitHub username (set manually in dashboard)
- `GITHUB_REPO_NAME`: Your repository name (set manually in dashboard)
- `GITHUB_RELEASE_TAG`: Model release version (set manually in dashboard)

### Gateway
- `BACKEND_URL`: Internal network URL to backend
- `AI_ML_API_URL`: Internal network URL to AI/ML
- `NODE_ENV=production`

## Service URLs

### Public URLs (for mobile app)
- Gateway: `https://cscm-gateway.onrender.com`
- Backend: `https://cscm-backend.onrender.com`
- AI/ML: `https://cscm-aiml.onrender.com`

### Internal URLs (for service-to-service communication)
- Backend: `http://cscm-backend:3000`
- AI/ML: `http://cscm-aiml:8000`
- Gateway: `http://cscm-gateway:8080`

## Known Limitations

### 1. Service Spin-Down
- Services sleep after 15 minutes of inactivity
- Cold start takes ~50 seconds
- Mitigated by keep-alive pings during working hours

### 2. PostgreSQL
- Using your existing PostgreSQL database (not Render's free tier)
- No 30-day expiration limitation
- Database costs depend on your existing plan

### 3. Compute Hours Limit
- 750 hours/month shared across all services
- Current usage: ~600 hours/month (2 services × 10 hours × 30 days)
- AI/ML service will cold-start when needed (not kept alive)

### 4. No Kafka/MQTT
- Event streaming and IoT messaging not available
- Core functionality works without these features
- Use Redis for basic pub/sub messaging

### 5. GitHub Actions Limit
- Keep-alive workflow uses ~2,580 minutes/month
- Exceeds 2,000 minute free limit
- Consider switching to external cron service

## Cost Summary

### Free Tier Costs
- Web Services: $0/month (3 services)
- Redis: $0/month (25MB)
- PostgreSQL: External (your existing database)
- **Total: $0/month** (excluding your existing database costs)

### Potential Overages
- Outbound Bandwidth: 5GB included, $0.15/GB thereafter
- Build Minutes: 500 included, $5/1000 minutes thereafter
- Compute Hours: 750 included, services suspend if exceeded

## Troubleshooting

### Deployment Fails

1. Check the deployment logs in Render dashboard
2. Ensure `DATABASE_URL` is properly set from PostgreSQL
3. Verify the migration script runs successfully
4. Check that all dependencies are installed

### Health Check Fails

1. Verify the service is running in Render dashboard
2. Check service logs for errors
3. Ensure environment variables are set correctly
4. Test database connectivity

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` environment variable
3. Ensure migration script created tables
4. Test database connection manually

### Keep-Alive Not Working

1. Verify GitHub Actions workflow is enabled
2. Check workflow runs in GitHub Actions tab
3. Ensure service URLs are correct
4. Consider switching to external cron service

## Upgrade Paths

### For Production Use

Consider upgrading to paid tiers for:

1. **PostgreSQL** ($7/month)
   - No 30-day expiration
   - Automated backups
   - Larger storage

2. **Web Services** ($7/month each)
   - No service spin-down
   - Better performance
   - More resources

3. **Redis** ($15/month)
   - Larger instances
   - Better performance
   - More features

## Monitoring

### Render Dashboard
- View logs for all services
- Monitor health status
- Check resource usage
- View deployment history

### External Monitoring (Optional)
- Use UptimeRobot for uptime monitoring (free)
- Set up alerts for service failures
- Monitor GitHub Actions usage

## Security

- Secrets are stored in Render's secure environment (dashboard)
- Database URL is set manually in Render dashboard (not in public repository)
- PostgreSQL connections use SSL
- Services communicate via Render's private network
- Gateway acts as single public entry point
- Never commit secrets to repository
- Use `sync: false` in render.yaml for sensitive environment variables

## Support

- Render Documentation: https://render.com/docs
- Render Support: https://render.com/support
- GitHub Issues: https://github.com/render-oss/render/issues

## Next Steps

1. Test all API endpoints through the Gateway
2. Verify mobile app can connect to Gateway
3. Test data persistence across service restarts
4. Monitor service logs for errors
5. Set reminder for PostgreSQL 30-day expiration
6. Consider upgrading to paid tier for production use
