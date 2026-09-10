#!/bin/bash

# CSCM Kubernetes Deployment Script
# This script deploys the CSCM application to a Kubernetes cluster

set -e

NAMESPACE="cscm"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/k8s"

echo "🚀 CSCM Kubernetes Deployment"
echo "================================"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"

# Create namespace
echo "📝 Creating namespace: $NAMESPACE"
kubectl apply -f "$K8S_DIR/namespace.yaml"

# Create ConfigMap
echo "📝 Creating ConfigMap"
kubectl apply -f "$K8S_DIR/configmap.yaml"

# Create Secrets (note: these are example secrets - update for production)
echo "📝 Creating Secrets"
kubectl apply -f "$K8S_DIR/secrets.yaml"

# Create Persistent Volume Claims
echo "📝 Creating Persistent Volume Claims"
kubectl apply -f "$K8S_DIR/redis-pvc.yaml"
kubectl apply -f "$K8S_DIR/backend-pvc.yaml"
kubectl apply -f "$K8S_DIR/ai-ml-pvc.yaml"

# Deploy Redis
echo "🚀 Deploying Redis"
kubectl apply -f "$K8S_DIR/redis-deployment.yaml"
kubectl apply -f "$K8S_DIR/redis-service.yaml"

# Deploy Backend
echo "🚀 Deploying Backend"
kubectl apply -f "$K8S_DIR/backend-deployment.yaml"
kubectl apply -f "$K8S_DIR/backend-service.yaml"

# Deploy AI/ML Service
echo "🚀 Deploying AI/ML Service"
kubectl apply -f "$K8S_DIR/ai-ml-deployment.yaml"
kubectl apply -f "$K8S_DIR/ai-ml-service.yaml"

# Deploy Gateway
echo "🚀 Deploying Gateway"
kubectl apply -f "$K8S_DIR/gateway-deployment.yaml"
kubectl apply -f "$K8S_DIR/gateway-service.yaml"

# Deploy HPA
echo "🚀 Deploying Horizontal Pod Autoscalers"
kubectl apply -f "$K8S_DIR/hpa.yaml"

# Deploy Ingress
echo "🚀 Deploying Ingress"
kubectl apply -f "$K8S_DIR/ingress.yaml"

echo ""
echo "================================"
echo "✅ Deployment completed successfully!"
echo "================================"
echo ""
echo "📝 Next steps:"
echo "   - Check pod status: kubectl get pods -n $NAMESPACE"
echo "   - Check services: kubectl get services -n $NAMESPACE"
echo "   - Check HPA status: kubectl get hpa -n $NAMESPACE"
echo "   - View logs: kubectl logs -n $NAMESPACE -l app=gateway --tail=50"
echo "   - Access services via Ingress hosts configured in ingress.yaml"
echo ""
echo "⚠️  Note: Before production deployment:"
echo "   - Update secrets in k8s/secrets.yaml with real values"
echo "   - Build and push Docker images to your registry"
echo "   - Update image names in deployment manifests"
echo "   - Configure TLS/SSL certificates for Ingress"
echo "   - Review and adjust resource limits based on your requirements"