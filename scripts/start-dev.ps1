# CSCM Development Startup Script (PowerShell)
# This script starts all development services

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting CSCM Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

function Print-Service {
    param([string]$Message)
    Write-Host "▶ $Message" -ForegroundColor Blue
}

# Check if Docker Compose file exists
if (-not (Test-Path "docker-compose.dev.yml")) {
    Write-Host "Error: docker-compose.dev.yml not found. Please run setup-dev.ps1 first." -ForegroundColor Red
    exit 1
}

# Start Docker Compose services
Print-Info "Starting Docker Compose services..."
docker compose -f docker-compose.dev.yml up -d

Print-Success "Docker Compose services started"

Write-Host ""
Print-Info "Waiting for services to be healthy..."
Write-Host ""

# Wait for services to be healthy
$MAX_RETRIES = 30
$RETRY_COUNT = 0

while ($RETRY_COUNT -lt $MAX_RETRIES) {
    $HEALTHY = $true
    
    # Check backend health
    $backendStatus = docker compose -f docker-compose.dev.yml ps backend --format json | ConvertFrom-Json
    if ($backendStatus.Health -ne "healthy") {
        $HEALTHY = $false
    }
    
    # Check AI/ML health
    $aimlStatus = docker compose -f docker-compose.dev.yml ps ai-ml --format json | ConvertFrom-Json
    if ($aimlStatus.Health -ne "healthy") {
        $HEALTHY = $false
    }
    
    # Check gateway health
    $gatewayStatus = docker compose -f docker-compose.dev.yml ps gateway --format json | ConvertFrom-Json
    if ($gatewayStatus.Health -ne "healthy") {
        $HEALTHY = $false
    }
    
    if ($HEALTHY) {
        Print-Success "All services are healthy"
        break
    }
    
    $RETRY_COUNT++
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
}

Write-Host ""

if ($RETRY_COUNT -eq $MAX_RETRIES) {
    Write-Host "Warning: Services did not become healthy within expected time" -ForegroundColor Yellow
    Write-Host "Check service logs with: docker compose -f docker-compose.dev.yml logs"
}

Write-Host ""
Print-Success "Development environment is ready!"
Write-Host ""
Print-Info "Service URLs:"
Print-Service "Backend API:       http://localhost:3000"
Print-Service "API Gateway:       http://localhost:8080"
Print-Service "AI/ML Service:     http://localhost:8000"
Print-Service "Development Dashboard: http://localhost:3002"
Print-Service "Redis:             localhost:6379"
Write-Host ""
Print-Info "To view logs:"
Write-Host "  docker compose -f docker-compose.dev.yml logs -f"
Write-Host ""
Print-Info "To stop all services:"
Write-Host "  docker compose -f docker-compose.dev.yml down"
Write-Host ""
Print-Info "To restart a specific service:"
Write-Host "  docker compose -f docker-compose.dev.yml restart <service-name>"
Write-Host ""
