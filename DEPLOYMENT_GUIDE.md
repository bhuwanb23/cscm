# CSCM Deployment Guide

This guide provides comprehensive instructions for deploying the Cognitive Supply Chain Mesh (CSCM) system using Docker Compose and Kubernetes.

## Overview

The CSCM deployment infrastructure has been enhanced with production-ready containerization and orchestration capabilities.

### Architecture

```
┌─────────────────┐
│   Mobile App    │
│   (Expo)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │
│  (Port 8080)     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────┐  ┌──────┐
│Backend│  │AI/ML │
│:3000  │  │:8000 │
└───┬───┘  └───┬──┘
    │          │
    └────┬─────┘
         ▼
    ┌──────┐
    │Redis │
    │:6379 │
    └──────┘
```

## Docker Compose Deployment

### Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- PowerShell (on Windows) or Bash (on Linux/Mac)

### Environment-Specific Compose Files

#### Development (`docker-compose.dev.yml`)
- Hot reload enabled for backend and AI/ML services
- Volume mounts for live code editing
- Minimal resource constraints
- Ideal for local development

#### Production (`docker-compose.prod.yml`)
- Full observability stack (Prometheus, Grafana, ELK)
- Resource limits and health checks
- Logging configuration
- Optimized for production workloads

#### Test (`docker-compose.test.yml`)
- Lightweight configuration for testing
- Health checks enabled
- Minimal external dependencies

### Quick Start

```bash
# Development deployment
docker-compose -f docker-compose.dev.yml up

# Production deployment
docker-compose -f docker-compose.prod.yml up

# Test deployment
docker-compose -f docker-compose.test.yml up

# Background mode
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Backend Configuration
NODE_ENV=production
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
AI_ML_API_URL=http://ai-ml:8000

# Gateway Configuration
GATEWAY_PORT=8080

# Database Configuration
DATABASE_URI=sqlite:///app/data/cscm.db

# Security
JWT_SECRET=your-production-secret-here
JWT_EXPIRATION=24h

# Grafana
GRAFANA_ADMIN_PASSWORD=your-grafana-password
```

### Health Checks

All services include health checks:

- **Gateway**: `http://localhost:8080/health`
- **Backend**: `http://localhost:3000/health`
- **AI/ML**: `http://localhost:8000/health`
- **Redis**: `redis-cli ping`

### Observability Stack

The production Compose configuration includes:

- **Prometheus** (Port 9090): Metrics collection
- **Grafana** (Port 3001): Metrics visualization
- **Elasticsearch** (Port 9200): Log storage
- **Logstash** (Port 5044): Log processing
- **Kibana** (Port 5601): Log visualization

### Testing Docker Compose

Run the automated test script:

```bash
# PowerShell
.\scripts\test-docker-compose.js

# Node.js
node scripts/test-docker-compose.js
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured for your cluster
- Container registry access (Docker Hub, ECR, etc.)

### Deployment Scripts

#### PowerShell (Windows)
```powershell
.\scripts\deploy-k8s.ps1
```

#### Bash (Linux/Mac)
```bash
./scripts/deploy-k8s.sh
```

### Manual Deployment Steps

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create configuration
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Create persistent volumes
kubectl apply -f k8s/redis-pvc.yaml
kubectl apply -f k8s/backend-pvc.yaml
kubectl apply -f k8s/ai-ml-pvc.yaml

# Deploy services
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-service.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/ai-ml-deployment.yaml
kubectl apply -f k8s/ai-ml-service.yaml
kubectl apply -f k8s/gateway-deployment.yaml
kubectl apply -f k8s/gateway-service.yaml

# Deploy autoscaling and ingress
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

### Kubernetes Components

#### Deployments
- **Redis**: 1 replica, 256MB memory limit
- **Backend**: 2 replicas, 512MB memory limit
- **AI/ML**: 2 replicas, 2GB memory limit
- **Gateway**: 2 replicas, 256MB memory limit

#### Services
- **Redis**: ClusterIP (internal)
- **Backend**: ClusterIP (internal)
- **AI/ML**: ClusterIP (internal)
- **Gateway**: LoadBalancer (external)

#### Horizontal Pod Autoscaling
- **Backend**: 2-10 replicas (CPU 70%, Memory 80%)
- **AI/ML**: 2-5 replicas (CPU 75%, Memory 85%)
- **Gateway**: 2-8 replicas (CPU 60%, Memory 75%)

#### Ingress
- Gateway: `cscm.local`
- Backend: `api.cscm.local`
- AI/ML: `ml.cscm.local`

### Health Checks

All deployments include liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 40
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

### Verification Commands

```bash
# Check pod status
kubectl get pods -n cscm

# Check services
kubectl get services -n cscm

# Check HPA status
kubectl get hpa -n cscm

# Check ingress
kubectl get ingress -n cscm

# View logs
kubectl logs -n cscm -l app=gateway --tail=50

# Describe deployment
kubectl describe deployment backend-deployment -n cscm
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### CI Pipeline (`backend/.github/workflows/ci.yml`)
- Tests backend (Node.js 16.x, 18.x)
- Tests AI/ML service (Python 3.11)
- Builds and pushes Docker images to registry
- Runs on push to main/develop and pull requests

#### Development Deployment (`backend/.github/workflows/deploy-dev.yml`)
- Deploys to development environment
- Uses AWS ECR for container registry
- Automatic deployment on push to develop branch
- Includes manual workflow dispatch

#### Production Deployment (`backend/.github/workflows/deploy-prod.yml`)
- Deploys to production environment
- Pre-deployment database backup
- Health checks and verification
- Automatic rollback on failure
- Integration tests
- Manual approval required

### Required Secrets

Configure these secrets in your GitHub repository:

- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password/token
- `AWS_ACCESS_KEY_ID`: AWS access key (for ECR)
- `AWS_SECRET_ACCESS_KEY`: AWS secret key (for ECR)
- `AWS_REGION`: AWS region (e.g., us-east-1)

### Customizing Deployment

#### Image Registry
Update the workflows to use your preferred container registry:

```yaml
# For Docker Hub
- name: Log in to Docker Hub
  uses: docker/login-action@v2
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}

# For AWS ECR
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}
```

#### Kubernetes Cluster
Update the cluster configuration in deployment workflows:

```yaml
- name: Deploy to Kubernetes
  uses: azure/k8s-deploy@v4
  with:
    kubeconfig: ${{ secrets.KUBE_CONFIG }}
    manifests: |
      k8s/namespace.yaml
      k8s/configmap.yaml
      # ... other manifests
```

## Security Considerations

### Secrets Management

Before production deployment:

1. Update `k8s/secrets.yaml` with real values
2. Use external secrets manager (AWS Secrets Manager, HashiCorp Vault)
3. Rotate secrets regularly
4. Never commit secrets to version control

### Network Security

1. Configure network policies in Kubernetes
2. Enable TLS/SSL for ingress
3. Use service mesh for inter-service communication
4. Implement rate limiting at gateway

### Container Security

1. Scan images for vulnerabilities
2. Use minimal base images
3. Run containers as non-root users
4. Enable security contexts in Kubernetes

## Troubleshooting

### Docker Compose Issues

#### Port Conflicts
```bash
# Check port usage
netstat -ano | findstr :8080

# Change ports in docker-compose.yml
ports:
  - "8081:8080"  # Use different host port
```

#### Container Startup Failures
```bash
# View logs
docker-compose logs backend
docker-compose logs ai-ml

# Check container status
docker-compose ps

# Rebuild containers
docker-compose up --build
```

### Kubernetes Issues

#### Pod Not Starting
```bash
# Describe pod for errors
kubectl describe pod <pod-name> -n cscm

# View pod logs
kubectl logs <pod-name> -n cscm

# Check events
kubectl get events -n cscm
```

#### Image Pull Errors
```bash
# Verify image exists
docker pull <image-name>

# Check image pull secrets
kubectl get secrets -n cscm

# Create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n cscm
```

#### Service Not Accessible
```bash
# Check service endpoints
kubectl get endpoints <service-name> -n cscm

# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
# Inside container: wget -O- http://<service-name>:<port>
```

## Performance Tuning

### Resource Limits

Adjust resource limits based on your workload:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

### HPA Thresholds

Configure autoscaling thresholds:

```yaml
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 70
```

### Database Optimization

For production databases:

1. Use PostgreSQL instead of SQLite
2. Configure connection pooling
3. Enable query caching
4. Set up read replicas

## Monitoring and Observability

### Prometheus Metrics

Access Prometheus at `http://localhost:9090` (Docker Compose) or via ingress (Kubernetes).

Key metrics to monitor:
- Request rate and latency
- Error rates
- Resource utilization
- Custom business metrics

### Grafana Dashboards

Access Grafana at `http://localhost:3001` (Docker Compose) or via ingress (Kubernetes).

Default credentials:
- Username: `admin`
- Password: Set via `GRAFANA_ADMIN_PASSWORD` environment variable

### Kibana Logs

Access Kibana at `http://localhost:5601` (Docker Compose) or via ingress (Kubernetes).

Configure index patterns and visualizations for log analysis.

## Backup and Recovery

### Database Backups

```bash
# SQLite backup
kubectl exec -n cscm deployment/backend-deployment -- cp /app/data/cscm.db /tmp/
kubectl cp cscm/backend-deployment-<pod>:/tmp/cscm.db ./backup.sql

# Restore backup
kubectl cp ./backup.sql cscm/backend-deployment-<pod>:/tmp/
kubectl exec -n cscm deployment/backend-deployment -- cp /tmp/backup.sql /app/data/cscm.db
```

### Volume Snapshots

For cloud providers, use volume snapshot features:

```bash
# AWS EBS snapshot
aws ec2 create-snapshot --volume-id <volume-id>

# GCE disk snapshot
gcloud compute disks snapshot <disk-name> --zone <zone>
```

## Scaling Strategies

### Horizontal Scaling

Use HPA for automatic scaling:

```bash
# Manual scaling
kubectl scale deployment backend-deployment --replicas=5 -n cscm

# Check HPA status
kubectl get hpa -n cscm
```

### Vertical Scaling

Adjust resource requests/limits:

```bash
# Edit deployment
kubectl edit deployment backend-deployment -n cscm

# Update resources
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

## Migration Guide

### From Local Development to Production

1. **Update Environment Variables**
   - Replace localhost with service names
   - Set production secrets
   - Configure external database

2. **Build Production Images**
   - Use production Dockerfiles
   - Optimize image size
   - Scan for vulnerabilities

3. **Deploy to Staging**
   - Test in staging environment
   - Run integration tests
   - Verify performance

4. **Deploy to Production**
   - Follow blue-green deployment
   - Monitor for issues
   - Prepare rollback plan

## Next Steps

### Phase 2: Production Security
- Implement external secrets management
- Add HTTPS/TLS configuration
- Configure network policies
- Enable security scanning

### Phase 3: Monitoring & Observability
- Implement distributed tracing
- Set up alerting rules
- Integrate APM tools
- Configure log aggregation

### Phase 4: Database Operations
- Implement database migrations
- Set up automated backups
- Configure disaster recovery
- Migrate to PostgreSQL

## Support

For issues or questions:
- Check troubleshooting section
- Review Kubernetes events
- Examine service logs
- Consult project documentation

## Version History

- **v1.0** - Initial deployment infrastructure
  - Docker Compose configurations
  - Kubernetes manifests
  - CI/CD workflows
  - Basic observability stack