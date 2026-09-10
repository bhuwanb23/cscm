# CSCM Development Setup Script (PowerShell)
# This script automates the local development environment setup

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up CSCM Development Environment..." -ForegroundColor Cyan
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

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Check if Docker is installed
function Check-Docker {
    Print-Info "Checking Docker installation..."
    try {
        docker --version | Out-Null
        Print-Success "Docker is installed"
        docker --version
    }
    catch {
        Print-Error "Docker is not installed. Please install Docker first."
        exit 1
    }
}

# Check if Docker Compose is installed
function Check-DockerCompose {
    Print-Info "Checking Docker Compose installation..."
    try {
        docker compose version | Out-Null
        Print-Success "Docker Compose is installed"
        docker compose version
    }
    catch {
        Print-Error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    }
}

# Check if Node.js is installed
function Check-NodeJS {
    Print-Info "Checking Node.js installation..."
    try {
        node --version | Out-Null
        Print-Success "Node.js is installed"
        node --version
    }
    catch {
        Print-Error "Node.js is not installed. Please install Node.js first."
        exit 1
    }
}

# Check if Python is installed
function Check-Python {
    Print-Info "Checking Python installation..."
    try {
        python --version | Out-Null
        Print-Success "Python is installed"
        python --version
    }
    catch {
        Print-Error "Python is not installed. Please install Python first."
        exit 1
    }
}

# Setup Backend
function Setup-Backend {
    Print-Info "Setting up Backend..."
    Push-Location backend
    
    if (-not (Test-Path "node_modules")) {
        Print-Info "Installing backend dependencies..."
        npm install
        Print-Success "Backend dependencies installed"
    }
    else {
        Print-Success "Backend dependencies already installed"
    }
    
    if (-not (Test-Path ".env")) {
        Print-Info "Creating .env file from .env.example..."
        Copy-Item .env.example .env
        Print-Success ".env file created"
    }
    else {
        Print-Success ".env file already exists"
    }
    
    Pop-Location
}

# Setup AI/ML
function Setup-AIML {
    Print-Info "Setting up AI/ML..."
    Push-Location ai-ml
    
    if (-not (Test-Path "venv")) {
        Print-Info "Creating Python virtual environment..."
        python -m venv venv
        Print-Success "Virtual environment created"
    }
    else {
        Print-Success "Virtual environment already exists"
    }
    
    Print-Info "Activating virtual environment and installing dependencies..."
    & ".\venv\Scripts\Activate.ps1"
    pip install -r requirements.txt
    Print-Success "AI/ML dependencies installed"
    
    Pop-Location
}

# Setup Mobile App
function Setup-Mobile {
    Print-Info "Setting up Mobile App..."
    Push-Location App
    
    if (-not (Test-Path "node_modules")) {
        Print-Info "Installing mobile app dependencies..."
        npm install
        Print-Success "Mobile app dependencies installed"
    }
    else {
        Print-Success "Mobile app dependencies already installed"
    }
    
    Pop-Location
}

# Setup Development Dashboard
function Setup-DevDashboard {
    Print-Info "Setting up Development Dashboard..."
    Push-Location dev-dashboard
    
    if (-not (Test-Path "node_modules")) {
        Print-Info "Installing dashboard dependencies..."
        npm install
        Print-Success "Dashboard dependencies installed"
    }
    else {
        Print-Success "Dashboard dependencies already installed"
    }
    
    Pop-Location
}

# Setup Mock Server
function Setup-MockServer {
    Print-Info "Setting up Mock Server..."
    Push-Location mock-server
    
    if (-not (Test-Path "node_modules")) {
        Print-Info "Installing mock server dependencies..."
        npm install
        Print-Success "Mock server dependencies installed"
    }
    else {
        Print-Success "Mock server dependencies already installed"
    }
    
    Pop-Location
}

# Initialize Database
function Initialize-Database {
    Print-Info "Initializing database..."
    Push-Location backend
    
    if (Test-Path "src/storage/demoSqlite.js") {
        Print-Info "Running database initialization..."
        node src/storage/demoSqlite.js
        Print-Success "Database initialized"
    }
    else {
        Print-Error "Database initialization script not found"
    }
    
    Pop-Location
}

# Main setup process
function Main {
    Check-Docker
    Check-DockerCompose
    Check-NodeJS
    Check-Python
    
    Write-Host ""
    Print-Info "Starting setup process..."
    Write-Host ""
    
    Setup-Backend
    Setup-AIML
    Setup-Mobile
    Setup-DevDashboard
    Setup-MockServer
    
    Write-Host ""
    Initialize-Database
    
    Write-Host ""
    Print-Success "Development environment setup complete!"
    Write-Host ""
    Print-Info "To start the development environment, run:"
    Write-Host "  .\scripts\start-dev.ps1"
    Write-Host ""
    Print-Info "Or use Docker Compose directly:"
    Write-Host "  docker compose -f docker-compose.dev.yml up"
    Write-Host ""
}

# Run main function
Main
