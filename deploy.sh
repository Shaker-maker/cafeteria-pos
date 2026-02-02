#!/bin/bash

# Cafeteria POS System - Automated Deployment Script
# This script sets up the complete POS system in minutes

set -e  # Exit on any error

echo "🍽️  Cafeteria POS System - Automated Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."
echo ""

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed!"
    echo ""
    echo "Please install Node.js from https://nodejs.org"
    echo "Download the LTS (Long Term Support) version."
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm is installed: $NPM_VERSION"
else
    print_error "npm is not installed!"
    exit 1
fi

echo ""

# Step 2: Install backend dependencies
echo "Step 2: Installing backend dependencies..."
echo ""

cd backend

if [ -f "package.json" ]; then
    print_info "Installing Node.js packages (this may take a minute)..."
    npm install
    print_success "Backend dependencies installed"
else
    print_error "package.json not found in backend directory"
    exit 1
fi

cd ..
echo ""

# Step 3: Set up environment configuration
echo "Step 3: Setting up configuration..."
echo ""

if [ ! -f "backend/.env" ]; then
    print_info "Creating .env configuration file..."
    cp backend/.env.example backend/.env
    print_success "Configuration file created"
    print_warning "Remember to edit backend/.env with your M-Pesa credentials later"
else
    print_info ".env file already exists, skipping..."
fi

echo ""

# Step 4: Test the server
echo "Step 4: Testing server setup..."
echo ""

print_info "Starting test server..."
cd backend
timeout 5 node server.js &> /dev/null &
SERVER_PID=$!
sleep 3

# Check if server is running
if kill -0 $SERVER_PID 2> /dev/null; then
    print_success "Server test passed!"
    kill $SERVER_PID 2> /dev/null
else
    print_error "Server test failed"
fi

cd ..
echo ""

# Step 5: Installation complete
echo "=========================================="
echo "🎉 Installation Complete!"
echo "=========================================="
echo ""

print_success "Cafeteria POS System is ready to use!"
echo ""

echo "📋 Next Steps:"
echo ""
echo "1. Configure M-Pesa Integration (Optional):"
echo "   - Edit: backend/.env"
echo "   - Add your Daraja API credentials"
echo "   - Get credentials from: https://developer.safaricom.co.ke"
echo ""
echo "2. Start the server:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "3. Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "4. Quick Test (No Server Required):"
echo "   - Open: frontend/offline.html in any browser"
echo "   - Works immediately, no setup needed!"
echo ""

echo "📚 Documentation:"
echo "   - README.md - Overview and features"
echo "   - docs/SETUP_GUIDE.md - Detailed setup instructions"
echo "   - docs/DEMO_SCRIPT.md - Presentation guide"
echo ""

echo "🆘 Need Help?"
echo "   - Check: docs/SETUP_GUIDE.md#troubleshooting"
echo "   - Run: cd backend && npm start"
echo "   - Visit: http://localhost:3000"
echo ""

print_warning "Note: For M-Pesa integration, you'll need:"
print_warning "  - Safaricom Daraja API account (free)"
print_warning "  - M-Pesa Till or Paybill number"
print_warning "  - Edit backend/.env with your credentials"
echo ""

echo "=========================================="
echo "Happy Selling! 🍽️💰"
echo "=========================================="
