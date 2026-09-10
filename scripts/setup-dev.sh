#!/bin/bash

# CSCM Development Setup Script
# This script automates the local development environment setup

set -e

echo "🚀 Setting up CSCM Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    print_info "Checking Docker installation..."
    if command -v docker &> /dev/null; then
        print_success "Docker is installed"
        docker --version
    else
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_info "Checking Docker Compose installation..."
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose is installed"
        docker compose version || docker-compose --version
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check if Node.js is installed
check_nodejs() {
    print_info "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        print_success "Node.js is installed"
        node --version
    else
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
}

# Check if Python is installed
check_python() {
    print_info "Checking Python installation..."
    if command -v python3 &> /dev/null || command -v python &> /dev/null; then
        print_success "Python is installed"
        python3 --version || python --version
    else
        print_error "Python is not installed. Please install Python first."
        exit 1
    fi
}

# Setup Backend
setup_backend() {
    print_info "Setting up Backend..."
    cd backend
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing backend dependencies..."
        npm install
        print_success "Backend dependencies installed"
    else
        print_success "Backend dependencies already installed"
    fi
    
    if [ ! -f ".env" ]; then
        print_info "Creating .env file from .env.example..."
        cp .env.example .env
        print_success ".env file created"
    else
        print_success ".env file already exists"
    fi
    
    cd ..
}

# Setup AI/ML
setup_ai_ml() {
    print_info "Setting up AI/ML..."
    cd ai-ml
    
    if [ ! -d "venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv venv || python -m venv venv
        print_success "Virtual environment created"
    else
        print_success "Virtual environment already exists"
    fi
    
    print_info "Activating virtual environment and installing dependencies..."
    source venv/bin/activate || venv\\Scripts\\activate
    pip install -r requirements.txt
    print_success "AI/ML dependencies installed"
    
    cd ..
}

# Setup Mobile App
setup_mobile() {
    print_info "Setting up Mobile App..."
    cd App
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing mobile app dependencies..."
        npm install
        print_success "Mobile app dependencies installed"
    else
        print_success "Mobile app dependencies already installed"
    fi
    
    cd ..
}

# Setup Development Dashboard
setup_dev_dashboard() {
    print_info "Setting up Development Dashboard..."
    cd dev-dashboard
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing dashboard dependencies..."
        npm install
        print_success "Dashboard dependencies installed"
    else
        print_success "Dashboard dependencies already installed"
    fi
    
    cd ..
}

# Setup Mock Server
setup_mock_server() {
    print_info "Setting up Mock Server..."
    cd mock-server
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing mock server dependencies..."
        npm install
        print_success "Mock server dependencies installed"
    else
        print_success "Mock server dependencies already installed"
    fi
    
    cd ..
}

# Initialize Database
init_database() {
    print_info "Initializing database..."
    cd backend
    
    if [ -f "src/storage/sqliteDatabase.js" ]; then
        print_info "Running database initialization..."
        node src/storage/demoSqlite.js
        print_success "Database initialized"
    else
        print_error "Database initialization script not found"
    fi
    
    cd ..
}

# Main setup process
main() {
    check_docker
    check_docker_compose
    check_nodejs
    check_python
    
    echo ""
    print_info "Starting setup process..."
    echo ""
    
    setup_backend
    setup_ai_ml
    setup_mobile
    setup_dev_dashboard
    setup_mock_server
    
    echo ""
    init_database
    
    echo ""
    print_success "Development environment setup complete!"
    echo ""
    print_info "To start the development environment, run:"
    echo "  ./scripts/start-dev.sh"
    echo ""
    print_info "Or use Docker Compose directly:"
    echo "  docker compose -f docker-compose.dev.yml up"
    echo ""
}

# Run main function
main
