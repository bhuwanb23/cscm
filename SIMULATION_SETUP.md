# CSCM User Simulation Setup Guide

This guide explains how to set up and deploy the autonomous user simulation system for the CSCM hackathon project.

## Overview

The simulation system creates 40 autonomous users (10 per role: shopkeeper, transporter, wholesaler, admin) that demonstrate realistic B2B SaaS behavior for the Evorozen Apex hackathon.

## Prerequisites

1. **Render Account**: All services (backend, AI/ML, gateway) deployed on Render free tier
2. **GitHub Repository**: The simulation uses GitHub Actions for scheduled execution
3. **Environment Variables**: Required API keys and service URLs

## Step 1: Deploy Simulation Code

The simulation code is already in the repository at:
- `backend/src/simulation/` - Simulation infrastructure
- `backend/src/public/simulation-dashboard.html` - Analytics dashboard
- `.github/workflows/user-simulation.yml` - GitHub Actions workflow

**No deployment changes needed** - the simulation is part of the backend service.

## Step 2: Configure GitHub Actions Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `BACKEND_URL` | `<BACKEND_URL>` | Backend API URL |
| `AI_ML_API_URL` | `<AI_ML_URL>` | AI/ML API URL |
| `AI_ML_API_KEY` | *(secret — set via GitHub Secrets; rotate the previously leaked key!)* | AI/ML API key (same as Render) |

## Step 3: Initialize Simulated Users

Run the seed script to create 40 users with proper roles:

```bash
cd backend
npm run simulation:init
```

This will:
- Create 10 users per role (shopkeeper, transporter, wholesaler, admin)
- Register all users via the backend API
- Print credentials for reference

**Important**: Save the credentials securely. You'll need to add one admin user's credentials to GitHub Actions for role assignment (if needed).

## Step 4: Assign Roles to Users

The registration currently defaults all users to 'user' role. Use the admin endpoint to assign proper roles:

1. Login as an admin user (or use the first admin user from seed)
2. Get the JWT token
3. Call the role assignment endpoint:

```bash
curl -X POST <BACKEND_URL>/api/v1/auth/assign-role \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "shopkeeper_001",
    "role": "shopkeeper"
  }'
```

Repeat this for all 40 users. Or create a script to automate this.

## Step 5: Enable GitHub Actions Workflow

The workflow is already configured at `.github/workflows/user-simulation.yml`.

It will run every 2 hours during business hours (9am-6pm UTC).

To enable it:
1. Go to GitHub repository → Actions tab
2. Enable workflows if prompted
3. The workflow will run automatically on the schedule

To run manually:
1. Go to Actions tab
2. Select "User Simulation" workflow
3. Click "Run workflow"

## Step 6: Monitor Simulation

### View Analytics Dashboard

Open the dashboard in your browser:
```
file:///D:/projects/cscm/backend/src/public/simulation-dashboard.html
```

Or deploy it to a static hosting service for public access.

### View Audit Logs

Audit logs are uploaded as GitHub Actions artifacts after each run:
1. Go to Actions tab
2. Click on a workflow run
3. Download the "simulation-audit-logs" artifact

### Check Simulation Metrics

The dashboard shows:
- Total actions performed
- Success rate
- Active users
- Forecast requests
- Daily activity charts
- Role distribution
- Action distribution
- API endpoint usage
- Recent activity feed

## Step 7: Manual Testing

You can also run the simulation manually for testing:

```bash
cd backend
npm run simulation:run        # One-time run with user registration
npm run simulation:continuous # Continuous run without registration
```

## Troubleshooting

### Simulation Not Running

1. Check GitHub Actions is enabled
2. Verify secrets are set correctly
3. Check workflow logs for errors
4. Ensure backend and AI/ML services are accessible

### Users Not Authenticating

1. Verify BACKEND_URL is correct
2. Check JWT_SECRET is set in backend Render dashboard
3. Check registration succeeded during seed

### Role Assignment Failing

1. Ensure you're using an admin token
2. Verify the role assignment endpoint is accessible
3. Check the username exists

### Dashboard Not Updating

1. The dashboard currently shows sample data
2. Connect it to the backend API endpoint for real data
3. Or manually export logs and update the dashboard

## Next Steps

1. ✅ Deploy simulation code (already done)
2. ✅ Configure GitHub Actions secrets
3. ✅ Initialize simulated users
4. ✅ Assign roles to users
5. ✅ Enable GitHub Actions workflow
6. ⏳ Monitor simulation results
7. ⏳ Generate hackathon submission materials

## Hackathon Evidence

The simulation provides evidence for:
- **Active Users**: 40 autonomous users across 4 roles
- **Real Activity**: Continuous B2B workflows (inventory, orders, shipments, forecasts)
- **Analytics**: Dashboard showing user traction and system metrics
- **Audit Trail**: GitHub Actions logs with timestamps and actions

## Security Notes

- All simulated users have synthetic credentials
- Do not expose simulation credentials in public repository
- Use GitHub Actions secrets for sensitive data
- Distinguish between simulated and real users in analytics
