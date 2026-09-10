# CSCM Kubernetes Deployment Script (PowerShell)
# This script deploys the CSCM application to a Kubernetes cluster

$ErrorActionPreference = "Stop"

$NAMESPACE = "cscm"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
$K8S_DIR = Join-Path $PROJECT_ROOT "k8s"

Write-Host "🚀 CSCM Kubernetes Deployment" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if kubectl is installed
try {
    $null = & kubectl version --client --short 2>&1
    Write-Host "✅ kubectl is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl is not installed. Please install kubectl first." -ForegroundColor Red
    exit 1
}

# Check if cluster is accessible
try {
    $null = & kubectl cluster-info 2>&1
    Write-Host "✅ Kubernetes cluster is accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig." -ForegroundColor Red
    exit 1
}

# Create namespace
Write-Host "📝 Creating namespace: $NAMESPACE" -ForegroundColor Yellow
& kubectl apply -f (Join-Path $K8S_DIR "namespace.yaml")

# Create ConfigMap
Write-Host "📝 Creating ConfigMap" -ForegroundColor Yellow
& kubectl apply -f (Join-Path $K8S_DIR "configmap.yaml")

# Create Secrets (note: these are example secrets - update for production)
Write-Host "📝 Creating Secrets" -ForegroundColor Yellow
& kubectl apply -f (Join-Path $K8S_DIR "secrets.yaml")

# Create Persistent Volume Claims
Write-Host "📝 Creating Persistent Volume Claims" -ForegroundColor Yellow
& kubectl apply -f (Join-Path $K8S_DIR "redis-pvc.yaml")
& kubectl apply -f (Join-Path $K8S_DIR "backend-pvc.yaml")
& kubectl apply -f (Join-Path $K8S_DIR "ai-ml-pvc.yaml")

# Deploy Redis
Write-Host "🚀 Deploying Redis" -ForegroundColor Yellow
& kubectl apply -f (Join-Path $K8S_DIR "redis-deployment.yaml")
& kubectl apply -f (Join-Path $K8S_DIR "redis-service.yaml")

# Deploy Backend
Write-Host "🚀 Deploying Backend" -ForegroundColor Yellow
& kubectl apply -f (Join-Path $K8S_DIR "backend-deployment.yaml")
& kubectl apply -f (Join-Path $K8S_DIR "backend-service.yaml")

# Deploy AI/ML Service
Write-Host "🚀 Deploying AI/ML Service" -ForegroundColor Yellow
& kubectl apply -f (Join-Path $K8S_DIR "ai-ml-deployment.yaml")
& kubectl apply -f (Join-Path $K8S_DIR "ai-ml-service.yaml")

# Deploy Gateway
Write-Host "🚀 Deploying Gateway" -ForegroundColor Yellow
& kubectl apply -f (Join-Path $K8S_DIR "gateway-deployment.yaml")
& kubectl apply -f (Join-Path $K8S_DIR "gateway-service.yaml")

# Deploy HPA
Write-Host "🚀 Deploying Horizontal Pod Autoscalers" -ForegroundColor Yellow
& kubectl apply -f (Join-Path $K8S_DIR "hpa.yaml")

# Deploy Ingress
Write-Host "🚀 Deploying Ingress" -ForegroundColor Yellow
& kubectl apply -f (Join-Path $K8S_DIR "ingress.yaml")

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   - Check pod status: & kubectl get pods -n $NAMESPACE" -ForegroundColor White
Write-Host "   - Check services: & kubectl get services -n $NAMESPACE" -ForegroundColor White
Write-Host "   - Check HPA status: & kubectl get hpa -n $NAMESPACE" -ForegroundColor White
Write-Host "   - View logs: & kubectl logs -n $NAMESPACE -l app=gateway --tail=50" -ForegroundColor White
Write-Host "   - Access services via Ingress hosts configured in ingress.yaml" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Note: Before production deployment:" -ForegroundColor Yellow
Write-Host "   - Update secrets in k8s/secrets.yaml with real values" -ForegroundColor White
Write-Host "   - Build and push Docker images to your registry" -ForegroundColor White
Write-Host "   - Update image names in deployment manifests" -ForegroundColor White
Write-Host "   - Configure TLS/SSL certificates for Ingress" -ForegroundColor White
Write-Host "   - Review and adjust resource limits based on your requirements" -ForegroundColor White