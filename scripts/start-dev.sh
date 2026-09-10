#!/bin/bash

# CSCM Development Startup Script
# This script starts all development services

set -e

echo "🚀 Starting CSCM Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_service() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Check if Docker Compose file exists
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "Error: docker-compose.dev.yml not found. Please run setup-dev.sh first."
    exit 1
fi

# Start Docker Compose services
print_info "Starting Docker Compose services..."
docker compose -f docker-compose.dev.yml up -d

print_success "Docker Compose services started"

echo ""
print_info "Waiting for services to be healthy..."
echo ""

# Wait for services to be healthy
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HEALTHY=true
    
    # Check backend health
    if ! docker compose -f docker-compose.dev.yml ps backend | grep -q "healthy"; then
        HEALTHY=false
    fi
    
    # Check AI/ML health
    if ! docker compose -f docker-compose.dev.yml ps ai-ml | grep -q "healthy"; then
        HEALTHY=false
    fi
    
    # Check gateway health
    if ! docker compose -f docker-compose.dev.yml ps gateway | grep -q "healthy"; then
        HEALTHY=false
    fi
    
    if [ "$HEALTHY" = true ]; then
        print_success "All services are healthy"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

echo ""

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Warning: Services did not become healthy within expected time"
    echo "Check service logs with: docker compose -f docker-compose.dev.yml logs"
fi

echo ""
print_success "Development environment is ready!"
echo ""
print_info "Service URLs:"
print_service "Backend API:       http://localhost:3000"
print_service "API Gateway:       http://localhost:8080"
print_service "AI/ML Service:     http://localhost:8000"
print_service "Development Dashboard: http://localhost:3002"
print_service "Redis:             localhost:6379"
echo ""
print_info "To view logs:"
echo "  docker compose -f docker-compose.dev.yml logs -f"
echo ""
print_info "To stop all services:"
echo "  docker compose -f docker-compose.dev.yml down"
echo ""
print_info "To restart a specific service:"
echo "  docker compose -f docker-compose.dev.yml restart <service-name>"
echo ""
